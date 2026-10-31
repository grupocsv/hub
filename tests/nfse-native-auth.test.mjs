import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {extname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from '@playwright/test';

const root=resolve(fileURLToPath(new URL('../',import.meta.url)));
const publicRoot=resolve(root,process.env.NFSE_PUBLIC_ROOT||'docs/public');

test('login nativo atravessa a CSP da NFS-e e inicia a sessão individual',async()=>{
 const server=createServer(async(req,res)=>{
  try{
   let path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);if(path.endsWith('/'))path+='index.html';
   let file=resolve(publicRoot,'.'+path);if(!file.startsWith(publicRoot+'/'))throw Error('path');
   try{await stat(file);}catch(error){if(process.env.NFSE_PUBLIC_ROOT)throw error;file=resolve(root,'.'+path);}
   if(!file.startsWith(root+'/'))throw Error('path');
   res.writeHead(200,{'Content-Type':({'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.otf':'font/otf'})[extname(file)]??'application/octet-stream'});res.end(await readFile(file));
  }catch{res.writeHead(404);res.end('Not found');}
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const context=await browser.newContext({locale:'pt-BR'}),page=await context.newPage();
 page.setDefaultTimeout(5000);
 const calls=[],errors=[],token='synthetic_native_individual_session_token',email='owner@example.test';
 try{
  page.on('pageerror',error=>errors.push(error.message));
  await page.addInitScript(()=>{window.nativeAuthCspViolations=[];document.addEventListener('securitypolicyviolation',event=>{if(event.effectiveDirective==='connect-src')window.nativeAuthCspViolations.push({directive:event.effectiveDirective,blocked_uri:event.blockedURI});});});
  // Todas as chamadas HTTPS são interceptadas. Nenhuma credencial ou requisição de login sai deste teste.
  await page.route('https://**/*',async route=>{
   const request=route.request(),url=new URL(request.url()),headers={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'content-type,x-auth-token','Access-Control-Allow-Methods':'GET,POST,OPTIONS'};
   if(request.method()==='OPTIONS'){await route.fulfill({status:204,headers});return;}
   calls.push({host:url.hostname,path:url.pathname,method:request.method(),token:request.headers()['x-auth-token']});
   if(url.origin==='https://csv-auth.guilherme-thom.workers.dev'&&url.pathname==='/login'){
    assert.deepEqual(request.postDataJSON(),{portal:'grupo-csv',email,password:'synthetic-password'});
    await route.fulfill({headers,json:{success:true,token,email,expires_at:'2099-01-01T00:00:00Z'}});return;
   }
   if(url.origin==='https://csv-auth.guilherme-thom.workers.dev'&&url.pathname==='/verify'){
    assert.equal(request.headers()['x-auth-token'],token);
    await route.fulfill({headers,json:{valid:true,portal:'grupo-csv',email,auth_mode:'individual',expires_at:'2099-01-01T00:00:00Z'}});return;
   }
   if(url.origin==='https://api.grupocsv.com'&&url.pathname.startsWith('/nfse/v2/')){
    assert.equal(request.headers()['x-auth-token'],token);
    const path=url.pathname.slice('/nfse/v2/'.length);
    const data=path==='meta'?{environment:'test',capabilities:{read:true,approve:true,emit:false}}:path==='companies'?[{company_id:'synthetic',name:'Empresa de teste',status:'pending_configuration',readiness:{can_simulate:false,can_emit:false}}]:path==='overview'?{counts:{prepared:0,approved:0,processing:0,authorized:0},amounts:{gross_amount_cents:0,net_amount_cents:0},history_coverage:{status:'not_synchronized',companies:[]}}:[];
    await route.fulfill({headers,json:{data,meta:{next_cursor:null}}});return;
   }
   throw Error('Requisição externa não prevista: '+url.origin+url.pathname);
  });
  await page.goto('http://127.0.0.1:'+server.address().port+'/grupo-csv/nfse/');
  await page.getByRole('button',{name:'Entrar',exact:true}).waitFor();
  assert.equal(calls.length,0,'A página anônima não consulta dados fiscais.');
  await page.locator('#ha-email').fill(email);await page.locator('#ha-password').fill('synthetic-password');await page.getByRole('button',{name:'Entrar',exact:true}).click();
  await page.waitForFunction(()=>!document.getElementById('hub-auth-overlay')||Boolean(document.getElementById('ha-error')?.textContent));
  assert.equal(calls.filter(call=>call.path==='/login').length,1,'O login nativo precisa alcançar a rota sintética através da CSP.');
  assert.equal(calls.filter(call=>call.path==='/verify').length,1,'A sessão retornada precisa ser validada antes de abrir a área fiscal.');
  await page.getByText('Seu calendário começa aqui',{exact:true}).waitFor();
  assert.equal(await page.locator('#hub-auth-overlay').count(),0);
  assert.equal(await page.evaluate(async()=>(await window.HUB_AUTH_READY).status),'valid');
  assert.ok(calls.some(call=>call.path==='/nfse/v2/overview'&&call.token===token));
  assert.deepEqual(await page.evaluate(()=>window.nativeAuthCspViolations),[]);assert.deepEqual(errors,[]);
 }finally{await context.close();await browser.close();await new Promise(resolve=>server.close(resolve));}
});
