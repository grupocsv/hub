import fs from 'node:fs/promises';import path from 'node:path';import http from 'node:http';import assert from 'node:assert/strict';import {createRequire} from 'node:module';
const require=createRequire(process.env.JORNADA_RUNTIME_PACKAGE||import.meta.url);const {chromium}=require('playwright');
const [packagePath,outputPath,...flags]=process.argv.slice(2);if(!packagePath||!outputPath)throw Error('Informe pacote e saída.');
const live=flags.includes('--live');
const restrictedCards=flags.includes('--restricted-cards');
const calculator=flags.includes('--calculator');
const calculatorRelated=flags.includes('--calculator-related');
assert(!(calculator&&calculatorRelated),'Escolha uma única posição da calculadora');
const mime={'.html':'text/html; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.ico':'image/x-icon'};
const server=http.createServer(async(req,res)=>{let name=new URL(req.url,'http://local').pathname.replace(/^\/tea\//,'');if(!name)name='index.html';if(name.includes('..')||name==='peca-jornada.webp'){res.writeHead(404);return res.end();}try{const raw=await fs.readFile(path.join(packagePath,name));res.writeHead(200,{'Content-Type':mime[path.extname(name)]||'application/octet-stream'});res.end(raw);}catch{res.writeHead(404);res.end();}});
if(!live)await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));await fs.mkdir(outputPath,{recursive:true});const browser=await chromium.launch({headless:true,channel:'chrome'});const url=live?'https://hub.unimedgv.com/tea/':`http://127.0.0.1:${server.address().port}/tea/`;const report={mode:live?'produção real':'local',url,allPassed:false,results:[]};
try{for(const width of [320,390,768,1440]){const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));let writes=0,mapRequests=0,telemetry=0;page.on('request',r=>{if(!['GET','HEAD'].includes(r.method())){const target=new URL(r.url());if(target.pathname==='/cdn-cgi/rum')telemetry++;else writes++;}if(r.url().includes('peca-jornada.webp'))mapRequests++;});
await page.goto(url,{waitUntil:'networkidle'});await page.evaluate(()=>document.fonts.ready);await page.evaluate(()=>{for(const image of document.images)image.loading='eager';});await page.waitForFunction(()=>[...document.images].filter(i=>!i.closest('#gate')).every(i=>i.complete),null,{timeout:15000});
assert.equal(await page.locator('.jornada-convite').count(),1);assert.equal(await page.locator('img[src*="peca-jornada"]').count(),0);
const proof=await page.evaluate(()=>({width:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth,images:[...document.images].filter(i=>!i.closest('#gate')).every(i=>i.complete&&i.naturalWidth>0),jornada:document.querySelector('.p2').getAttribute('href'),painel:document.querySelector('.p3').getAttribute('href'),reportRole:document.querySelector('#porta-rel').getAttribute('role')}));
assert(proof.scroll<=proof.width+1);assert(proof.images);assert.equal(proof.jornada,'https://open.grupocsv.com/jornada-tea/');assert.equal(proof.painel,'https://hub.grupocsv.com/p/painel-tea/');assert.equal(proof.reportRole,'button');
if(calculator){
 const destination='https://open.grupocsv.com/esc-tea-100';const link=page.locator('header .calculadora-link');
 assert.equal(await link.count(),1);assert.equal(await link.getAttribute('href'),destination);
 assert.equal(await link.innerText(),'Calculadora ESC-TEA-100');assert.equal(await link.locator('svg[aria-hidden="true"]').count(),1);
 const layout=await link.evaluate(el=>{const rect=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom};};return {button:rect(el),text:rect(el.querySelector('span')),header:rect(el.closest('header')),logos:[...el.closest('header').querySelectorAll('img')].map(rect)};});
 assert(layout.button.height>=44&&layout.button.x>=0&&layout.button.right<=width);
 assert(layout.text.x>=layout.button.x&&layout.text.right<=layout.button.right);
 for(const logo of layout.logos)assert(layout.button.x>=logo.right||layout.button.right<=logo.x||layout.button.y>=logo.bottom||layout.button.bottom<=logo.y,'Botão sobrepõe logo');
 if(width<=640)assert(layout.logos.every(logo=>layout.button.y>logo.bottom),'Botão deve ocupar segunda fileira no celular');
 else assert(layout.logos.every(logo=>Math.abs((logo.y+logo.height/2)-(layout.button.y+layout.button.height/2))<1),'Alinhamento vertical do header');
 await page.keyboard.press('Tab');assert(await link.evaluate(el=>document.activeElement===el),'Link do header não é o primeiro foco');
 assert.equal(await link.evaluate(el=>getComputedStyle(el).outlineStyle),'solid');
 // A navegação por teclado é real; o destino é interceptado para não operar a calculadora.
 await context.route(destination,route=>route.fulfill({status:200,contentType:'text/html',body:'<!doctype html><title>Destino verificado</title>'}));
 const [popup]=await Promise.all([page.waitForEvent('popup'),page.keyboard.press('Enter')]);await popup.waitForLoadState();
 assert.equal(popup.url(),destination);assert.equal(await popup.evaluate(()=>window.opener===null),true);await popup.close();
 await page.keyboard.press('Tab');assert(await page.locator('.p1').evaluate(el=>document.activeElement===el),'Ordem dos cards após o link alterada');
 await page.evaluate(()=>{document.activeElement.blur();window.scrollTo(0,0);});
 await page.screenshot({path:path.join(outputPath,`hub-calculadora-${width}.png`),animations:'disabled'});
 await page.locator('header').screenshot({path:path.join(outputPath,`header-calculadora-${width}.png`),animations:'disabled'});
 proof.calculator={layout,keyboard:true,noopener:true,destination};
}
if(restrictedCards){
 const badges=await page.locator('.trilha .porta').evaluateAll(cards=>cards.map(card=>{const badge=card.querySelector(':scope > .restr'),r=card.getBoundingClientRect(),b=badge?.getBoundingClientRect(),s=badge?getComputedStyle(badge):null;return {text:badge?.textContent,icon:badge?.querySelector('svg')?.outerHTML,top:b?.top-r.top,right:r.right-b?.right,color:s?.color,fontSize:s?.fontSize,letterSpacing:s?.letterSpacing,inside:!!b&&b.left>=r.left&&b.right<=r.right&&b.top>=r.top&&b.bottom<=r.bottom};}));
 assert.equal(badges.length,4);assert(badges.every(b=>b.text==='Restrito'&&b.icon===badges[0].icon&&b.inside));
 assert(badges.every(b=>Math.abs(b.top-badges[0].top)<=1&&Math.abs(b.right-badges[0].right)<=1&&b.fontSize===badges[0].fontSize&&b.letterSpacing===badges[0].letterSpacing));
 assert.equal(await page.locator('.jornada-acesso').count(),0);
 const spacing=await page.locator('.p2').evaluate(card=>{const b=card.querySelector('.restr').getBoundingClientRect(),p=card.querySelector('.folha').getBoundingClientRect();return {badgeBottom:b.bottom,previewTop:p.top};});assert(spacing.previewTop>spacing.badgeBottom,'Rótulo sobrepõe a prévia');
 proof.badges=badges;proof.previewSpacing=spacing;
 const keyboardOrder=calculatorRelated?['.p2','.jornada-recurso a','.p3','.p4']:['.p2','.p3','.p4'];
 await page.locator('.p1').focus();for(const selector of keyboardOrder){await page.keyboard.press('Tab');assert(await page.locator(selector).evaluate(el=>document.activeElement===el),'Ordem de teclado alterada');}
 await page.keyboard.press('Enter');await page.locator('#gate').waitFor({state:'visible'});await page.locator('#gate-x').click();proof.keyboardCardsAndReport=true;
 await page.locator('.trilha').screenshot({path:path.join(outputPath,`hub-cards-${width}.png`),animations:'disabled'});
}
if(calculatorRelated){
 const destination='https://open.grupocsv.com/esc-tea-100',link=page.locator('.jornada-recurso a');
 assert.equal(await page.locator('header a').count(),0);assert.equal(await page.locator(`a[href="${destination}"]`).count(),1);
 assert.equal(await page.locator('.jornada-recurso h3').innerText(),'ESC-TEA-100\nEscore de Severidade Clínica');
 assert.equal(await page.locator('.jornada-recurso p').innerText(),'Reúne triagem, CARS e CBDF em um escore para apoiar a clusterização.');
 assert.equal(await link.innerText(),'Abrir calculadora e metodologia');assert.equal(await page.locator('.jornada-recurso .restr,.jornada-recurso .num').count(),0);
 const layout=await page.locator('.jornada-grupo').evaluate(group=>{const rect=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height};};const resource=group.querySelector('.jornada-recurso');return {group:rect(group),card:rect(group.querySelector('.p2')),resource:rect(resource),link:rect(resource.querySelector('a')),title:rect(resource.querySelector('h3')),description:rect(resource.querySelector('p')),next:rect(document.querySelector('.p3')),resourceBackground:getComputedStyle(resource).backgroundColor,resourceBorder:getComputedStyle(resource).borderTopWidth};});
 assert(layout.resource.y>=layout.card.bottom&&layout.resource.bottom<=layout.group.bottom+1,'Recurso fora do grupo Jornada');
 assert(layout.next.y>=layout.group.bottom,'Próximo card deve vir após o recurso');
 assert.equal(layout.resourceBackground,'rgba(0, 0, 0, 0)');assert.equal(layout.resourceBorder,'0px');
 for(const box of [layout.link,layout.title,layout.description])assert(box.x>=layout.resource.x&&box.right<=layout.resource.right&&box.bottom<=layout.resource.bottom+1,'Texto ou ação cortado');
 assert(layout.link.height>=44);
 await page.locator('.p2').focus();await page.keyboard.press('Tab');assert(await link.evaluate(el=>document.activeElement===el));
 assert.equal(await link.evaluate(el=>getComputedStyle(el).outlineStyle),'solid');
 await context.route(destination,route=>route.fulfill({status:200,contentType:'text/html',body:'<!doctype html><title>Destino verificado</title>'}));
 const [popup]=await Promise.all([page.waitForEvent('popup'),page.keyboard.press('Enter')]);await popup.waitForLoadState();
 assert.equal(popup.url(),destination);assert.equal(await popup.evaluate(()=>window.opener===null),true);await popup.close();
 await page.keyboard.press('Tab');assert(await page.locator('.p3').evaluate(el=>document.activeElement===el));
 await page.evaluate(()=>document.activeElement.blur());
 await page.locator('.jornada-grupo').screenshot({path:path.join(outputPath,`calculadora-jornada-${width}.png`),animations:'disabled'});
 proof.calculatorRelated={layout,keyboard:true,noopener:true,destination};
}
await page.locator('.p2').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(outputPath,`hub-jornada-${width}.png`),animations:'disabled'});
await page.locator('#porta-rel').click();await page.locator('#gate').waitFor({state:'visible'});await page.locator('#gate-email').waitFor({state:'visible'});await page.locator('#gate-x').click();assert.equal(await page.locator('#gate').isVisible(),false);
assert.equal(writes,0);assert.equal(mapRequests,0);assert.deepEqual(errors,[]);report.results.push({width,passed:true,noMapRequest:true,reportModalPreserved:true,telemetryRequests:telemetry,applicationWrites:writes,proof});await context.close();}
report.allPassed=true;
}catch(error){report.failure=String(error);process.exitCode=1;}finally{await browser.close();if(!live)await new Promise(resolve=>server.close(resolve));await fs.writeFile(path.join(outputPath,'browser-check.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));}
