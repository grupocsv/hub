// Integração em navegador isolado. Local: HTTP de loopback dos artefatos.
// --live: lê a publicação real, sem interceptar respostas ou enviar formulários.
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import http from 'node:http';
import {createRequire} from 'node:module';
const require=createRequire(process.env.JORNADA_RUNTIME_PACKAGE||import.meta.url);
const {chromium}=require('playwright');
const [packagePath,outputPath,...flags]=process.argv.slice(2);
if(!packagePath||!outputPath)throw Error('Uso: node verify-browser.mjs PACKAGE OUTPUT [--live]');
const live=flags.includes('--live');
const manifest=JSON.parse(await fs.readFile(path.join(packagePath,'build-manifest.json'),'utf8'));
const points=JSON.parse(await fs.readFile(new URL('./points.json',import.meta.url),'utf8'));
let url='https://open.grupocsv.com/jornada-tea/';let server;
if(!live){
  const html=await fs.readFile(path.join(packagePath,'index.html'));const png=await fs.readFile(path.join(packagePath,manifest.image.name));
  server=http.createServer((request,response)=>{
    const pathname=new URL(request.url,'http://localhost').pathname;
    if(pathname==='/jornada-tea/'){response.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});response.end(html);}
    else if(pathname==='/jornada-tea/'+manifest.image.name){response.writeHead(200,{'Content-Type':'image/png','Content-Length':png.length});response.end(png);}
    else{response.writeHead(404);response.end();}
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));url=`http://127.0.0.1:${server.address().port}/jornada-tea/`;
}
await fs.mkdir(outputPath,{recursive:true});
const browser=await chromium.launch({headless:true,...(process.env.JORNADA_BROWSER_CHANNEL?{channel:process.env.JORNADA_BROWSER_CHANNEL}:{})});
const report={mode:live?'produção real':'artefatos locais por HTTP em loopback',time:new Date().toISOString(),url,output_sha256:manifest.output_sha256,browser:browser.version(),allPassed:false,results:[],limitations:[
  'Chromium com tamanhos de viewport emulados; não equivale a aparelhos físicos ou Safari móvel.',
  'Swipe móvel emulado por eventos de toque do Chromium; não mede conforto ou precisão de toque de pessoas reais.',
  'A ausência de rolagem própria é aferida no mapa inline. O popover pode rolar em viewport curto e a imagem separada conserva o visualizador do navegador.',
  'Não testa autenticação: a jornada oficial e o download permanecem públicos.',
]};

async function inlineProof(page,label){
  const proof=await page.evaluate(()=>{
    const frame=document.querySelector('.ji-frame'),canvas=document.querySelector('.ji-canvas'),svg=canvas.querySelector(':scope > svg');
    const box=element=>{const r=element.getBoundingClientRect(),s=getComputedStyle(element);return {left:r.left,right:r.right,width:r.width,height:r.height,clientWidth:element.clientWidth,clientHeight:element.clientHeight,scrollWidth:element.scrollWidth,scrollHeight:element.scrollHeight,scrollLeft:element.scrollLeft,scrollTop:element.scrollTop,overflowX:s.overflowX,overflowY:s.overflowY,maxHeight:s.maxHeight};};
    const before={frame:box(frame),canvas:box(canvas),svg:box(svg)};
    frame.scrollTo({left:123,top:123,behavior:'instant'});
    return {...before,attemptedFrameScroll:{left:frame.scrollLeft,top:frame.scrollTop},documentWidth:document.documentElement.clientWidth,documentScroll:document.documentElement.scrollWidth,oldZoomControls:document.querySelectorAll('.ji-zoom,.ji-zoom-value,.ji-fit').length};
  });
  assert(proof.documentScroll<=proof.documentWidth+1,`${label}: a página tem overflow horizontal`);
  assert.equal(proof.oldZoomControls,0,`${label}: controles de zoom interno ainda existem`);
  assert.equal(proof.frame.maxHeight,'none',`${label}: altura do mapa continua limitada`);
  assert.equal(proof.frame.overflowX,'visible',`${label}: mapa ainda é contêiner horizontal independente`);
  assert.equal(proof.frame.overflowY,'visible',`${label}: mapa ainda é contêiner vertical independente`);
  for(const name of ['frame','canvas']){
    const box=proof[name];assert(box.left>=-1&&box.right<=proof.documentWidth+1,`${label}: ${name} sai da largura da página`);
    assert(box.scrollWidth<=box.clientWidth+1,`${label}: ${name} contém largura excedente`);
    assert(box.scrollHeight<=box.clientHeight+1,`${label}: ${name} contém altura excedente`);
    assert.equal(box.scrollLeft,0,`${label}: ${name} deslocou horizontalmente`);assert.equal(box.scrollTop,0,`${label}: ${name} deslocou verticalmente`);
  }
  assert.deepEqual(proof.attemptedFrameScroll,{left:0,top:0},`${label}: mapa aceita rolagem independente`);
  assert(Math.abs(proof.svg.width-proof.canvas.width)<1,`${label}: SVG não ocupa a largura disponível`);
  assert(Math.abs(proof.svg.height-proof.svg.width*1375/1820)<1,`${label}: proporção original do mapa foi alterada`);
  return proof;
}
async function mapPosition(page){
  await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
  const rect=await page.locator('.ji-frame').boundingBox();
  if(rect.y>=await page.evaluate(()=>innerHeight-80))await page.evaluate(top=>window.scrollTo({top,behavior:'instant'}),rect.y-200);
  return page.locator('.ji-frame').evaluate(element=>{const r=element.getBoundingClientRect();return {x:r.left+Math.min(8,r.width/2),y:Math.min(innerHeight-30,r.bottom-12),top:r.top,bottom:r.bottom,windowY:scrollY,remaining:document.documentElement.scrollHeight-innerHeight-scrollY};});
}
async function wheelProof(page){
  const point=await mapPosition(page);assert(point.y>point.top&&point.y<point.bottom,'Não foi possível posicionar wheel sobre o mapa');
  if(point.remaining<2)return {needed:false,reason:'Todo o conteúdo abaixo do início do mapa já cabe no viewport'};
  await page.mouse.move(point.x,point.y);await page.keyboard.press('Escape');
  const before=await page.evaluate(()=>({page:scrollY,frame:document.querySelector('.ji-frame').scrollTop}));
  await page.mouse.wheel(0,220);await page.waitForFunction(value=>scrollY>value+1,before.page);
  const after=await page.evaluate(()=>({page:scrollY,frame:document.querySelector('.ji-frame').scrollTop,frameX:document.querySelector('.ji-frame').scrollLeft}));
  assert.equal(after.frame,0);assert.equal(after.frameX,0);return {needed:true,before,after};
}
async function swipeProof(page,context){
  const point=await mapPosition(page);if(point.remaining<2)return {needed:false,reason:'Todo o conteúdo já cabe no viewport'};
  const session=await context.newCDPSession(page);const before=await page.evaluate(()=>scrollY);
  try{
    await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:point.x,y:point.y}]});
    for(let step=1;step<=8;step++){
      await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:point.x,y:Math.max(40,point.y-step*20)}]});await page.waitForTimeout(16);
    }
    await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForFunction(value=>scrollY>value+1,before);
    const after=await page.evaluate(()=>({page:scrollY,frame:document.querySelector('.ji-frame').scrollTop,frameX:document.querySelector('.ji-frame').scrollLeft}));
    assert.equal(after.frame,0);assert.equal(after.frameX,0);return {needed:true,emulated:true,before,after};
  }finally{await session.detach();}
}

try{
  for(const width of [1440,768,390,320]){
    const height=width<861?844:960;
    const context=await browser.newContext({viewport:{width,height},hasTouch:width<861,deviceScaleFactor:1,acceptDownloads:true,serviceWorkers:'block',extraHTTPHeaders:{'Cache-Control':'no-cache'}});
    const page=await context.newPage();const errors=[];page.on('pageerror',error=>errors.push(error.message));
    const result={width,height,ok:false,pointsChecked:[]};report.results.push(result);
    try{
      const response=await page.goto(url,{waitUntil:'networkidle'});assert.equal(response.status(),200);
      await page.locator('#p1.ji-enhanced').waitFor();await page.evaluate(()=>document.fonts.ready);
      const invariant=await page.evaluate(()=>({points:document.querySelectorAll('.ji-hotspot').length,viewBox:document.querySelector('.ji-canvas > svg').getAttribute('viewBox'),images:[...document.images].every(image=>image.complete&&image.naturalWidth>0),masthead:document.querySelector('.masthead').outerHTML,svg:document.querySelector('.ji-canvas > svg').outerHTML}));
      assert.equal(invariant.points,points.length);assert.equal(invariant.viewBox,'0 0 1820 1375');assert.equal(invariant.images,true);
      result.inlineInitial=await inlineProof(page,'Inicial');result.wheel=await wheelProof(page);
      if(width===390)result.swipe=await swipeProof(page,context);
      const sample=width===390?points:points.filter(point=>['ccc','aad','evs'].includes(point.id));
      for(const point of sample){
        const before=await page.locator('.ji-canvas').boundingBox();await page.getByLabel('Escolha uma etapa do mapa',{exact:true}).selectOption(point.id);
        const dialog=page.getByRole('dialog');await dialog.waitFor({state:'visible'});
        assert.equal(await dialog.locator('h2').innerText(),point.title);assert.equal(await dialog.locator('p').innerText(),point.body);
        const box=await dialog.boundingBox();assert(box.x>=0&&box.x+box.width<=width+1&&box.y>=0&&box.y+box.height<=height+1);
        const geometry=await page.locator(`[data-ji-point="${point.id}"]`).evaluate((button,bounds)=>{const rect=button.getBoundingClientRect(),canvas=button.closest('.ji-canvas').getBoundingClientRect();return Math.max(Math.abs(rect.left-canvas.left-bounds[0]/1820*canvas.width),Math.abs(rect.top-canvas.top-bounds[1]/1375*canvas.height),Math.abs(rect.width-bounds[2]/1820*canvas.width),Math.abs(rect.height-bounds[3]/1375*canvas.height));},point.bounds);
        assert(geometry<1);const after=await page.locator('.ji-canvas').boundingBox();assert(Math.abs(before.width-after.width)<1,'Selecionar etapa ampliou o mapa');assert(Math.abs(before.height-after.height)<1,'Selecionar etapa mudou a altura do mapa');
        await inlineProof(page,`Etapa ${point.id}`);result.pointsChecked.push(point.id);
        if(point.id==='ccc')await page.screenshot({path:path.join(outputPath,`jornada-${width}.png`),animations:'disabled'});
        await page.keyboard.press('Escape');assert.equal(await dialog.isVisible(),false);
      }
      const hotspot=page.locator('[data-ji-point="ccc"]');await hotspot.focus();await page.getByRole('dialog').waitFor({state:'visible'});
      await page.keyboard.press('Enter');assert.equal(await page.getByRole('dialog').evaluate(element=>document.activeElement===element),true);
      await page.keyboard.press('Escape');assert.equal(await page.getByRole('dialog').isVisible(),false);assert.equal(await hotspot.evaluate(element=>document.activeElement===element),true);result.keyboard=true;
      if(width<861){
        await page.locator('.ji-select').focus();await page.keyboard.press('Escape');await hotspot.tap();await page.getByRole('dialog').waitFor({state:'visible'});await page.getByRole('button',{name:'Fechar explicação',exact:true}).click();assert.equal(await page.getByRole('dialog').isVisible(),false);result.touchPoint=true;
        const picker=await page.locator('.ji-select').boundingBox();assert(picker.height>=44&&picker.x>=0&&picker.x+picker.width<=width+1);result.accessiblePicker=true;
        await page.getByRole('button',{name:'Ver percurso em texto',exact:true}).click();await page.locator('#p1.ji-text-open').waitFor();assert.equal(await page.locator('.ji-frame').isVisible(),false);assert.equal(await page.locator('#p1 > .diagram-mobile').isVisible(),true);
        await page.getByRole('button',{name:'Voltar ao mapa interativo',exact:true}).click();await page.locator('.ji-frame').waitFor({state:'visible'});await inlineProof(page,'Retorno do percurso em texto');result.mobileText=true;
      }
      await page.getByLabel('Escolha uma etapa do mapa',{exact:true}).selectOption('ccc');await page.getByRole('button',{name:'Apoio Textual',exact:true}).click();assert.equal(await page.getByRole('dialog').isVisible(),false);await page.locator('#p2.active').waitFor();
      await page.getByRole('button',{name:'Diagrama',exact:true}).click();await inlineProof(page,'Retorno da aba Apoio Textual');result.originalTabs=true;
      await page.mouse.move(width-2,3);await page.keyboard.press('Escape');await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
      await page.screenshot({path:path.join(outputPath,`jornada-banda-${width}.png`),animations:'disabled',fullPage:true});
      if(width===390){
        const downloadPromise=page.waitForEvent('download');await page.getByRole('link',{name:'Baixar mapa',exact:true}).click();const download=await downloadPromise;const destination=path.join(outputPath,download.suggestedFilename());await download.saveAs(destination);const raw=await fs.readFile(destination);
        assert.equal(crypto.createHash('sha256').update(raw).digest('hex'),manifest.image.sha256);assert.equal(raw.readUInt32BE(16),3640);assert.equal(raw.readUInt32BE(20),2750);
        const popupPromise=context.waitForEvent('page');await page.getByRole('link',{name:'Abrir imagem',exact:true}).click();const popup=await popupPromise;await popup.waitForLoadState('load');assert.equal(popup.url(),url+manifest.image.name);assert.equal(await popup.locator('img').evaluate(image=>image.naturalWidth),3640);await popup.close();
        result.download={bytes:raw.length,sha256:manifest.image.sha256,width:3640,height:2750};
      }
      assert.deepEqual(errors,[]);Object.assign(result,{ok:true,geometryWithinPixel:true,imagesLoaded:true,pageErrors:errors,masthead_sha256:crypto.createHash('sha256').update(invariant.masthead).digest('hex'),svg_dom_sha256:crypto.createHash('sha256').update(invariant.svg).digest('hex')});
    }catch(error){await page.screenshot({path:path.join(outputPath,`falha-${width}.png`),animations:'disabled'}).catch(()=>{});throw error;}
    finally{await context.close();}
  }
  report.allPassed=true;
}catch(error){report.failure=error.stack??String(error);process.exitCode=1;}
finally{
  await browser.close();if(server)await new Promise(resolve=>server.close(resolve));await fs.writeFile(path.join(outputPath,'browser-check.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify({mode:live?'live':'local',widths:report.results.map(result=>({width:result.width,ok:result.ok})),allPassed:report.allPassed,failure:report.failure}));
}
