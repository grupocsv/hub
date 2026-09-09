// Integração em navegador isolado. Local: servidor HTTP de loopback dos artefatos.
// --live: lê a publicação real, sem interceptar respostas.
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import http from 'node:http';
import { createRequire } from 'node:module';
const require=createRequire(process.env.JORNADA_RUNTIME_PACKAGE || import.meta.url);
const {chromium}=require('playwright');
const [packagePath,outputPath,...flags]=process.argv.slice(2);
const live=flags.includes('--live');
const manifest=JSON.parse(await fs.readFile(path.join(packagePath,'build-manifest.json'),'utf8'));
const points=JSON.parse(await fs.readFile(new URL('./points.json',import.meta.url),'utf8'));
let url='https://open.grupocsv.com/jornada-tea/';
let server;
if(!live) {
  const html=await fs.readFile(path.join(packagePath,'index.html'));
  const png=await fs.readFile(path.join(packagePath,manifest.image.name));
  server=http.createServer((request,response)=>{
    const pathname=new URL(request.url,'http://localhost').pathname;
    if(pathname==='/jornada-tea/') { response.writeHead(200,{'Content-Type':'text/html; charset=utf-8'}); response.end(html); }
    else if(pathname==='/jornada-tea/'+manifest.image.name) { response.writeHead(200,{'Content-Type':'image/png','Content-Length':png.length}); response.end(png); }
    else { response.writeHead(404); response.end(); }
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  url=`http://127.0.0.1:${server.address().port}/jornada-tea/`;
}
await fs.mkdir(outputPath,{recursive:true});
const browser=await chromium.launch({headless:true,...(process.env.JORNADA_BROWSER_CHANNEL ? {channel:process.env.JORNADA_BROWSER_CHANNEL}:{})});
const results=[];
try {
  for (const width of [1440,768,390,320]) {
    const context=await browser.newContext({viewport:{width,height:960},hasTouch:width<861,deviceScaleFactor:1,acceptDownloads:true,extraHTTPHeaders:{'Cache-Control':'no-cache'}});
    const page=await context.newPage();
    const errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    await page.goto(url,{waitUntil:'networkidle'});
    await page.locator('#p1.ji-enhanced').waitFor();
    const invariant=await page.evaluate(()=>({
      overflow:document.documentElement.scrollWidth>window.innerWidth,
      points:document.querySelectorAll('.ji-hotspot').length,
      viewBox:document.querySelector('.ji-canvas > svg').getAttribute('viewBox'),
      images:[...document.images].every(image=>image.complete && image.naturalWidth>0),
      masthead:document.querySelector('.masthead').outerHTML,
      svg:document.querySelector('.ji-canvas > svg').outerHTML,
    }));
    assert.equal(invariant.overflow,false);
    assert.equal(invariant.points,points.length);
    assert.equal(invariant.viewBox,'0 0 1820 1375');
    assert.equal(invariant.images,true);
    const checked=[];
    const sample=width===390?points:points.filter(point=>['ccc','aad','evs'].includes(point.id));
    for(const point of sample) {
      await page.getByLabel('Escolha uma etapa do mapa',{exact:true}).selectOption(point.id);
      const dialog=page.getByRole('dialog');
      await dialog.waitFor({state:'visible'});
      assert.equal(await dialog.locator('h2').innerText(),point.title);
      assert.equal(await dialog.locator('p').innerText(),point.body);
      const box=await dialog.boundingBox();
      assert(box.x>=0 && box.x+box.width<=width+1 && box.y>=0 && box.y+box.height<=961);
      const geometry=await page.locator(`[data-ji-point="${point.id}"]`).evaluate((button,bounds)=>{
        const rect=button.getBoundingClientRect(); const canvas=button.closest('.ji-canvas').getBoundingClientRect();
        return Math.max(Math.abs(rect.left-canvas.left-bounds[0]/1820*canvas.width),Math.abs(rect.top-canvas.top-bounds[1]/1375*canvas.height),Math.abs(rect.width-bounds[2]/1820*canvas.width),Math.abs(rect.height-bounds[3]/1375*canvas.height));
      },point.bounds);
      assert(geometry<1);
      checked.push(point.id);
      if(point.id==='ccc') await page.screenshot({path:path.join(outputPath,`jornada-${width}.png`)});
      await page.keyboard.press('Escape');
      assert.equal(await dialog.isVisible(),false);
    }
    await page.getByRole('button',{name:'Ajustar à tela',exact:true}).click();
    assert.equal(await page.locator('.ji-zoom-value').innerText(),'Visão geral');
    await page.getByRole('button',{name:'Ampliar mapa',exact:true}).click();
    assert.equal(await page.locator('.ji-zoom-value').innerText(),'125%');
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    await page.getByLabel('Escolha uma etapa do mapa',{exact:true}).selectOption('ccc');
    await page.getByRole('button',{name:'Apoio Textual',exact:true}).click();
    assert.equal(await page.getByRole('dialog').isVisible(),false);
    await page.locator('#p2.active').waitFor();
    await page.getByRole('button',{name:'Diagrama',exact:true}).click();
    let downloadProof;
    if(width===390) {
      const downloadPromise=page.waitForEvent('download');
      await page.getByRole('link',{name:'Baixar mapa',exact:true}).click();
      const download=await downloadPromise;
      const destination=path.join(outputPath,download.suggestedFilename());
      await download.saveAs(destination);
      const raw=await fs.readFile(destination);
      assert.equal(crypto.createHash('sha256').update(raw).digest('hex'),manifest.image.sha256);
      assert.equal(raw.readUInt32BE(16),3640); assert.equal(raw.readUInt32BE(20),2750);
      const popupPromise=context.waitForEvent('page');
      await page.getByRole('link',{name:'Abrir imagem',exact:true}).click();
      const popup=await popupPromise;
      await popup.waitForLoadState('load');
      assert.equal(popup.url(),url+manifest.image.name);
      assert.equal(await popup.locator('img').evaluate(image=>image.naturalWidth),3640);
      await popup.close();
      downloadProof={bytes:raw.length,sha256:manifest.image.sha256,width:3640,height:2750};
    }
    assert.deepEqual(errors,[]);
    results.push({width,pointsChecked:checked,overflow:false,geometryWithinPixel:true,imagesLoaded:true,pageErrors:errors,download:downloadProof,masthead_sha256:crypto.createHash('sha256').update(invariant.masthead).digest('hex'),svg_dom_sha256:crypto.createHash('sha256').update(invariant.svg).digest('hex')});
    await context.close();
  }
} finally { await browser.close(); if(server) await new Promise(resolve=>server.close(resolve)); }
await fs.writeFile(path.join(outputPath,'browser-check.json'),JSON.stringify({mode:live?'produção real':'artefatos locais por HTTP em loopback',time:new Date().toISOString(),output_sha256:manifest.output_sha256,results},null,2));
console.log(JSON.stringify({mode:live?'live':'local',widths:results.map(r=>r.width),allPassed:true}));
