import { before, after } from 'node:test';
import { createServer } from 'node:http';
import { readFile, stat, mkdir } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

export const root = fileURLToPath(new URL('../', import.meta.url));
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
      res.writeHead(200,{'Content-Type':({'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.otf':'font/otf','.svg':'image/svg+xml','.webp':'image/webp'})[extname(file)]??'application/octet-stream'});res.end(data);
    }catch{res.writeHead(404);res.end('Not found');}
  });
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  origin=`http://127.0.0.1:${server.address().port}`;
  browser=await chromium.launch({headless:true,args:['--no-sandbox']});
});
after(async()=>{await browser?.close();await new Promise(r=>server?.close(r));});

export async function pageFixture({valid=true, fail=false, mobile=false, viewport, profilesFail=false, canSimulate=false, profiles=[], seed, beforeGoto}={}) {
  const context=await browser.newContext({locale:'pt-BR',viewport:viewport??(mobile?{width:390,height:844}:{width:1440,height:1000})}),page=await context.newPage();
  page.setDefaultTimeout(6000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const state={rules:[],clients:[],documents:[],operations:[],fiscalRequests:[],occurrences:[],failPrepare:new Set(),gets:[],requests:0,posts:[],authExpired:false,importInvalid:false,importCommitFailures:0,versions:[],documentGate:null,historyCoverage:{status:'not_synchronized',last_synced_at:null,companies:[]},overviewFail:false};
  const companies=['AxiaCare','TheraTech','MedValor'].map((name,i)=>({company_id:['axiacare','theratech','medvalor'][i],name,status:'pending_configuration',readiness:{can_simulate:canSimulate,can_emit:false,blockers:[{code:'profile_missing',message:'Cadastro fiscal aguardando validação.'}]}}));
  await page.route('https://**/*', route=>route.abort('blockedbyclient'));
  await page.route('**/scripts/hub-auth.js',route=>route.fulfill({contentType:'text/javascript',body:`window.HUB_AUTH_API={fetch:(u,o)=>fetch(u,o)};window.HUB_AUTH_READY=Promise.resolve({status:'${valid?'valid':'required'}'});`}));
  await page.route('https://api.grupocsv.com/**',async route=>{
    state.requests++;
    const request=route.request(),headers={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'content-type,idempotency-key','Access-Control-Allow-Methods':'GET,POST,OPTIONS'};
    if(request.method()==='OPTIONS'){await route.fulfill({status:204,headers});return;}
    if(state.authExpired){await route.fulfill({status:401,headers,json:{error:{message:'Sessão expirada.'}}});return;}
    if(profilesFail&&request.url().includes('/profiles')){await route.fulfill({status:503,headers,json:{error:{message:'Perfis temporariamente indisponíveis.'}}});return;}
    if(fail){await route.fulfill({status:503,headers,json:{error:{message:'Serviço temporariamente indisponível.'}}});return;}
    const url=new URL(request.url()),path=url.pathname.replace('/nfse/v2/','');let data;
    if(path==='overview'&&state.overviewFail){await route.fulfill({status:503,headers,json:{error:{message:'Cobertura temporariamente indisponível.'}}});return;}
    if(request.method()==='GET')state.gets.push(url.pathname+url.search);
    if(request.method()==='GET'&&/^documents\/[^/]+\/pdf$/.test(path)){await route.fulfill({status:200,headers:{...headers,'Content-Type':'application/pdf'},body:'%PDF-1.4\nsynthetic'});return;}
    if(request.method()==='POST'){
      const body=request.postDataJSON();state.posts.push({path,body,key:request.headers()['idempotency-key']});
      if(path==='calendar-occurrences/generate'){
        for(const rule of state.rules.filter(r=>!body.company_id||r.company_id===body.company_id)){if(!state.occurrences.some(o=>o.rule_id===rule.rule_id&&o.month===body.month))state.occurrences.push({occurrence_id:'occ-'+rule.rule_id,company_id:rule.company_id,rule_id:rule.rule_id,rule_version:rule.version,version:1,month:body.month,title:rule.title,status:'pending',planned_date:body.month+'-05',competence:body.month,profile_id:rule.profile_id,amount_mode:rule.amount_mode,gross_amount_cents:rule.gross_amount_cents,rule_snapshot:{...rule}});}
        data={month:body.month,occurrence_ids:state.occurrences.map(o=>o.occurrence_id)};
      }
      else if(/^calendar-occurrences\/[^/]+\/(postpone|skip)$/.test(path)){const o=state.occurrences.find(o=>o.occurrence_id===path.split('/')[1]);Object.assign(o,{version:o.version+1,status:path.endsWith('/skip')?'skipped':'postponed',planned_date:body.date??o.planned_date,reason:body.reason});data=o;}
      else if(path==='request-batches/prepare'){const items=[];for(const item of body.items){const o=state.occurrences.find(o=>o.occurrence_id===item.occurrence_id);if(state.failPrepare.has(item.occurrence_id)){items.push({client_item_id:item.client_item_id,status:'error',error:{code:'profile_unavailable',message:'Perfil temporariamente indisponível.'}});continue;}const input={company_id:o.company_id,profile_id:item.profile_id??o.profile_id,gross_amount_cents:item.gross_amount_cents??o.gross_amount_cents,competence:o.competence,competence_date:item.competence_date};const req=makeRequest('req-'+o.occurrence_id,input);state.fiscalRequests.push(req);Object.assign(o,{status:'prepared',request_id:req.request_id,version:o.version+1});items.push({client_item_id:item.client_item_id,status:'prepared',request:req});}data={batch_id:'batch-test',items};}
      else if(path==='requests'){data=makeRequest('synthetic-request-'+(state.fiscalRequests.length+1),body);state.fiscalRequests.push(data);}
      else if(path==='approval-batches'){for(const item of body.items){const r=state.fiscalRequests.find(r=>r.request_id===item.request_id);r.status='approved';r.active_approval={batch_id:'approval-test'};}data={batch_id:'approval-test',items:body.items};}
      else if(/^requests\/[^/]+\/revise$/.test(path)){const r=state.fiscalRequests.find(r=>r.request_id===path.split('/')[1]);const fresh=makeRequest(r.request_id,body,r.revision+1);fresh.timeline=[{event_type:'revised',created_at:'2026-10-31T13:00:00Z'}];Object.assign(r,fresh);data=r;}
      else if(path==='imports/preview'){data={preview_hash:'f'.repeat(64),company_id:body.company_id,can_commit:!state.importInvalid,items:body.sources.map(source=>({source_id:source.source_id,status:state.importInvalid?'invalid':'new',error:state.importInvalid?{code:'adn_issuer_mismatch'}:undefined,document:{access_key:'7'.repeat(50),competence_date:'2026-10-01',gross_amount_cents:10000,net_amount_cents:9385}})),summary:{new:state.importInvalid?0:body.sources.length,invalid:state.importInvalid?body.sources.length:0,duplicate:0,conflict:0},legacy:{records:body.legacy?.documents?.length??0,documents_without_xml:body.legacy?.documents?.map(d=>d.document_id)??[],approval_evidence:'absent'}};}
      else if(path==='imports/commit'){if(state.importCommitFailures>0){state.importCommitFailures--;await route.fulfill({status:503,headers,json:{error:{message:'A importação foi interrompida. Repita o mesmo lote para retomar.'}}});return;}data={batch_id:'import-test',status:'complete',summary:{new:body.sources.length,duplicate:0},items:body.sources.map(source=>({source_id:source.source_id,status:'imported',access_key:'7'.repeat(50)}))};}
      else if(/^documents\/[^/]+\/regenerate-pdf$/.test(path)){const artifact={kind:'pdf',version:state.versions.length,renderer_version:'synthetic-renderer',created_at:'2026-10-31T10:00:00Z',reason:body.reason};state.versions.unshift(artifact);data={document_id:path.split('/')[1],artifact};}
      else if(path==='calendar-rules'){data={...body,rule_id:'rule-test-1',version:1};state.rules.push(data);}
      else if(path==='clients'){data={...body,client_id:'synthetic-client',status:'active',secret_available:true,secret:'synthetic_secret_for_browser_test_only'};state.clients.push({...body,client_id:data.client_id,status:'active'});}
      else if(path==='calendar-rules/rule-test-1/archive'){data={...state.rules[0],status:'archived',version:body.expected_version+1};state.rules=[];}
      else if(path==='calendar-rules/rule-test-1'){data={...body,rule_id:'rule-test-1',version:body.expected_version+1};state.rules=[data];}
      else {await route.fulfill({status:400,headers,json:{error:{message:'Ação não prevista no teste.'}}});return;}
    }else if(path==='meta')data={environment:'test',capabilities:{emit:false,approve:true,request:true}};
    else if(path==='companies')data=companies;
    else if(path==='overview')data={counts:{prepared:0,approved:0,processing:0,authorized:0,pending:0},amounts:{gross_amount_cents:0,federal_total_cents:0,net_amount_cents:0},history_coverage:state.historyCoverage,emission_enabled:false};
    else if(path==='calendar-rules')data=state.rules.filter(r=>!url.searchParams.get('company_id')||r.company_id===url.searchParams.get('company_id'));
    else if(path==='clients')data=state.clients;
    else if(path==='calendar-occurrences')data=state.occurrences.filter(o=>o.month===url.searchParams.get('month')&&(!url.searchParams.get('company_id')||o.company_id===url.searchParams.get('company_id')));
    else if(path==='requests')data=state.fiscalRequests.filter(r=>(!url.searchParams.get('status')||r.status===url.searchParams.get('status'))&&(!url.searchParams.get('competence')||r.snapshot.data.input.competence===url.searchParams.get('competence')));
    else if(path.startsWith('requests/'))data=state.fiscalRequests.find(r=>r.request_id===path.split('/')[1]);
    else if(path.endsWith('/profiles'))data=profiles;
    else if(path==='operations')data=state.operations;
    else if(path==='documents')data=state.documents;
    else if(/^documents\/[^/]+\/versions$/.test(path))data={versions:state.versions};
    else if(path.startsWith('documents/')){if(state.documentGate)await state.documentGate;data=state.documents.find(d=>path==='documents/'+d.document_id);}
    else data=[];
    await route.fulfill({status:200,headers,json:{data,meta:{request_id:'synthetic-request',next_cursor:null}}});
  });
  function makeRequest(request_id,input,revision=1){return {request_id,company_id:input.company_id,status:'prepared',revision,active_approval:null,timeline:[],snapshot:{snapshot_id:request_id+'-'+revision,hash:String(revision).repeat(64),data:{company_name:companies.find(c=>c.company_id===input.company_id)?.name,establishment:{document:'12345678000195'},environment:'test',profile:{profile_id:input.profile_id,name:'Serviço de teste',customer:{legal_name:'Tomador de teste',document:'11222333000181'},service_code:'171201',iss_retained:false},input:{...input},amounts:{gross_amount_cents:input.gross_amount_cents,net_amount_cents:input.gross_amount_cents-100,irrf_cents:100,pis_cents:0,cofins_cents:0,csll_cents:0,federal_total_cents:100,iss_highlight_cents:0}}}};}
  state.makeRequest=makeRequest;
  if(seed)await seed(state,companies);
  if(beforeGoto)await beforeGoto(page);
  await page.goto(origin+'/grupo-csv/nfse/');
  return {context,page,state,errors};
}

export async function navigate(page,view){
  const toggle=page.locator('#menu-toggle');
  if(await toggle.isVisible()&&await toggle.getAttribute('aria-expanded')!=='true')await toggle.click();
  await page.locator(`#nav button[data-view="${view}"]`).click();
}
