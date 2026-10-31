import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, stat, mkdir } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const root = fileURLToPath(new URL('../', import.meta.url));
const publicRoot = resolve(root, process.env.NFSE_PUBLIC_ROOT || 'docs/public');
let server, browser, origin;
before(async () => {
  server = createServer(async (req,res) => {
    try {
      let path = decodeURIComponent(new URL(req.url,'http://localhost').pathname);
      if(path.endsWith('/'))path+='index.html';
      let file=resolve(publicRoot,'.'+path);
      if(!file.startsWith(publicRoot+'/'))throw new Error('path');
      try{await stat(file);}catch(error){if(process.env.NFSE_PUBLIC_ROOT)throw error;file=resolve(root,'.'+path);}
      if(!file.startsWith(root))throw new Error('path');
      const data=await readFile(file);
      res.writeHead(200,{'Content-Type':({'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.otf':'font/otf'})[extname(file)]??'application/octet-stream'});res.end(data);
    }catch{res.writeHead(404);res.end('Not found');}
  });
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  origin=`http://127.0.0.1:${server.address().port}`;
  browser=await chromium.launch({headless:true,args:['--no-sandbox']});
});
after(async()=>{await browser?.close();await new Promise(r=>server?.close(r));});

async function pageFixture({valid=true, fail=false, mobile=false}={}) {
  const context=await browser.newContext({locale:'pt-BR',viewport:mobile?{width:390,height:844}:{width:1440,height:1000}}),page=await context.newPage();
  page.setDefaultTimeout(6000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const state={rules:[],clients:[],requests:0,posts:[]};
  const companies=['AxiaCare','TheraTech','MedValor'].map((name,i)=>({company_id:['axiacare','theratech','medvalor'][i],name,status:'pending_configuration',readiness:{can_simulate:false,can_emit:false,blockers:[{code:'profile_missing',message:'Cadastro fiscal aguardando validação.'}]}}));
  await page.route('**/scripts/hub-auth.js',route=>route.fulfill({contentType:'text/javascript',body:`window.HUB_AUTH_API={fetch:(u,o)=>fetch(u,o)};window.HUB_AUTH_READY=Promise.resolve({status:'${valid?'valid':'required'}'});`}));
  await page.route('https://api.grupocsv.com/**',async route=>{
    state.requests++;
    const request=route.request(),headers={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'content-type,idempotency-key','Access-Control-Allow-Methods':'GET,POST,OPTIONS'};
    if(request.method()==='OPTIONS'){await route.fulfill({status:204,headers});return;}
    if(fail){await route.fulfill({status:503,headers,json:{error:{message:'Serviço temporariamente indisponível.'}}});return;}
    const url=new URL(request.url()),path=url.pathname.replace('/nfse/v2/','');let data;
    if(request.method()==='POST'){
      const body=request.postDataJSON();state.posts.push({path,body,key:request.headers()['idempotency-key']});
      if(path==='calendar-rules'){data={...body,rule_id:'rule-test-1',version:1};state.rules.push(data);}
      else if(path==='clients'){data={...body,client_id:'synthetic-client',status:'active',secret_available:true,secret:'synthetic_secret_for_browser_test_only'};state.clients.push({...body,client_id:data.client_id,status:'active'});}
      else if(path==='calendar-rules/rule-test-1/archive'){data={...state.rules[0],status:'archived',version:body.expected_version+1};state.rules=[];}
      else if(path==='calendar-rules/rule-test-1'){data={...body,rule_id:'rule-test-1',version:body.expected_version+1};state.rules=[data];}
      else {await route.fulfill({status:400,headers,json:{error:{message:'Ação não prevista no teste.'}}});return;}
    }else if(path==='meta')data={environment:'test',capabilities:{emit:false}};
    else if(path==='companies')data=companies;
    else if(path==='overview')data={counts:{prepared:0,approved:0,processing:0,authorized:0,pending:0},amounts:{gross_amount_cents:0,federal_total_cents:0,net_amount_cents:0},history_coverage:{status:'not_synchronized',last_synced_at:null},emission_enabled:false};
    else if(path==='calendar-rules')data=state.rules.filter(r=>!url.searchParams.get('company_id')||r.company_id===url.searchParams.get('company_id'));
    else if(path==='clients')data=state.clients;
    else data=[];
    await route.fulfill({status:200,headers,json:{data,meta:{request_id:'synthetic-request',next_cursor:null}}});
  });
  await page.goto(origin+'/grupo-csv/nfse/');
  return {context,page,state,errors};
}

test('aguarda sessão individual e acompanha login sem recarregar a página',async()=>{
  const f=await pageFixture({valid:false});try{
    await f.page.getByText('Entre para acessar suas emissões').waitFor();assert.equal(f.state.requests,0);
    await f.page.evaluate(()=>{window.HUB_AUTH_READY=Promise.resolve({status:'valid'});});
    await f.page.getByText('Seu calendário começa aqui').waitFor();assert.ok(f.state.requests>=6);assert.deepEqual(f.errors,[]);
    await f.page.locator('[data-view="calendar"]').click();await f.page.getByRole('button',{name:'Nova regra',exact:true}).click();
    await f.page.getByLabel('Nome da emissão').fill('Conteúdo privado temporário');
    await f.page.evaluate(()=>{window.HUB_AUTH_READY=Promise.resolve({status:'required'});});
    await f.page.getByText('Entre para acessar suas emissões').waitFor();
    assert.equal(await f.page.locator('dialog[open]').count(),0);assert.equal(await f.page.locator('#editor-fields').textContent(),'');
  }finally{await f.context.close();}
});

test('cria, edita e pausa regra mantendo a persistência ao recarregar',async()=>{
  const f=await pageFixture();try{
    await f.page.getByText('Seu calendário começa aqui').waitFor();
    await f.page.locator('[data-view="calendar"]').click();await f.page.getByRole('button',{name:'Nova regra',exact:true}).click();
    await f.page.getByLabel('Nome da emissão').fill('Cobrança de teste');await f.page.getByLabel('Empresa',{exact:true}).last().selectOption('theratech');
    await f.page.getByLabel('Dia previsto no mês').fill('31');await f.page.getByLabel('Valor',{exact:true}).selectOption('fixed');await f.page.getByLabel('Valor bruto (R$)').fill('8.055,01');
    await f.page.getByRole('button',{name:'Salvar regra'}).click();await f.page.getByText('Cobrança de teste',{exact:true}).waitFor();
    assert.equal(f.state.posts[0].body.gross_amount_cents,805501);assert.equal(f.state.posts[0].body.company_id,'theratech');
    await f.page.getByRole('button',{name:'Editar',exact:true}).click();await f.page.getByLabel('Nome da emissão').fill('Cobrança editada');await f.page.getByRole('button',{name:'Salvar regra'}).click();
    await f.page.getByText('Cobrança editada',{exact:true}).waitFor();assert.equal(f.state.posts[1].body.expected_version,1);
    await f.page.getByRole('button',{name:'Pausar',exact:true}).click();await f.page.locator('#content').getByText('Pausada',{exact:true}).waitFor();
    await f.page.reload();await f.page.getByText('Seu calendário começa aqui').waitFor();await f.page.locator('[data-view="calendar"]').click();await f.page.getByText('Cobrança editada',{exact:true}).waitFor();
    assert.equal(f.state.rules[0].status,'paused');assert.deepEqual(f.errors,[]);
  }finally{await f.context.close();}
});

test('erro de API não é apresentado como ausência de notas',async()=>{
  const f=await pageFixture({fail:true});try{await f.page.getByText('Informações indisponíveis',{exact:true}).waitFor();assert.equal(await f.page.getByText('Seu calendário começa aqui').count(),0);assert.deepEqual(f.errors,[]);}finally{await f.context.close();}
});

test('altera mês de planejamento e arquiva regra sem apagar seu histórico',async()=>{
  const f=await pageFixture();try{
    await f.page.getByText('Seu calendário começa aqui').waitFor();
    await f.page.getByLabel('Mês de planejamento').fill('2027-02');
    await f.page.getByText('Planejamento de 02/2027').waitFor();
    await f.page.locator('[data-view="calendar"]').click();await f.page.getByRole('button',{name:'Nova regra',exact:true}).click();
    await f.page.getByLabel('Nome da emissão').fill('Regra para arquivar');await f.page.getByRole('button',{name:'Salvar regra'}).click();
    await f.page.getByRole('button',{name:'Arquivar',exact:true}).click();
    await f.page.getByRole('button',{name:'Confirmar arquivamento',exact:true}).click();
    await f.page.getByText('Nenhuma regra cadastrada').waitFor();
    assert.equal(f.state.posts.at(-1).path,'calendar-rules/rule-test-1/archive');assert.deepEqual(f.errors,[]);
  }finally{await f.context.close();}
});

test('cria conexão e exibe chave uma vez sem conservá-la no DOM depois de fechar',async()=>{
  const f=await pageFixture();try{
    await f.page.getByText('Seu calendário começa aqui').waitFor();await f.page.locator('[data-view="connections"]').click();
    await f.page.getByRole('button',{name:'Nova conexão'}).click();await f.page.getByLabel('Nome do aplicativo').fill('Claude Cowork');
    await f.page.getByRole('button',{name:'Gerar chave'}).click();
    const key=f.page.getByLabel('Chave de acesso (exibida uma vez)');await key.waitFor();assert.equal(await key.inputValue(),'synthetic_secret_for_browser_test_only');
    await f.page.getByRole('button',{name:'Fechar',exact:true}).click();
    assert.equal(await f.page.getByLabel('Chave de acesso (exibida uma vez)').count(),0);
    await f.page.getByText('Claude Cowork',{exact:true}).waitFor();assert.deepEqual(f.errors,[]);
  }finally{await f.context.close();}
});

test('layout móvel preserva conteúdo e não habilita emissão sem configuração',async()=>{
  const f=await pageFixture({mobile:true});try{
    await f.page.getByText('Seu calendário começa aqui').waitFor();assert.equal(await f.page.locator('#prepare').isDisabled(),true);
    assert.equal(await f.page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),true);
    await f.page.locator('[data-view="companies"]').click();await f.page.getByRole('heading',{name:'TheraTech',exact:true}).waitFor();
    assert.equal(await f.page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),true);assert.deepEqual(f.errors,[]);
  }finally{await f.context.close();}
});

test('gera evidência visual local com configuração pendente e sem dados reais',async()=>{
  const f=await pageFixture();try{await f.page.getByText('Seu calendário começa aqui').waitFor();const out=resolve(root,process.env.NFSE_SCREENSHOT_DIR || 'test-results/nfse');await mkdir(out,{recursive:true});await f.page.screenshot({path:resolve(out,'Previa-local-NFSe-Grupo-CSV.png'),fullPage:true});assert.deepEqual(f.errors,[]);}finally{await f.context.close();}
});
