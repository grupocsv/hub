import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import AxeBuilder from '@axe-core/playwright';
import { pageFixture, navigate, root } from './nfse-browser-fixture.mjs';

const widths=[360,390,768,1280,1440];
const output=resolve(process.env.NFSE_UX_OUTPUT_DIR||resolve(root,'test-results/nfse-responsive'));
const baseline=Boolean(process.env.NFSE_UX_BASELINE);
const source=process.env.NFSE_UX_BASELINE;
const profile={profile_id:'synthetic-profile',name:'Consultoria — contrato de teste',status:'active',description_policy:'free'};
const month=new Date().toISOString().slice(0,7);
const views=['overview','requests','calendar','companies','connections','activity'];

function seed(state){
 const rule={rule_id:'rule-test-1',company_id:'axiacare',title:'Consultoria mensal de teste — competência e cobrança',profile_id:profile.profile_id,day_of_month:5,frequency:'monthly',start_date:month+'-01',end_date:null,amount_mode:'fixed',gross_amount_cents:987654,competence_rule:'same_month',missing_day_policy:'last_day',notes:null,status:'active',version:1};
 state.rules.push(rule);
 state.occurrences.push({occurrence_id:'occ-rule-test-1',rule_id:rule.rule_id,company_id:rule.company_id,title:rule.title,month,competence:month,planned_date:month+'-05',profile_id:profile.profile_id,amount_mode:'fixed',gross_amount_cents:987654,status:'pending',version:1,rule_version:1,rule_snapshot:{...rule}});
 for(let i=1;i<=2;i++)state.fiscalRequests.push(state.makeRequest('synthetic-request-'+i,{company_id:'axiacare',profile_id:profile.profile_id,gross_amount_cents:987654,competence:month,competence_date:month+'-01',description:'Descrição sintética extensa para conferir leitura, retenções e revisão sem efeitos fiscais.'}));
 state.clients.push({client_id:'read-only-synthetic',name:'Aplicativo sintético — somente consulta',company_ids:['axiacare','theratech','medvalor'],scopes:['read'],status:'active',expires_at:null});
 state.documents.push({document_id:'synthetic-document',company_id:'axiacare',access_key:'7'.repeat(50),status:'authorized',competence:month+'-01',issuer_document:'12345678000195',customer_document:'11222333000181',gross_amount_cents:987654,net_amount_cents:987554,artifacts:[],timeline:[]});
 state.operations.push({operation_id:'synthetic-operation-with-long-identifier',company_id:'axiacare',status:'unknown',created_at:month+'-01T12:00:00Z'});
}
async function beforeGoto(page){
 if(!baseline)return;
 for(const file of ['index.html','app.js','style.css']){
  const body=await readFile(resolve(source,file));
  await page.route(file==='index.html'?'**/grupo-csv/nfse/':'**/grupo-csv/nfse/'+file,route=>route.fulfill({body,contentType:({'index.html':'text/html','app.js':'text/javascript','style.css':'text/css'})[file]}));
 }
}
async function ready(page){await page.locator('#content[aria-busy="false"]').waitFor();await page.locator('#content .stats').waitFor();}
async function inspect(page,name){
 await mkdir(output,{recursive:true});
 await page.screenshot({path:resolve(output,name+'.png'),fullPage:true});
 const layout=await page.evaluate(()=>({width:innerWidth,documentWidth:document.documentElement.scrollWidth,bodyWidth:document.body.scrollWidth,overflow:[...document.querySelectorAll('body *')].filter(e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return r.width>0&&r.left>=0&&r.right>innerWidth+1&&s.position!=='fixed'&&s.visibility!=='hidden';}).slice(0,20).map(e=>({tag:e.tagName,class:e.className,text:e.textContent.slice(0,75),right:e.getBoundingClientRect().right}))}));
 const audit=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze();
 const result={layout,violations:audit.violations.map(v=>({id:v.id,impact:v.impact,description:v.description,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}))};
 await writeFile(resolve(output,name+'.json'),JSON.stringify(result,null,2));
 return result;
}
function assertLayout(report){assert.ok(report.layout.documentWidth<=report.layout.width+1,JSON.stringify(report.layout));assert.equal(report.violations.length,0,JSON.stringify(report.violations));}

for(const width of widths)test(`${baseline?'baseline':'responsivo'} ${width}px — seis áreas, overflow e acessibilidade`,async()=>{
 const f=await pageFixture({viewport:{width,height:900},canSimulate:true,profiles:[profile],seed,beforeGoto});
 try{
  await ready(f.page);
  for(const view of views){
   if(baseline)await f.page.locator(`#nav button[data-view="${view}"]`).click();else await navigate(f.page,view);
   await f.page.locator(`#nav button[data-view="${view}"][aria-current="page"]`).waitFor({state:'attached'});
   const report=await inspect(f.page,`${baseline?'baseline':'final'}-${width}-${view}`);
   if(!baseline)assertLayout(report);
  }
  if(!baseline){
   await navigate(f.page,'companies');
   for(const img of await f.page.locator('.company-logo').all())assert.equal(await img.evaluate(image=>image.complete&&image.naturalWidth>0),true,'Marca oficial deve carregar.');
   await navigate(f.page,'connections');await f.page.getByText('Somente consulta',{exact:true}).waitFor();
   await navigate(f.page,'calendar');await f.page.getByRole('button',{name:'Nova regra',exact:true}).click();
   await f.page.getByLabel('Nome da emissão').fill('Calendário sintético móvel');
   assertLayout(await inspect(f.page,`final-${width}-calendar-dialog`));
   await f.page.keyboard.press('Escape');assert.equal(await f.page.locator('dialog[open]').count(),0);
   await navigate(f.page,'connections');await f.page.getByRole('button',{name:'Nova conexão',exact:true}).click();
   await f.page.getByLabel('Nome do aplicativo').fill('Aplicativo sintético');
   assertLayout(await inspect(f.page,`final-${width}-connection-dialog`));
   await f.page.keyboard.press('Escape');
   await navigate(f.page,'requests');await f.page.getByRole('button',{name:'Conferir',exact:true}).first().click();
   await f.page.getByRole('heading',{name:'Conferir solicitação',exact:true}).waitFor();
   assertLayout(await inspect(f.page,`final-${width}-request-dialog`));
  }
  assert.deepEqual(f.errors,[]);
 }finally{await f.context.close();}
});

if(!baseline)for(const width of [360,768])test(`${width}px — teclado, Menu, histórico e foco da seleção`,async()=>{
 const f=await pageFixture({viewport:{width,height:844},canSimulate:true,profiles:[profile],seed});
 try{
  await ready(f.page);
  const toggle=f.page.locator('#menu-toggle');
  if(await toggle.isVisible()){
   await toggle.focus();await f.page.keyboard.press('Enter');assert.equal(await toggle.getAttribute('aria-expanded'),'true');
   assert.equal(await f.page.locator('#nav button[aria-current="page"]').evaluate(button=>button===document.activeElement),true);
   await f.page.keyboard.press('Escape');assert.equal(await toggle.getAttribute('aria-expanded'),'false');assert.equal(await toggle.evaluate(button=>button===document.activeElement),true);
  }
  await navigate(f.page,'calendar');await navigate(f.page,'connections');
  await f.page.goBack();await f.page.getByRole('heading',{name:'Calendário',exact:true}).waitFor();
  await f.page.goForward();await f.page.getByRole('heading',{name:'Conexões',exact:true}).waitFor();
  await f.page.reload();await f.page.getByRole('heading',{name:'Conexões',exact:true}).waitFor();
  await f.page.locator('#content[aria-busy="false"]').waitFor();
  await navigate(f.page,'requests');
  const oldHash=await f.page.evaluate(()=>location.hash);await f.page.locator('.skip').focus();await f.page.keyboard.press('Enter');
  assert.equal(await f.page.locator('#workspace').evaluate(main=>main===document.activeElement),true);assert.equal(await f.page.evaluate(()=>location.hash),oldHash);
  await f.page.getByRole('heading',{name:'Notas',exact:true}).waitFor();
  const selection=f.page.getByRole('checkbox',{name:'Selecionar prévia synthetic-request-1',exact:true});
  await selection.focus();await f.page.keyboard.press('Space');assert.equal(await selection.isChecked(),true);
  assert.equal(await selection.evaluate(input=>input===document.activeElement),true,'Atualização da seleção deve preservar o foco.');
  await f.page.keyboard.press('Space');assert.equal(await selection.isChecked(),false);
  await f.page.getByRole('button',{name:'Conferir',exact:true}).first().click();
  await f.page.getByRole('heading',{name:'Conferir solicitação',exact:true}).waitFor();
  for(let i=0;i<12;i++){await f.page.keyboard.press('Tab');assert.equal(await f.page.evaluate(()=>Boolean(document.activeElement.closest('dialog[open]'))),true,'Tab deve permanecer na janela modal.');}
  await f.page.keyboard.press('Escape');assert.equal(await f.page.locator('dialog[open]').count(),0);
  assert.equal(await f.page.evaluate(()=>document.activeElement.tagName!=='BODY'),true);
  assert.deepEqual(f.errors,[]);
 }finally{await f.context.close();}
});

if(!baseline)test('360px — prepara rascunho, revisa e configura calendário e conexão sem transmitir',async()=>{
 const f=await pageFixture({viewport:{width:360,height:844},canSimulate:true,profiles:[profile]});
 try{
  await ready(f.page);await f.page.locator('#prepare').click();
  await f.page.getByLabel('Perfil de serviço e tomador',{exact:true}).selectOption(profile.profile_id);
  await f.page.getByLabel('Valor bruto (R$)',{exact:true}).fill('1234,56');
  await f.page.getByLabel('Data da competência',{exact:true}).fill(month+'-01');
  await f.page.getByLabel('Descrição (conforme o perfil)',{exact:true}).fill('Serviço sintético para preparação local.');
  await f.page.getByRole('button',{name:'Preparar prévia',exact:true}).click();
  await f.page.getByRole('button',{name:'Conferir',exact:true}).click();
  await f.page.getByRole('button',{name:'Revisar prévia',exact:true}).click();
  await f.page.getByLabel('Valor bruto (R$)',{exact:true}).fill('1500,00');
  await f.page.getByRole('button',{name:'Salvar nova revisão',exact:true}).click();
  await f.page.getByText('Nova revisão preparada. A aprovação anterior não autoriza esta revisão.',{exact:true}).waitFor();
  assert.equal(f.state.fiscalRequests[0].revision,2);assert.equal(f.state.fiscalRequests[0].snapshot.data.input.gross_amount_cents,150000);
  await navigate(f.page,'calendar');await f.page.getByRole('button',{name:'Nova regra',exact:true}).click();
  await f.page.getByLabel('Nome da emissão').fill('Cobrança sintética configurável');
  await f.page.getByRole('button',{name:'Salvar regra',exact:true}).click();
  await f.page.getByText('Cobrança sintética configurável',{exact:true}).waitFor();
  await navigate(f.page,'connections');await f.page.getByRole('button',{name:'Nova conexão',exact:true}).click();
  await f.page.getByLabel('Nome do aplicativo').fill('Cliente sintético móvel');await f.page.getByLabel('Permissões',{exact:true}).selectOption('read');
  await f.page.getByRole('button',{name:'Gerar chave',exact:true}).click();
  await f.page.getByLabel('Chave de acesso (exibida uma vez)').waitFor();
  await f.page.getByRole('button',{name:'Fechar',exact:true}).click();
  assert.equal(await f.page.getByLabel('Chave de acesso (exibida uma vez)').count(),0);
  assert.deepEqual(f.state.clients[0].scopes,['read']);assert.equal(f.state.posts.some(p=>p.path==='operations'),false);
  assert.deepEqual(f.errors,[]);
 }finally{await f.context.close();}
});

if(!baseline)test('390px — carga bloqueia edição e erro de rede permite tentar novamente',async()=>{
 let release,entered;const gate=new Promise(resolve=>{release=resolve;}),started=new Promise(resolve=>{entered=resolve;});
 const f=await pageFixture({viewport:{width:390,height:844},beforeGoto:async page=>{
  await page.route('https://api.grupocsv.com/nfse/v2/overview*',async route=>{entered();await gate;await route.fallback();});
 }});
 try{
  await started;assert.equal(await f.page.locator('#content').evaluate(content=>content.inert),true);
  assert.equal(await f.page.locator('#refresh').isDisabled(),true);
  release();await ready(f.page);
  await f.page.unroute('https://api.grupocsv.com/nfse/v2/overview*');
  await f.page.route('https://api.grupocsv.com/nfse/v2/overview*',route=>route.abort('failed'));
  await f.page.getByRole('button',{name:'Atualizar',exact:true}).click();
  await f.page.getByRole('heading',{name:'Informações indisponíveis',exact:true}).waitFor();
  await f.page.getByText('Não foi possível acessar o serviço. Confira sua conexão e atualize para verificar o resultado.',{exact:true}).waitFor();
  assert.equal(await f.page.locator('#content').evaluate(content=>content.inert),false);
  await f.page.unroute('https://api.grupocsv.com/nfse/v2/overview*');
  await f.page.getByRole('button',{name:'Tentar novamente',exact:true}).click();await ready(f.page);assert.deepEqual(f.errors,[]);
 }finally{release();await f.context.close();}
});

if(!baseline)test('390px — empresa sem preparo habilitado não usa silenciosamente outro emitente',async()=>{
 const f=await pageFixture({viewport:{width:390,height:844},canSimulate:true,profiles:[profile],seed:(_state,companies)=>{companies[1].readiness.can_simulate=false;}});
 try{
  await ready(f.page);await f.page.locator('#company-filter').selectOption('theratech');
  await f.page.locator('#content[aria-busy="false"]').waitFor();assert.equal(await f.page.locator('#prepare').isDisabled(),true);
  await f.page.locator('#company-filter').selectOption('axiacare');await f.page.locator('#content[aria-busy="false"]').waitFor();assert.equal(await f.page.locator('#prepare').isDisabled(),false);
  await f.page.locator('#prepare').click();assert.equal(await f.page.locator('#editor select[name="company_id"]').inputValue(),'axiacare');
  await f.page.keyboard.press('Escape');assert.deepEqual(f.state.posts,[]);assert.deepEqual(f.errors,[]);
 }finally{await f.context.close();}
});
