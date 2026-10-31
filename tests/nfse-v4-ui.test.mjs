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

async function pageFixture({valid=true, fail=false, mobile=false, profilesFail=false, canSimulate=false, profiles=[]}={}) {
  const context=await browser.newContext({locale:'pt-BR',viewport:mobile?{width:390,height:844}:{width:1440,height:1000}}),page=await context.newPage();
  page.setDefaultTimeout(6000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const state={rules:[],clients:[],documents:[],operations:[],fiscalRequests:[],occurrences:[],failPrepare:new Set(),gets:[],requests:0,posts:[],authExpired:false,importInvalid:false,importCommitFailures:0,versions:[],documentGate:null,historyCoverage:{status:'not_synchronized',last_synced_at:null,companies:[]},overviewFail:false};
  const companies=['AxiaCare','TheraTech','MedValor'].map((name,i)=>({company_id:['axiacare','theratech','medvalor'][i],name,status:'pending_configuration',readiness:{can_simulate:canSimulate,can_emit:false,blockers:[{code:'profile_missing',message:'Cadastro fiscal aguardando validação.'}]}}));
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

test('mostra cobertura parcial e última sincronização por empresa sem atribuir data a quem nunca sincronizou',async()=>{
 const f=await pageFixture();try{
  await f.page.getByText('Seu calendário começa aqui').waitFor();
  f.state.historyCoverage={status:'partially_synchronized',last_synced_at:'2099-01-01T00:00:00Z',companies:[{company_id:'axiacare',status:'up_to_date',last_success_at:'2026-10-31T01:30:00Z'},{company_id:'theratech',status:'more_available',last_synced_at:'2026-10-30T13:00:00Z'},{company_id:'medvalor',status:'never_synced',last_success_at:null}]};
  await f.page.getByRole('button',{name:'Atualizar',exact:true}).click();await f.page.getByText('O histórico está parcialmente sincronizado. Confira a cobertura de cada empresa.',{exact:true}).waitFor();
  const axia=f.page.getByRole('region',{name:'Histórico de AxiaCare'}),thera=f.page.getByRole('region',{name:'Histórico de TheraTech'}),med=f.page.getByRole('region',{name:'Histórico de MedValor'});
  assert.match(await axia.textContent(),/Sem páginas pendentes na última consulta/);assert.match(await axia.textContent(),/30\/10\/2026, 22:30/);
  assert.match(await thera.textContent(),/Sincronização parcial/);assert.match(await thera.textContent(),/30\/10\/2026, 10:00/);
  assert.match(await med.textContent(),/Ainda não sincronizado/);assert.match(await med.textContent(),/Última sincronização: não registrada/);assert.doesNotMatch(await med.textContent(),/2099|2026/);
  await f.page.locator('[data-view="companies"]').click();assert.match(await f.page.getByRole('region',{name:'Histórico de AxiaCare'}).textContent(),/30\/10\/2026, 22:30/);assert.deepEqual(f.errors,[]);
 }finally{await f.context.close();}
});

test('cobertura ausente não inventa data e falha da API remove informação anterior',async()=>{
 const f=await pageFixture();try{
  await f.page.getByText('Seu calendário começa aqui').waitFor();await f.page.locator('[data-view="companies"]').click();
  assert.match(await f.page.getByRole('region',{name:'Histórico de AxiaCare'}).textContent(),/Cobertura não informada/);assert.match(await f.page.getByRole('region',{name:'Histórico de AxiaCare'}).textContent(),/Última sincronização: não registrada/);
  f.state.historyCoverage={status:'up_to_date',companies:[{company_id:'axiacare',status:'up_to_date',last_success_at:'2026-10-31T13:00:00Z'}]};await f.page.getByRole('button',{name:'Atualizar',exact:true}).click();await f.page.getByText('Última sincronização: 31/10/2026, 10:00',{exact:true}).waitFor();
  f.state.overviewFail=true;await f.page.getByRole('button',{name:'Atualizar',exact:true}).click();await f.page.getByText('Informações indisponíveis',{exact:true}).waitFor();
  assert.equal(await f.page.getByRole('region',{name:'Histórico de AxiaCare'}).count(),0);assert.equal(await f.page.getByText('Última sincronização: 31/10/2026, 10:00',{exact:true}).count(),0);assert.deepEqual(f.errors,[]);
 }finally{await f.context.close();}
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
    for(const sync of await f.page.getByRole('button',{name:'Sincronizar notas',exact:true}).all())assert.equal(await sync.isDisabled(),false);
    assert.equal(await f.page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),true);assert.deepEqual(f.errors,[]);
  }finally{await f.context.close();}
});

test('gera evidência visual local com configuração pendente e sem dados reais',async()=>{
  const f=await pageFixture();try{
    await f.page.getByText('Seu calendário começa aqui').waitFor();const month=await f.page.getByLabel('Mês de planejamento').inputValue();
    for(const [i,title,value] of [[0,'Serviços de consultoria · exemplo',350000],[1,'Serviços de tecnologia · exemplo',450000],[2,'Assessoria de gestão · exemplo',250000]])f.state.rules.push({rule_id:'visual-'+i,company_id:['axiacare','theratech','medvalor'][i],title,day_of_month:[5,10,15][i],start_date:month+'-01',frequency:'monthly',amount_mode:'fixed',gross_amount_cents:value,competence_rule:'previous_month',missing_day_policy:'last_day',status:'active',version:1});
    await f.page.getByRole('button',{name:'Atualizar',exact:true}).click();await f.page.getByText('Serviços de consultoria · exemplo',{exact:true}).waitFor();
    const out=resolve(root,process.env.NFSE_SCREENSHOT_DIR || 'test-results/nfse');await mkdir(out,{recursive:true});await f.page.screenshot({path:resolve(out,'Previa-local-NFSe-Grupo-CSV.png'),fullPage:true});assert.deepEqual(f.errors,[]);
  }finally{await f.context.close();}
});


test('edição do calendário conserva perfil existente quando a consulta dos perfis falha',async()=>{
  const f=await pageFixture({profilesFail:true});try{
    await f.page.getByText('Seu calendário começa aqui').waitFor();
    f.state.rules.push({rule_id:'rule-test-1',version:1,company_id:'axiacare',title:'Cobrança com perfil',profile_id:'perfil-preservado',day_of_month:5,frequency:'monthly',start_date:'2026-10-01',end_date:null,amount_mode:'variable',gross_amount_cents:null,competence_rule:'previous_month',missing_day_policy:'last_day',notes:null,status:'active'});
    await f.page.getByRole('button',{name:'Atualizar',exact:true}).click();await f.page.getByText('Cobrança com perfil',{exact:true}).waitFor();
    await f.page.locator('[data-view="calendar"]').click();await f.page.getByRole('button',{name:'Editar',exact:true}).click();
    await f.page.getByText('Perfis temporariamente indisponíveis.',{exact:true}).waitFor();
    await f.page.getByLabel('Nome da emissão').fill('Somente título alterado');await f.page.getByRole('button',{name:'Salvar regra',exact:true}).click();
    await f.page.getByText('Somente título alterado',{exact:true}).waitFor();
    assert.equal(f.state.posts.at(-1).body.profile_id,'perfil-preservado');assert.deepEqual(f.errors,[]);
  }finally{await f.context.close();}
});

test('nova regra pode ser salva depois de fechar preparação sem perfil disponível',async()=>{
  const f=await pageFixture({canSimulate:true});try{
    await f.page.getByText('Seu calendário começa aqui').waitFor();await f.page.getByRole('button',{name:'Preparar nota'}).click();
    await f.page.waitForFunction(()=>document.querySelector('[name="profile_id"]')?.disabled===false&&document.getElementById('editor-save').disabled===true);
    await f.page.getByRole('button',{name:'Fechar',exact:true}).click();await f.page.locator('[data-view="calendar"]').click();await f.page.getByRole('button',{name:'Nova regra',exact:true}).click();
    assert.equal(await f.page.getByRole('button',{name:'Salvar regra',exact:true}).isDisabled(),false);
    await f.page.getByLabel('Nome da emissão').fill('Calendário continua editável');await f.page.getByRole('button',{name:'Salvar regra',exact:true}).click();
    await f.page.getByText('Calendário continua editável',{exact:true}).waitFor();assert.deepEqual(f.errors,[]);
  }finally{await f.context.close();}
});

test('expiração durante download fecha o modal e limpa dados privados da tela',async()=>{
  const f=await pageFixture();try{
    await f.page.getByText('Seu calendário começa aqui').waitFor();
    f.state.documents.push({document_id:'doc-test',company_id:'axiacare',access_key:'7'.repeat(50),status:'authorized',competence:'2026-10-31',issued_at:'2026-10-31T10:00:00Z',issuer_document:'12345678000195',customer_document:'11222333000181',gross_amount_cents:10000,net_amount_cents:9385,source:'adn',artifacts:[{kind:'xml'}]});
    await f.page.getByRole('button',{name:'Atualizar',exact:true}).click();await f.page.locator('[data-view="requests"]').click();await f.page.getByRole('button',{name:'Abrir nota',exact:true}).click();
    await f.page.getByRole('heading',{name:'Nota fiscal preservada',exact:true}).waitFor();f.state.authExpired=true;
    await f.page.getByRole('button',{name:'Baixar XML',exact:true}).click();
    await f.page.getByText('Entre para acessar suas emissões',{exact:true}).waitFor();
    assert.equal(await f.page.locator('dialog[open]').count(),0);assert.equal(await f.page.locator('#editor-fields').textContent(),'');assert.deepEqual(f.errors,[]);
  }finally{await f.context.close();}
});


test('nota autorizada exibe diferenças oficiais sem perder o status nem solicitar reemissão',async()=>{
 const f=await pageFixture();try{
  await f.page.getByText('Seu calendário começa aqui').waitFor();
  f.state.operations.push({operation_id:'operacao-teste',company_id:'axiacare',status:'authorized',created_at:'2026-10-31T10:00:00Z',result:{reconciliation_warnings:[{field:'net_amount_cents',approved:93849,official:93850}]}});
  await f.page.getByRole('button',{name:'Atualizar',exact:true}).click();await f.page.locator('[data-view="activity"]').click();
  await f.page.getByText('Os dados oficiais diferem da prévia aprovada.',{exact:true}).waitFor();
  await f.page.getByText('Conferir diferenças',{exact:true}).click();
  assert.equal(await f.page.getByText('Autorizada',{exact:true}).count(),1);
  const detail=await f.page.locator('details').textContent();assert.match(detail,/938,49/);assert.match(detail,/938,50/);assert.equal(f.state.posts.length,0);assert.deepEqual(f.errors,[]);
 }finally{await f.context.close();}
});

test('importação confere XMLs e legado antes de confirmar o lote exato',async()=>{
 const f=await pageFixture();try{
  await f.page.getByText('Seu calendário começa aqui').waitFor();await f.page.locator('[data-view="requests"]').click();await f.page.getByRole('button',{name:'Importar XMLs',exact:true}).click();
  await f.page.getByLabel('Arquivos XML').setInputFiles([{name:'nota.xml',mimeType:'application/xml',buffer:Buffer.from('<NFSe>arquivo sintético</NFSe>')}]);
  await f.page.getByLabel('JSON legado (opcional)').setInputFiles([{name:'legado.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({documents:[{document_id:'old-doc'}]}))}]);
  await f.page.getByRole('button',{name:'Conferir arquivos',exact:true}).click();
  await f.page.getByText('nota.xml',{exact:true}).waitFor();assert.equal(f.state.posts.filter(p=>p.path==='imports/commit').length,0);
  await f.page.getByText('1 documento(s) do legado sem XML vinculado.',{exact:true}).waitFor();
  await f.page.getByRole('button',{name:'Confirmar importação',exact:true}).click();await f.page.getByRole('heading',{name:'Importação concluída',exact:true}).waitFor();
  const preview=f.state.posts.find(p=>p.path==='imports/preview').body,commit=f.state.posts.find(p=>p.path==='imports/commit').body;
  assert.deepEqual(commit,{...preview,preview_hash:'f'.repeat(64)});assert.equal(f.state.posts.some(p=>p.path==='operations'),false);assert.deepEqual(f.errors,[]);
 }finally{await f.context.close();}
});

test('XML de empresa incompatível impede confirmar a importação',async()=>{
 const f=await pageFixture();try{
  await f.page.getByText('Seu calendário começa aqui').waitFor();f.state.importInvalid=true;await f.page.locator('[data-view="requests"]').click();await f.page.getByRole('button',{name:'Importar XMLs',exact:true}).click();
  await f.page.getByLabel('Arquivos XML').setInputFiles([{name:'outra-empresa.xml',mimeType:'application/xml',buffer:Buffer.from('<NFSe>não pertence</NFSe>')}]);
  await f.page.getByRole('button',{name:'Conferir arquivos',exact:true}).click();await f.page.getByText('O emitente do XML difere da empresa selecionada.',{exact:true}).waitFor();
  assert.equal(await f.page.getByRole('button',{name:'Confirmar importação',exact:true}).isDisabled(),true);assert.equal(f.state.posts.some(p=>p.path==='imports/commit'),false);assert.deepEqual(f.errors,[]);
 }finally{await f.context.close();}
});

test('importação interrompida retoma o mesmo lote e chave sem perder a conferência',async()=>{
 const f=await pageFixture();try{
  await f.page.getByText('Seu calendário começa aqui').waitFor();f.state.importCommitFailures=1;await f.page.locator('[data-view="requests"]').click();await f.page.getByRole('button',{name:'Importar XMLs',exact:true}).click();
  await f.page.getByLabel('Arquivos XML').setInputFiles([{name:'nota.xml',mimeType:'application/xml',buffer:Buffer.from('<NFSe>sintético</NFSe>')}]);
  await f.page.getByRole('button',{name:'Conferir arquivos',exact:true}).click();await f.page.getByRole('button',{name:'Confirmar importação',exact:true}).click();
  await f.page.getByText('A importação foi interrompida. Repita o mesmo lote para retomar.',{exact:true}).waitFor();await f.page.getByRole('button',{name:'Confirmar importação',exact:true}).click();
  await f.page.getByRole('heading',{name:'Importação concluída',exact:true}).waitFor();const calls=f.state.posts.filter(p=>p.path==='imports/commit');assert.equal(calls.length,2);assert.deepEqual(calls[0],calls[1]);assert.deepEqual(f.errors,[]);
 }finally{await f.context.close();}
});

test('conferência de importação permanece legível em tela móvel',async()=>{
 const f=await pageFixture({mobile:true});try{
  await f.page.getByText('Seu calendário começa aqui').waitFor();await f.page.locator('[data-view="requests"]').click();await f.page.getByRole('button',{name:'Importar XMLs',exact:true}).click();
  await f.page.getByLabel('Arquivos XML').setInputFiles([{name:'nota-de-servicos-sintetica-com-identificacao.xml',mimeType:'application/xml',buffer:Buffer.from('<NFSe>sintético</NFSe>')}]);await f.page.getByRole('button',{name:'Conferir arquivos',exact:true}).click();
  await f.page.getByRole('heading',{name:'Conferir importação',exact:true}).waitFor();assert.equal(await f.page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);assert.equal(await f.page.locator('dialog').evaluate(dialog=>dialog.scrollWidth<=dialog.clientWidth),true);assert.deepEqual(f.errors,[]);
 }finally{await f.context.close();}
});

test('resposta tardia de documento não reabre dados depois de expirar a sessão',async()=>{
 const f=await pageFixture();let release;try{
  await f.page.getByText('Seu calendário começa aqui').waitFor();f.state.documents.push({document_id:'late-document',company_id:'axiacare',access_key:'7'.repeat(50),status:'authorized',competence:'2026-10-31',issued_at:'2026-10-31T10:00:00Z',issuer_document:'12345678000195',customer_document:null,gross_amount_cents:10000,net_amount_cents:9385,source:'import',artifacts:[]});
  await f.page.getByRole('button',{name:'Atualizar',exact:true}).click();await f.page.locator('[data-view="requests"]').click();f.state.documentGate=new Promise(resolve=>{release=resolve;});
  const pending=f.page.waitForRequest('**/documents/late-document');await f.page.getByRole('button',{name:'Abrir nota',exact:true}).click();await pending;
  f.state.authExpired=true;await f.page.getByRole('button',{name:'Atualizar',exact:true}).click();await f.page.getByText('Entre para acessar suas emissões',{exact:true}).waitFor();
  const response=f.page.waitForResponse('**/documents/late-document');release();await response;await f.page.evaluate(()=>new Promise(requestAnimationFrame));
  assert.equal(await f.page.locator('dialog[open]').count(),0);assert.equal(await f.page.locator('#editor-fields').textContent(),'');assert.deepEqual(f.errors,[]);
 }finally{release?.();await f.context.close();}
});

test('acervo baixa PDF original e permite gerar versão preservando o XML',async()=>{
 const f=await pageFixture();try{
  await f.page.getByText('Seu calendário começa aqui').waitFor();f.state.documents.push({document_id:'doc-test',company_id:'axiacare',access_key:'7'.repeat(50),status:'authorized',competence:'2026-10-31',issued_at:'2026-10-31T10:00:00Z',issuer_document:'12345678000195',customer_document:null,gross_amount_cents:10000,net_amount_cents:9385,source:'import',artifacts:[{kind:'xml'},{kind:'pdf'}],timeline:[{type:'archive_imported',source:'import',occurred_at:'2026-10-31T10:00:00Z'}]});f.state.versions=[{kind:'pdf',version:0,renderer_version:'original',created_at:'2026-10-31T10:00:00Z'}];
  await f.page.getByRole('button',{name:'Atualizar',exact:true}).click();await f.page.locator('[data-view="requests"]').click();await f.page.getByRole('button',{name:'Abrir nota',exact:true}).click();
  await f.page.getByText('Acervo importado',{exact:true}).waitFor();
  const download=f.page.waitForEvent('download');await f.page.getByRole('button',{name:'Baixar PDF original',exact:true}).click();await download;assert.equal(f.state.gets.some(path=>path.endsWith('/pdf?version=0')),true);
  await f.page.getByRole('button',{name:'Gerar nova versão do PDF',exact:true}).click();await f.page.getByLabel('Motivo (opcional)').fill('Atualização do documento de apresentação');await f.page.getByRole('button',{name:'Gerar PDF',exact:true}).click();
  await f.page.getByRole('button',{name:'Baixar PDF v1',exact:true}).waitFor();assert.equal(f.state.versions.some(v=>v.version===0),true);assert.deepEqual(f.state.posts.find(p=>p.path.endsWith('/regenerate-pdf')).body,{reason:'Atualização do documento de apresentação'});assert.equal(f.state.posts.some(p=>p.path==='operations'),false);assert.deepEqual(f.errors,[]);
 }finally{await f.context.close();}
});


test('materializa ocorrências e preserva adiamento e dispensa ao recarregar',async()=>{
 const f=await pageFixture();try{
  await f.page.getByText('Seu calendário começa aqui').waitFor();
  const month=await f.page.getByLabel('Mês de planejamento').inputValue();
  f.state.rules.push({rule_id:'one',version:1,company_id:'axiacare',title:'Cobrança um',profile_id:'synthetic',day_of_month:5,frequency:'monthly',start_date:month+'-01',amount_mode:'fixed',gross_amount_cents:10000,competence_rule:'same_month',missing_day_policy:'last_day',status:'active'}, {rule_id:'two',version:1,company_id:'theratech',title:'Cobrança dois',profile_id:'synthetic',day_of_month:5,frequency:'monthly',start_date:month+'-01',amount_mode:'fixed',gross_amount_cents:20000,competence_rule:'same_month',missing_day_policy:'last_day',status:'active'});
  await f.page.getByRole('button',{name:'Atualizar',exact:true}).click();await f.page.locator('[data-view="calendar"]').click();await f.page.getByRole('button',{name:'Gerar ocorrências do mês',exact:true}).click();
  const section=f.page.getByRole('region',{name:'Ocorrências do mês'});await section.getByText('Cobrança um',{exact:true}).waitFor();
  await section.getByRole('row').filter({hasText:'Cobrança um'}).getByRole('button',{name:'Adiar',exact:true}).click();
  await f.page.getByLabel('Nova data prevista').fill(month+'-10');await f.page.getByLabel('Motivo').fill('Ajuste de data solicitado');await f.page.getByRole('button',{name:'Salvar adiamento',exact:true}).click();
  await section.getByText('Adiada',{exact:true}).waitFor();await section.getByRole('row').filter({hasText:'Cobrança dois'}).getByRole('button',{name:'Dispensar',exact:true}).click();
  await f.page.getByLabel('Motivo').fill('Sem cobrança neste mês');await f.page.getByRole('button',{name:'Dispensar ocorrência',exact:true}).click();await section.getByText('Dispensada',{exact:true}).waitFor();
  await f.page.reload();await f.page.getByRole('heading',{name:'Visão geral',exact:true}).waitFor();await f.page.locator('[data-view="calendar"]').click();await f.page.getByRole('region',{name:'Ocorrências do mês'}).getByText('Adiada',{exact:true}).waitFor();
  await f.page.locator('[data-view="overview"]').click();await f.page.getByText('Adiada',{exact:true}).waitFor();assert.equal(f.state.occurrences[0].planned_date,month+'-10');assert.equal(f.state.occurrences[1].status,'skipped');assert.deepEqual(f.errors,[]);
 }finally{await f.context.close();}
});

test('prepara lote discriminado e repete somente item que falhou',async()=>{
 const profiles=[{profile_id:'synthetic',status:'active',name:'Perfil de teste',description_policy:'fixed',description:'Serviço fixo',purchase_order_required:false}];
 const f=await pageFixture({canSimulate:true,profiles});try{
  await f.page.getByText('Seu calendário começa aqui').waitFor();const month=await f.page.getByLabel('Mês de planejamento').inputValue();
  for(const [id,title] of [['one','Cobrança um'],['two','Cobrança dois']])f.state.occurrences.push({occurrence_id:id,company_id:'axiacare',version:1,month,title,status:'pending',planned_date:month+'-05',competence:month,profile_id:'synthetic',amount_mode:'fixed',gross_amount_cents:10000});
  f.state.failPrepare.add('two');await f.page.getByRole('button',{name:'Atualizar',exact:true}).click();await f.page.locator('[data-view="calendar"]').click();
  const section=f.page.getByRole('region',{name:'Ocorrências do mês'});for(const box of await section.getByRole('checkbox').all())await box.check();
  await f.page.getByRole('button',{name:'Preparar selecionadas',exact:true}).click();
  await f.page.getByLabel('Data da competência — Cobrança um').fill(month+'-01');await f.page.getByLabel('Data da competência — Cobrança dois').fill(month+'-01');
  await f.page.getByRole('button',{name:'Preparar 2 prévias',exact:true}).click();await f.page.getByText('Perfil temporariamente indisponível.',{exact:true}).waitFor();
  f.state.failPrepare.clear();await f.page.getByRole('button',{name:'Preparar pendentes',exact:true}).click();await f.page.getByText('2 prévias preparadas. Confira os dados antes de aprovar.',{exact:true}).waitFor();
  const calls=f.state.posts.filter(p=>p.path==='request-batches/prepare');assert.equal(calls[0].body.items.length,2);assert.equal(calls[1].body.items.length,1);assert.equal(calls[1].body.items[0].occurrence_id,'two');assert.notEqual(calls[0].key,calls[1].key);assert.equal(f.state.fiscalRequests.length,2);assert.deepEqual(f.errors,[]);
 }finally{await f.context.close();}
});

test('aprova manifesto selecionado e revisão exige nova aprovação com linha do tempo',async()=>{
 const profiles=[{profile_id:'synthetic',status:'active',name:'Perfil de teste',description_policy:'fixed',description:'Serviço fixo',purchase_order_required:false}];
 const f=await pageFixture({canSimulate:true,profiles});try{
  await f.page.getByText('Seu calendário começa aqui').waitFor();
  for(const id of ['one','two'])f.state.fiscalRequests.push(f.state.makeRequest(id,{company_id:'axiacare',profile_id:'synthetic',gross_amount_cents:10000,competence:'2026-10',competence_date:'2026-10-31'}));
  await f.page.getByRole('button',{name:'Atualizar',exact:true}).click();await f.page.locator('[data-view="requests"]').click();const section=f.page.getByRole('region',{name:'Solicitações'});
  for(const box of await section.getByRole('checkbox').all())await box.check();await f.page.getByRole('button',{name:'Aprovar selecionadas',exact:true}).click();
  await f.page.getByRole('heading',{name:'Conferir lote de aprovação',exact:true}).waitFor();assert.equal(await f.page.getByText('Tomador de teste',{exact:true}).count(),2);
  await f.page.getByRole('button',{name:'Aprovar 2 notas',exact:true}).click();await f.page.getByText('Aprovação registrada para 2 notas.',{exact:true}).waitFor();
  const approved=f.state.posts.find(p=>p.path==='approval-batches');assert.deepEqual(approved.body.items.map(i=>i.request_id).sort(),['one','two']);assert.equal(f.state.posts.some(p=>p.path==='operations'),false);
  await section.getByRole('button',{name:'Conferir',exact:true}).first().click();await f.page.getByRole('button',{name:'Revisar prévia',exact:true}).click();await f.page.getByLabel('Valor bruto (R$)').fill('110,00');await f.page.getByRole('button',{name:'Salvar nova revisão',exact:true}).click();await f.page.getByText('Nova revisão preparada. A aprovação anterior não autoriza esta revisão.',{exact:true}).waitFor();
  assert.equal(f.state.fiscalRequests[0].revision,2);assert.equal(f.state.fiscalRequests[0].status,'prepared');assert.equal(f.state.fiscalRequests[0].active_approval,null);
  await section.getByRole('button',{name:'Conferir',exact:true}).first().click();await f.page.getByRole('heading',{name:'Linha do tempo',exact:true}).waitFor();await f.page.getByText('Prévia revisada',{exact:true}).waitFor();assert.deepEqual(f.errors,[]);
 }finally{await f.context.close();}
});


test('filtra solicitações e acervo no servidor e mostra linha do tempo da nota',async()=>{
 const f=await pageFixture();try{
  await f.page.getByText('Seu calendário começa aqui').waitFor();
  f.state.fiscalRequests.push(f.state.makeRequest('one',{company_id:'axiacare',profile_id:'synthetic',gross_amount_cents:10000,competence:'2026-10',competence_date:'2026-10-31'}));
  f.state.documents.push({document_id:'doc-timeline',company_id:'axiacare',access_key:'7'.repeat(50),status:'cancelled',competence:'2026-10-31',issuer_document:'12345678000195',customer_document:'11222333000181',gross_amount_cents:10000,net_amount_cents:9900,artifacts:[],timeline:[{event_type:'cancelled',created_at:'2026-10-31T15:00:00Z',message:'Evento oficial recebido'}]});
  await f.page.getByRole('button',{name:'Atualizar',exact:true}).click();await f.page.locator('[data-view="requests"]').click();
  await f.page.waitForFunction(()=>document.getElementById('content').getAttribute('aria-busy')==='false');
  const requestsResponse=f.page.waitForResponse(response=>{const url=new URL(response.url());return url.pathname==='/nfse/v2/requests'&&url.searchParams.get('status')==='prepared'&&url.searchParams.get('competence')==='2026-10';});
  const requests=f.page.getByRole('form',{name:'Filtros de solicitações'});await requests.getByLabel('Situação',{exact:true}).selectOption('prepared');await requests.getByLabel('Competência do filtro').fill('2026-10');await requests.getByRole('button',{name:'Aplicar filtros'}).click();
  assert.equal((await requestsResponse).status(),200);await f.page.waitForFunction(()=>document.getElementById('content').getAttribute('aria-busy')==='false');
  await f.page.getByRole('button',{name:'Conferir',exact:true}).waitFor();assert.ok(f.state.gets.some(path=>path.includes('/requests?')&&path.includes('status=prepared')&&path.includes('competence=2026-10')));
  const archiveResponse=f.page.waitForResponse(response=>{const url=new URL(response.url());return url.pathname==='/nfse/v2/documents'&&url.searchParams.get('customer_document')==='11222333000181'&&url.searchParams.get('access_key')==='7'.repeat(50)&&url.searchParams.get('issued_from')==='2026-10-01'&&url.searchParams.get('issued_to')==='2026-10-31';});
  const archive=f.page.getByRole('form',{name:'Filtros do acervo'});await archive.getByLabel('Emitida a partir de').fill('2026-10-01');await archive.getByLabel('Emitida até').fill('2026-10-31');await archive.getByLabel('CNPJ ou CPF do tomador').fill('11.222.333/0001-81');await archive.getByLabel('Chave de acesso').fill('7'.repeat(50));await archive.getByRole('button',{name:'Aplicar filtros'}).click();
  assert.equal((await archiveResponse).status(),200);await f.page.waitForFunction(()=>document.getElementById('content').getAttribute('aria-busy')==='false');
  await f.page.getByRole('button',{name:'Abrir nota',exact:true}).click();await f.page.getByRole('heading',{name:'Linha do tempo',exact:true}).waitFor();await f.page.getByText('Cancelamento registrado',{exact:true}).waitFor();
  assert.ok(f.state.gets.some(path=>path.includes('/documents?')&&path.includes('customer_document=11222333000181')&&path.includes('access_key='+'7'.repeat(50))&&path.includes('issued_from=2026-10-01')&&path.includes('issued_to=2026-10-31')));assert.deepEqual(f.errors,[]);
 }finally{await f.context.close();}
});

test('atualização retida impede editar filtros antigos e conserva a entrada feita depois',async()=>{
 const f=await pageFixture();let release;try{
  await f.page.getByText('Seu calendário começa aqui').waitFor();await f.page.locator('[data-view="requests"]').click();
  let started;const entered=new Promise(resolve=>{started=resolve;}),gate=new Promise(resolve=>{release=resolve;});
  await f.page.route('https://api.grupocsv.com/nfse/v2/requests?*',async route=>{started();await gate;await route.fallback();});
  const requests=f.page.getByRole('form',{name:'Filtros de solicitações'});await requests.getByLabel('Situação',{exact:true}).selectOption('prepared');await requests.getByRole('button',{name:'Aplicar filtros'}).click();await entered;
  const customer=f.page.locator('form[aria-label="Filtros do acervo"] input[name="customer_document"]');
  await customer.evaluate(input=>input.focus());
  await f.page.keyboard.type('11222333000181');
  assert.equal(await customer.inputValue(),'');
  const response=f.page.waitForResponse(r=>r.url().includes('/nfse/v2/requests?')&&new URL(r.url()).searchParams.get('status')==='prepared');release();await response;
  await f.page.waitForFunction(()=>document.getElementById('content').getAttribute('aria-busy')==='false');
  await f.page.getByRole('form',{name:'Filtros do acervo'}).getByLabel('CNPJ ou CPF do tomador').fill('11222333000181');
  assert.equal(await f.page.getByRole('form',{name:'Filtros do acervo'}).getByLabel('CNPJ ou CPF do tomador').inputValue(),'11222333000181');assert.deepEqual(f.errors,[]);
 }finally{release?.();await f.context.close();}
});

test('resposta de atualização anterior não libera a tela enquanto a atual está pendente',async()=>{
 const f=await pageFixture();const releases=[];try{
  await f.page.getByText('Seu calendário começa aqui').waitFor();await f.page.locator('[data-view="requests"]').click();
  const starts=[];await f.page.route('https://api.grupocsv.com/nfse/v2/requests?*',async route=>{const index=starts.length;let release;const gate=new Promise(resolve=>{release=resolve;});releases[index]=release;starts.push(route.request().url());await gate;await route.fallback();});
  const first=f.page.waitForRequest(r=>r.url().includes('/nfse/v2/requests?')&&new URL(r.url()).searchParams.get('status')==='prepared');
  const filters=f.page.getByRole('form',{name:'Filtros de solicitações'});await filters.getByLabel('Situação',{exact:true}).selectOption('prepared');await filters.getByRole('button',{name:'Aplicar filtros'}).click();await first;
  const second=f.page.waitForRequest(r=>r.url().includes('/nfse/v2/requests?')&&new URL(r.url()).searchParams.get('company_id')==='axiacare');await f.page.locator('#company-filter').selectOption('axiacare');await second;
  const oldResponse=f.page.waitForResponse(r=>r.url()===starts[0]);releases[0]();await (await oldResponse).finished();await f.page.evaluate(()=>new Promise(requestAnimationFrame));
  assert.equal(await f.page.locator('#content').evaluate(content=>content.inert),true);
  const currentResponse=f.page.waitForResponse(r=>r.url()===starts[1]);releases[1]();await (await currentResponse).finished();await f.page.waitForFunction(()=>!document.getElementById('content').inert&&document.getElementById('content').getAttribute('aria-busy')==='false');assert.deepEqual(f.errors,[]);
 }finally{releases.forEach(release=>release());await f.context.close();}
});
