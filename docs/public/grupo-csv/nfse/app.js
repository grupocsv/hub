import { parseMoney, money, occurrence, currentMonth, dateLabel } from './model.js';

const API = 'https://api.grupocsv.com/nfse';
const $ = id => document.getElementById(id);
const titles = {
  overview:['Visão geral','Suas emissões, da preparação à confirmação.'],
  requests:['Notas','Solicitações, prévias e acompanhamento fiscal.'],
  calendar:['Calendário','Organize quando preparar cada emissão.'],
  companies:['Empresas','Cadastros e condições para emitir.'],
  connections:['Conexões','Acesse a plataforma pelos seus clientes MCP.'],
  activity:['Atividade','Acompanhe o processamento das operações.'],
};
const statusNames = { prepared:'Preparada', approved:'Aprovada', queued:'Na fila', preparing:'Preparando', ready_to_send:'Pronta para envio', sending:'Enviando', authorized:'Autorizada', rejected:'Rejeitada', unknown:'Aguardando confirmação', reconciling:'Consultando resultado', active:'Ativa', paused:'Pausada', pending_configuration:'Configuração pendente', suspended:'Suspensa' };
const state = { view:'overview', company:'', month:currentMonth(), valid:false, loading:false, generation:0, meta:null, companies:[], overview:null, requests:[], calendar:[], operations:[], documents:[], events:[], clients:[], cursors:{}, busy:false, form:null, formKey:null, ready:null };

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined && text !== null) node.textContent = String(text);
  return node;
}
function button(text, className, action) { const b = el('button',className,text); b.type='button'; b.addEventListener('click',action); return b; }
function companyName(id) { return state.companies.find(x => x.company_id === id)?.name ?? id; }
function badge(status) { return el('span',`pill ${['active','authorized'].includes(status) ? 'good' : ['rejected','suspended'].includes(status) ? 'bad' : 'pending'}`,statusNames[status] ?? status); }
function note(message, error = false) {
  $('notice').replaceChildren();
  if (message) $('notice').append(el('div',`notice${error ? ' error' : ''}`,message));
}
function empty(title, description, action) {
  const d=el('div','empty');d.append(el('div','empty-symbol','NF'),el('h2','',title),el('p','',description));
  if(action)d.append(button(action.text,'secondary',action.run));return d;
}
function panel(title, subtitle, action) {
  const p=el('section','panel'),h=el('header','panel-header'),text=el('div');text.append(el('h2','',title));if(subtitle)text.append(el('p','',subtitle));h.append(text);if(action)h.append(button(action.text,'quiet',action.run));p.append(h);return p;
}
function setView(view) {
  if(!titles[view])return;state.view=view;
  $('page-title').textContent=titles[view][0];$('page-subtitle').textContent=titles[view][1];
  document.querySelectorAll('#nav button').forEach(b => b.dataset.view===view ? b.setAttribute('aria-current','page') : b.removeAttribute('aria-current'));
  render();
}
async function api(path, { body, key, signal } = {}) {
  const controller=new AbortController(),timer=setTimeout(() => controller.abort(),20000);
  if(signal) signal.addEventListener('abort',() => controller.abort(),{once:true});
  try {
    const response=await window.HUB_AUTH_API.fetch(API+path,{method:body===undefined?'GET':'POST',signal:controller.signal,headers:body===undefined?{}:{'Content-Type':'application/json','Idempotency-Key':key??crypto.randomUUID()},...(body===undefined?{}:{body:JSON.stringify(body)})});
    if(response.status===401){state.valid=false;state.generation++;clearData();render();throw new Error('Sua sessão expirou. Entre novamente para continuar.');}
    let payload;try{payload=await response.json();}catch{throw new Error('O serviço retornou uma resposta inválida. Tente atualizar.');}
    if(!response.ok) throw new Error(payload.error?.message ?? 'Não foi possível concluir a solicitação.');
    if(!payload || !Object.hasOwn(payload,'data')) throw new Error('A resposta não contém os dados esperados.');
    return payload;
  } catch(error) {
    if(error.name==='AbortError')throw new Error('O serviço demorou para responder. Atualize para conferir o resultado antes de repetir uma ação.');
    throw error;
  } finally {clearTimeout(timer);}
}
function clearData(){state.meta=null;state.overview=null;state.companies=[];state.requests=[];state.calendar=[];state.operations=[];state.documents=[];state.events=[];state.clients=[];state.cursors={};state.form=null;state.formKey=null;$('editor').close();$('editor-fields').replaceChildren();}
async function load() {
  if(!state.valid)return;
  const generation=++state.generation;state.loading=true;note('Atualizando informações…');$('content').setAttribute('aria-busy','true');$('refresh').disabled=true;
  const q=state.company?`?company_id=${encodeURIComponent(state.company)}`:'';
  const names=['meta','companies','overview','requests','calendar','operations','documents','events','clients'];
  const paths=['/v2/meta','/v2/companies','/v2/overview'+q,'/v2/requests'+q,'/v2/calendar-rules'+q,'/v2/operations'+q,'/v2/documents'+q,'/v2/events'+q,'/v2/clients'];
  const results=await Promise.allSettled(paths.map(path=>api(path)));
  if(generation!==state.generation)return;
  const failed=results.find(x=>x.status==='rejected');
  state.loading=false;$('refresh').disabled=false;$('content').setAttribute('aria-busy','false');
  if(failed){clearData();note(failed.reason?.message??'Não foi possível atualizar os dados.',true);render();return;}
  results.forEach((result,i)=>{state[names[i]]=result.value.data;state.cursors[names[i]]=result.value.meta?.next_cursor??null;});
  const select=$('company-filter');select.replaceChildren(new Option('Todas as empresas',''));
  state.companies.forEach(c=>select.add(new Option(c.name,c.company_id)));select.value=state.company;select.disabled=false;
  const environment=state.meta?.environment;
  $('environment').textContent=environment==='production'?'Produção':environment==='test'||environment==='development'?'Ambiente de teste':'Ambiente não informado';
  $('prepare').disabled=!state.companies.some(c=>c.readiness?.can_simulate);
  note(state.overview?.history_coverage?.status==='not_synchronized'?'O histórico oficial ainda não foi sincronizado nesta área. As contagens abaixo representam somente os dados disponíveis aqui.':null);
  render();
}
function filteredCompanies(){return state.companies.filter(c=>!state.company||c.company_id===state.company);}
function readinessText(c){return c.readiness?.can_emit?'Habilitada para emissão':'Aguardando configuração fiscal';}
function companyRow(c){const row=el('div','company-row'),identity=el('div','identity'),text=el('div');text.append(el('h3','',c.name),el('p','',readinessText(c)));identity.append(el('span','initial',c.name.slice(0,1)),text);row.append(identity,badge(c.status));return row;}
function renderOverview(root){
  const o=state.overview,stats=el('div','stats');
  [['Preparadas',o.counts.prepared,'Prontas para conferência'],['Aprovadas',o.counts.approved,'Com aprovação registrada'],['Em processamento',o.counts.processing,'Aguardando resultado'],['Autorizadas',o.counts.authorized,'Confirmadas nesta base']].forEach(([label,value,help])=>{const s=el('article','stat');s.append(el('span','',label),el('strong','',value),el('small','',help));stats.append(s);});root.append(stats);
  const columns=el('div','columns'),schedule=panel('Calendário de emissões','Planejamento de '+state.month.split('-').reverse().join('/'),{text:'Ver calendário →',run:()=>setView('calendar')}),companies=panel('Suas empresas','Condições de emissão por empresa');
  const occurrences=state.calendar.map(rule=>({rule,item:occurrence(rule,state.month)})).filter(x=>x.item).sort((a,b)=>(a.item.date??'9999').localeCompare(b.item.date??'9999'));
  if(!occurrences.length)schedule.append(empty('Seu calendário começa aqui','Cadastre as emissões recorrentes. Você poderá editar as regras a qualquer momento.',{text:'Configurar calendário',run:()=>openCalendar()}));
  else occurrences.slice(0,5).forEach(({rule,item})=>{const row=el('div','schedule-row'),identity=el('div','identity'),text=el('div'),value=el('div','text-end');text.append(el('h3','',rule.title),el('p','',companyName(rule.company_id)));identity.append(el('div','date-block',item.date?.slice(-2)??'—'),text);value.append(el('strong','amount',rule.amount_mode==='fixed'?money(rule.gross_amount_cents):'Valor a informar'),el('p','',item.needsDate?'Definir data':'Competência '+item.competence));row.append(identity,value);schedule.append(row);});
  filteredCompanies().forEach(c=>companies.append(companyRow(c)));columns.append(schedule,companies);root.append(columns);
  const small=el('p','subnote');small.append(el('span'),document.createTextNode('O calendário organiza a preparação. Cada emissão continua dependendo da sua aprovação.'));root.append(small);
}
function heading(title,description,action){const h=el('div','section-title'),d=el('div');d.append(el('h2','',title));if(description)d.append(el('p','muted',description));h.append(d);if(action)h.append(button(action.text,'primary',action.run));return h;}
function table(headers,rows){const wrap=el('div','panel table-wrap'),t=el('table'),thead=el('thead'),tr=el('tr'),body=el('tbody');headers.forEach(h=>{const th=el('th','',h);th.scope='col';tr.append(th);});thead.append(tr);rows.forEach(cells=>{const row=el('tr');cells.forEach((cell,i)=>{const td=el('td');td.dataset.label=headers[i];td.append(cell instanceof Node?cell:document.createTextNode(String(cell??'—')));row.append(td);});body.append(row);});t.append(thead,body);wrap.append(t);return wrap;}
function renderCalendar(root){
  root.append(heading('Regras de emissão','Defina datas e valores sem agendar transmissões automáticas.',{text:'Nova regra',run:()=>openCalendar()}));
  if(!state.calendar.length){root.append(el('section','panel'));root.lastChild.append(empty('Nenhuma regra cadastrada','Comece por uma emissão recorrente. Você também poderá preparar notas avulsas.'));return;}
  root.append(table(['Emissão','Empresa','Previsão','Valor bruto','Situação','Ações'],state.calendar.map(rule=>{
    const name=el('div');name.append(el('strong','',rule.title),el('small','',rule.competence_rule==='previous_month'?'Competência do mês anterior':'Competência do mesmo mês'));
    const actions=el('div','row-actions');actions.append(button('Editar','quiet',()=>openCalendar(rule)),button(rule.status==='active'?'Pausar':'Ativar','quiet',()=>toggleRule(rule)),button('Arquivar','quiet',()=>openArchive(rule)));
    return[name,companyName(rule.company_id),`Dia ${rule.day_of_month}`,rule.amount_mode==='fixed'?money(rule.gross_amount_cents):'A informar',badge(rule.status),actions];
  })));pagination(root,'calendar','/v2/calendar-rules');
  root.append(el('p','safe-note','Se o dia não existir no mês, valerá a regra escolhida: último dia do mês ou definição manual. As regras podem ser editadas mesmo com o cadastro fiscal pendente.'));
}
function renderCompanies(root){const grid=el('div','grid-cards');filteredCompanies().forEach(c=>{const card=el('article','panel company-card');card.append(el('div','initial',c.name.slice(0,1)),el('h2','',c.name),badge(c.status));const list=el('ul');(c.readiness?.blockers??[]).forEach(b=>list.append(el('li','',b.message)));card.append(list);const sync=button('Sincronizar notas','secondary',async()=>{sync.disabled=true;try{await api('/v2/sync',{body:{company_id:c.company_id}});await load();note('Consulta de distribuição concluída. O acervo pode não cobrir todo o histórico anterior.');}catch(e){note(e.message,true);}finally{sync.disabled=false;}});sync.disabled=c.status!=='active';card.append(sync);grid.append(card);});root.append(grid);root.append(el('p','safe-note','Os dados fiscais serão preenchidos a partir das fontes validadas. Os certificados e suas senhas são recebidos por procedimento privado; não os envie aos agentes ou às conversas.'));}
function renderRequests(root){root.append(heading('Solicitações','Prepare e confira cada nota antes de autorizar a emissão.'));if(!state.requests.length)root.append(empty('Nenhuma solicitação nesta área','Prepare uma nota após configurar a empresa. O histórico anterior continua disponível no emissor atual.'));
  else root.append(table(['Nota','Empresa','Competência','Valor bruto','Valor líquido','Situação','Detalhes'],state.requests.map(r=>{const d=r.snapshot?.data??{},a=d.amounts??{};return[r.snapshot?.data?.profile?.name??r.snapshot?.data?.profile?.profile_id??r.request_id.slice(0,8),companyName(r.company_id),d.input?.competence??'—',money(a.gross_amount_cents),money(a.net_amount_cents),badge(r.status),button('Conferir','quiet',()=>openRequest(r))];})));pagination(root,'requests','/v2/requests');
  root.append(heading('Acervo de notas','Documentos oficiais preservados e eventos acompanhados.'));
  if(!state.documents.length)root.append(empty('Nenhuma nota no acervo','O histórico será preenchido pelas emissões e pela sincronização.'));
  else root.append(table(['Chave de acesso','Empresa','Competência','Valor bruto','Valor líquido','Situação','Arquivos'],state.documents.map(d=>[d.access_key,companyName(d.company_id),dateLabel(d.competence),money(d.gross_amount_cents),money(d.net_amount_cents),badge(d.status),button('Abrir nota','quiet',()=>openDocument(d))])));pagination(root,'documents','/v2/documents');
}
function renderActivity(root){root.append(heading('Operações','Resultados confirmados e consultas em andamento.'));if(!state.operations.length)root.append(empty('Nenhuma operação registrada','As operações aparecerão aqui quando uma emissão for solicitada.'));else root.append(table(['Operação','Empresa','Situação','Registro'],state.operations.map(o=>[o.operation_id,companyName(o.company_id),badge(o.status),dateLabel(o.created_at)])));pagination(root,'operations','/v2/operations');
  if(state.events.length){const names={prepared:'Prévia preparada',approved:'Aprovação registrada',calendar_created:'Regra criada',calendar_updated:'Regra atualizada',calendar_archived:'Regra arquivada',operation_queued:'Emissão solicitada',authorized:'Nota autorizada',rejected:'Nota rejeitada',unknown:'Resultado aguardando consulta'};root.append(heading('Histórico de atividade','Alterações registradas pela plataforma.'),table(['Evento','Empresa','Registro'],state.events.map(e=>[names[e.event_type]??e.event_type,companyName(e.company_id),dateLabel(e.created_at)])));pagination(root,'events','/v2/events');}}
function renderConnections(root){root.append(heading('Conexões MCP','Configure uma chave para cada aplicativo.',{text:'Nova conexão',run:()=>openClient()}));
  if(!state.clients.length)root.append(empty('Seus agentes ainda não estão conectados','Crie uma conexão para Claude Cowork, Codex, Manus, Hermes ou OpenClaw.'));
  else root.append(table(['Conexão','Empresas','Permissões','Validade','Situação','Ações'],state.clients.map(c=>{const actions=el('div','row-actions');if(c.status!=='revoked')actions.append(button('Editar','quiet',()=>openClient(c)),button('Revogar','quiet',()=>openRevoke(c)));return[c.name,c.company_ids.map(companyName).join(', '),c.scopes.includes('emit')?'Preparar e emitir com aprovação':'Consulta e preparação',c.expires_at?dateLabel(c.expires_at):'Sem prazo definido',badge(c.status),actions];})));
  root.append(el('p','safe-note',state.meta?.mcp?.url?`Endereço MCP: ${state.meta.mcp.url}`:'O endereço MCP será informado após a implantação. As conexões usam uma chave individual; a compatibilidade de cada cliente é verificada na configuração.'));
  root.append(el('p','subnote','Você aprova a nota ou o lote na conversa. Conectar um aplicativo não autoriza emissões futuras automaticamente.'));}
function render(){
  const root=$('content');root.replaceChildren();
  if(!state.valid){root.append(empty('Entre para acessar suas emissões','Use sua conta individual do Hub. Nenhum dado fiscal é carregado antes da autenticação.'));return;}
  if(!state.overview){root.append(empty('Informações indisponíveis','Não foi possível carregar esta área. Isso não significa que não existam notas.',{text:'Tentar novamente',run:load}));return;}
  ({overview:renderOverview,calendar:renderCalendar,companies:renderCompanies,requests:renderRequests,activity:renderActivity,connections:renderConnections})[state.view](root);
}
function pagination(root,key,path){if(!state.cursors[key])return;const div=el('div','pagination');div.append(button('Carregar mais','secondary',async event=>{event.currentTarget.disabled=true;try{const q=new URLSearchParams({cursor:state.cursors[key]});if(state.company)q.set('company_id',state.company);const next=await api(path+'?'+q);state[key].push(...next.data);state.cursors[key]=next.meta?.next_cursor??null;render();}catch(e){note(e.message,true);event.currentTarget.disabled=false;}}));root.append(div);}
function field(label,name,type='text',value='',wide=false){const l=el('label',wide?'wide':'');l.append(document.createTextNode(label));const input=el(type==='textarea'?'textarea':'input');input.name=name;if(type!=='textarea')input.type=type;input.value=value??'';l.append(input);$('editor-fields').append(l);return input;}
function selectField(label,name,options,value,wide=false){const l=el('label',wide?'wide':'');l.append(document.createTextNode(label));const input=el('select');input.name=name;input.setAttribute('aria-label',label);options.forEach(([v,t])=>input.add(new Option(t,v)));input.value=value??'';l.append(input);$('editor-fields').append(l);return input;}
function displayMoneyInput(cents){return Number.isSafeInteger(cents)?`${Math.floor(cents/100)},${String(cents%100).padStart(2,'0')}`:'';}
function openEditor(title,kind,save,form){state.form=form;state.formKey=crypto.randomUUID();$('editor-title').textContent=title;$('editor-kind').textContent=kind;$('editor-save').textContent=save;$('editor-save').hidden=false;$('editor-error').textContent='';$('editor-fields').replaceChildren();$('editor').showModal();}
function setBusy(busy){state.busy=busy;for(const id of ['editor-save','editor-cancel','editor-close'])$(id).disabled=busy;}
function calendarPayload(rule){const {company_id,title,profile_id,day_of_month,frequency,start_date,end_date,amount_mode,gross_amount_cents,competence_rule,missing_day_policy,notes,status}=rule;return{company_id,title,profile_id,day_of_month,frequency,start_date,end_date,amount_mode,gross_amount_cents,competence_rule,missing_day_policy,notes,status};}
function openCalendar(rule){
  openEditor(rule?'Editar regra de emissão':'Nova regra de emissão','CALENDÁRIO','Salvar regra',{type:'calendar',rule});
  const title=field('Nome da emissão','title','text',rule?.title??'',true);title.required=true;title.maxLength=160;
  const company=selectField('Empresa','company_id',state.companies.map(c=>[c.company_id,c.name]),rule?.company_id??state.company??'');if(!company.value)company.selectedIndex=0;company.disabled=Boolean(rule);
  const profile=selectField('Perfil de serviço e tomador (opcional)','profile_id',[['','Configurar depois']],rule?.profile_id??'',true);
  let profileGeneration=0;const loadCalendarProfiles=async()=>{const generation=++profileGeneration;profile.disabled=true;try{const result=await api(`/v2/companies/${encodeURIComponent(company.value)}/profiles`);if(generation!==profileGeneration||!$('editor').open||state.form?.type!=='calendar')return;profile.replaceChildren(new Option('Configurar depois',''));const seen=new Set();result.data.forEach(p=>{if(!seen.has(p.profile_id)){profile.add(new Option(p.name??p.profile_id,p.profile_id));seen.add(p.profile_id);}});if(rule?.profile_id&&!seen.has(rule.profile_id))profile.add(new Option(rule.profile_id,rule.profile_id));profile.value=rule?.profile_id??'';}catch(e){$('editor-error').textContent=e.message;}finally{if(generation===profileGeneration)profile.disabled=false;}};company.addEventListener('change',loadCalendarProfiles);loadCalendarProfiles();
  const day=field('Dia previsto no mês','day_of_month','number',rule?.day_of_month??5);day.min=1;day.max=31;day.required=true;
  selectField('Competência','competence_rule',[['previous_month','Mês anterior à emissão'],['same_month','Mesmo mês da emissão']],rule?.competence_rule??'previous_month');
  selectField('Quando o dia não existir','missing_day_policy',[['last_day','Usar o último dia do mês'],['manual','Definir a data manualmente']],rule?.missing_day_policy??'last_day');
  const mode=selectField('Valor','amount_mode',[['variable','Informar a cada emissão'],['fixed','Valor fixo']],rule?.amount_mode??'variable');
  const amount=field('Valor bruto (R$)','gross_amount','text',displayMoneyInput(rule?.gross_amount_cents));amount.inputMode='decimal';amount.placeholder='0,00';
  const change=()=>{amount.disabled=mode.value!=='fixed';amount.required=mode.value==='fixed';};mode.addEventListener('change',change);change();
  field('Início da regra','start_date','date',rule?.start_date??state.month+'-01').required=true;field('Fim da regra (opcional)','end_date','date',rule?.end_date??'');
  selectField('Situação','status',[['active','Ativa'],['paused','Pausada']],rule?.status??'active');
  field('Observações (opcional)','notes','textarea',rule?.notes??'',true).maxLength=1000;
  title.focus();
}
async function toggleRule(rule){if(state.busy)return;state.busy=true;try{await api(`/v2/calendar-rules/${encodeURIComponent(rule.rule_id)}`,{body:{...calendarPayload(rule),status:rule.status==='active'?'paused':'active',expected_version:rule.version},key:crypto.randomUUID()});await load();}catch(e){note(e.message,true);}finally{state.busy=false;}}
function openArchive(rule){openEditor('Arquivar regra','CALENDÁRIO','Confirmar arquivamento',{type:'archive',rule});$('editor-fields').append(el('p','wide',`A regra “${rule.title}” deixará de aparecer no calendário. As versões anteriores e as notas já preparadas serão preservadas.`));}
function openClient(client){
  openEditor(client?'Editar conexão':'Nova conexão','ACESSO MCP',client?'Salvar conexão':'Gerar chave',{type:'client',client});
  const name=field('Nome do aplicativo','name','text',client?.name??'',true);name.required=true;name.maxLength=80;name.placeholder='Ex.: Claude Cowork';
  const companies=el('fieldset','wide');companies.append(el('legend','','Empresas permitidas'));
  state.companies.forEach(c=>{const label=el('label','check-label'),box=el('input');box.type='checkbox';box.name='company_ids';box.value=c.company_id;box.checked=client?client.company_ids.includes(c.company_id):true;label.append(box,document.createTextNode(c.name));companies.append(label);});$('editor-fields').append(companies);
  selectField('Permissões','access',[['read','Somente consultar'],['prepare','Consultar e preparar'],['full','Preparar e emitir com minha aprovação']],client?(client.scopes.includes('emit')?'full':client.scopes.includes('request')?'prepare':'read'):'full',true);
  field('Último dia de validade (opcional)','expires_at','date',client?.expires_at?.slice(0,10)??'',true);
  $('editor-fields').append(el('p','safe-note wide','Cada emissão continua exigindo sua aprovação explícita. Revogar esta conexão impede novas chamadas deste aplicativo.'));
}
function openRevoke(client){openEditor('Revogar conexão','ACESSO MCP','Revogar acesso',{type:'revoke',client});$('editor-fields').append(el('p','wide',`A conexão “${client.name}” deixará de acessar o sistema. O histórico de notas e aprovações será preservado.`));}
function openSecret(result){
  openEditor('Chave da conexão','ACESSO MCP','Concluir',{type:'secret'});$('editor-save').hidden=true;
  if(!result.secret_available){$('editor-fields').append(el('p','wide','A conexão foi criada. A chave já foi exibida na resposta original e não pode ser recuperada. Se você não a guardou, revogue esta conexão e crie outra.'));return;}
  const input=field('Chave de acesso (exibida uma vez)','connection_secret','password',result.secret,true);input.readOnly=true;input.autocomplete='off';
  const actions=el('div','wide row-actions');actions.append(button('Exibir','secondary',event=>{input.type=input.type==='password'?'text':'password';event.currentTarget.textContent=input.type==='password'?'Exibir':'Ocultar';}),button('Copiar chave','primary',async event=>{try{await navigator.clipboard.writeText(input.value);event.currentTarget.textContent='Chave copiada';}catch{$('editor-error').textContent='Selecione e copie a chave manualmente.';}}));$('editor-fields').append(actions,el('p','safe-note wide','Guarde a chave no campo de autenticação do cliente MCP. Ela não será exibida novamente após fechar esta janela.'));
}
async function openDocument(document){
  let d;try{d=(await api(`/v2/documents/${encodeURIComponent(document.document_id)}`)).data;}catch(e){note(e.message,true);return;}
  openEditor('Nota fiscal preservada','ACERVO','Fechar',{type:'document'});$('editor-save').hidden=true;
  const grid=el('div','detail-grid wide');[['Empresa',companyName(d.company_id)],['Situação',({authorized:'Autorizada',cancelled:'Cancelada',substituted:'Substituída'})[d.status]??d.status],['Emitente',d.issuer_document],['Tomador',d.customer_document??'Não identificado'],['Emissão',dateLabel(d.issued_at)],['Competência',dateLabel(d.competence)],['Valor bruto',money(d.gross_amount_cents)],['Valor líquido',money(d.net_amount_cents)],['Chave',d.access_key],['Origem',({platform:'Plataforma',adn:'Distribuição nacional',import:'Importação'})[d.source]??d.source]].forEach(([name,value])=>{const item=el('div');item.append(el('small','',name),el('strong','',value));grid.append(item);});$('editor-fields').append(grid);
  const files=el('div','wide row-actions');for(const artifact of d.artifacts??[])files.append(button(`Baixar ${artifact.kind.toUpperCase()}`,'secondary',event=>downloadDocument(d,artifact.kind,event.currentTarget)));$('editor-fields').append(files);
}
async function downloadDocument(doc,kind,button){button.disabled=true;try{
  const response=await window.HUB_AUTH_API.fetch(`${API}/v2/documents/${encodeURIComponent(doc.document_id)}/${kind}`);
  if(!response.ok){const body=await response.json();throw new Error(body.error?.message??'Não foi possível obter o arquivo.');}
  const blob=await response.blob(),url=URL.createObjectURL(blob),link=el('a');link.href=url;link.download=`NFSe-${doc.access_key}.${kind}`;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}catch(e){$('editor-error').textContent=e.message;}finally{button.disabled=false;}}
async function openPrepare(){
  const companies=state.companies.filter(c=>c.readiness?.can_simulate);
  if(!companies.length){setView('companies');return;}
  openEditor('Preparar uma nota','NOVA SOLICITAÇÃO','Preparar prévia',{type:'prepare'});
  const company=selectField('Empresa','company_id',companies.map(c=>[c.company_id,c.name]),state.company||companies[0].company_id);
  const profiles=selectField('Perfil de serviço e tomador','profile_id',[['','Carregando perfis…']],'');profiles.required=true;
  field('Valor bruto (R$)','gross_amount','text','').required=true;
  field('Competência','competence','month',state.month).required=true;
  field('Data da competência','competence_date','date',state.month+'-01').required=true;
  const purchaseOrder=field('Ordem de compra (quando exigida)','purchase_order');const description=field('Descrição (conforme o perfil)','description','textarea','',true);
  let profileList=[];const showProfile=()=>{const p=profileList.find(p=>p.profile_id===profiles.value);description.disabled=p?.description_policy==='fixed';description.required=p?.description_policy==='free';description.value=p?.description_policy==='fixed'?p.description??'':'';purchaseOrder.required=p?.purchase_order_required===true;};profiles.addEventListener('change',showProfile);
  let generation=0;
  const loadProfiles=async()=>{const current=++generation;profiles.disabled=true;$('editor-save').disabled=true;try{const result=await api(`/v2/companies/${encodeURIComponent(company.value)}/profiles`);if(current!==generation||!$('editor').open)return;profileList=result.data.filter((p,i,all)=>p.status==='active'&&all.findIndex(x=>x.profile_id===p.profile_id)===i);profiles.replaceChildren(new Option('Selecione um perfil',''));profileList.forEach(p=>profiles.add(new Option(p.name??p.legal_name??p.profile_id,p.profile_id)));profiles.disabled=false;$('editor-save').disabled=!profileList.length;showProfile();}catch(e){$('editor-error').textContent=e.message;}};
  company.addEventListener('change',loadProfiles);await loadProfiles();
}
async function openRequest(request){
  let r;try{r=(await api(`/v2/requests/${encodeURIComponent(request.request_id)}`)).data;}catch(e){note(e.message,true);return;}
  const mayApprove=state.meta?.capabilities?.approve&&(r.status==='prepared'||(r.status==='approved'&&!r.active_approval));
  const mayEmit=r.status==='approved'&&r.active_approval&&state.meta?.capabilities?.emit&&state.companies.find(c=>c.company_id===r.company_id)?.readiness?.can_emit;
  openEditor('Conferir solicitação','PRÉVIA',mayEmit?'Emitir nota aprovada':'Aprovar nota',{type:mayEmit?'emit':mayApprove?'approve':'detail',request:r});$('editor-save').hidden=!mayApprove&&!mayEmit;
  const d=r.snapshot?.data??{},a=d.amounts??{},grid=el('div','detail-grid wide');
  [['Empresa',d.company_name??companyName(r.company_id)],['CNPJ emitente',d.establishment?.document],['Tomador',d.profile?.customer?.legal_name],['CNPJ tomador',d.profile?.customer?.document],['Ambiente',d.environment==='production'?'Produção':'Teste'],['Situação',statusNames[r.status]??r.status],['Competência',d.input?.competence],['Data da competência',dateLabel(d.input?.competence_date)],['Serviço',d.profile?.service_code],['Ordem de compra',d.input?.purchase_order],['Valor bruto',money(a.gross_amount_cents)],['IRRF',money(a.irrf_cents)],['PIS',money(a.pis_cents)],['Cofins',money(a.cofins_cents)],['CSLL',money(a.csll_cents)],['Retenções federais',money(a.federal_total_cents)],['ISS destacado',money(a.iss_highlight_cents)],['ISS retido',d.profile?.iss_retained?'Sim':'Não'],['Valor líquido',money(a.net_amount_cents)],['Descrição',d.input?.description]].forEach(([name,value])=>{const item=el('div');item.append(el('small','',name),el('strong','',value??'—'));grid.append(item);});
  const identity=el('details','wide'),summary=el('summary','','Identificação da prévia');identity.append(summary,el('p','subnote',`Solicitação ${r.request_id} · Revisão ${r.revision}`),el('code','snapshot-hash',r.snapshot?.hash));
  $('editor-fields').append(grid,identity);
  if(!state.meta?.capabilities?.emit)$('editor-fields').append(el('p','safe-note wide','A transmissão está indisponível enquanto a configuração fiscal não estiver concluída. Esta prévia não representa nota emitida.'));
  else if(mayApprove)$('editor-fields').append(el('p','safe-note wide','Ao aprovar, você confirma os dados desta prévia. A emissão usará exatamente esta revisão.'));
}
async function saveForm(event){event.preventDefault();if(state.busy||!state.form)return;const data=Object.fromEntries(new FormData($('editor-form'))),form=state.form;setBusy(true);$('editor-error').textContent='';try{
  if(form.type==='calendar'){
    const payload={company_id:form.rule?.company_id??data.company_id,title:data.title,profile_id:data.profile_id===undefined?(form.rule?.profile_id??null):(data.profile_id||null),day_of_month:Number(data.day_of_month),frequency:'monthly',start_date:data.start_date,end_date:data.end_date||null,amount_mode:data.amount_mode,gross_amount_cents:data.amount_mode==='fixed'?parseMoney(data.gross_amount):null,competence_rule:data.competence_rule,missing_day_policy:data.missing_day_policy,notes:data.notes||null,status:data.status};
    if(form.rule)payload.expected_version=form.rule.version;
    await api('/v2/calendar-rules'+(form.rule?'/'+encodeURIComponent(form.rule.rule_id):''),{body:payload,key:state.formKey});
  } else if(form.type==='archive'){
    await api(`/v2/calendar-rules/${encodeURIComponent(form.rule.rule_id)}/archive`,{body:{expected_version:form.rule.version},key:state.formKey});
  } else if(form.type==='client'){
    const scopes=({read:['read'],prepare:['read','simulate','request','calendar'],full:['read','simulate','request','approve','emit','calendar']})[data.access];
    const payload={name:data.name,company_ids:new FormData($('editor-form')).getAll('company_ids'),scopes,expires_at:data.expires_at?`${data.expires_at}T23:59:59.000Z`:null};
    const result=await api('/v2/clients'+(form.client?'/'+encodeURIComponent(form.client.client_id):''),{body:payload,key:state.formKey});$('editor').close();await load();if(!form.client)openSecret(result.data);return;
  } else if(form.type==='revoke'){
    await api(`/v2/clients/${encodeURIComponent(form.client.client_id)}/revoke`,{body:{},key:state.formKey});
  } else if(form.type==='approve'){
    const r=form.request;await api('/v2/approval-batches',{body:{items:[{company_id:r.company_id,request_id:r.request_id,snapshot_id:r.snapshot.snapshot_id,snapshot_hash:r.snapshot.hash}],consent:{mode:'owner_session',text:'Aprovo esta nota conforme a prévia discriminada no aplicativo.'}},key:state.formKey});
  } else if(form.type==='emit'){
    const r=form.request;await api('/v2/operations',{body:{company_id:r.company_id,request_id:r.request_id,approval_batch_id:r.active_approval.batch_id},key:state.formKey});
  } else if(form.type==='prepare'){
    const payload={company_id:data.company_id,profile_id:data.profile_id,gross_amount_cents:parseMoney(data.gross_amount),competence:data.competence,competence_date:data.competence_date};if(data.description?.trim())payload.description=data.description;if(data.purchase_order?.trim())payload.purchase_order=data.purchase_order;
    await api('/v2/requests',{body:payload,key:state.formKey});state.view='requests';
  } else return;
  $('editor').close();await load();setView(state.view);if(form.type==='approve')note('Aprovação registrada');if(form.type==='emit')note('Emissão solicitada. Acompanhe o resultado em Atividade.');
}catch(e){$('editor-error').textContent=e.message;}finally{setBusy(false);}}

$('nav').addEventListener('click',event=>{const b=event.target.closest('button[data-view]');if(b)setView(b.dataset.view);});
$('company-filter').addEventListener('change',()=>{state.company=$('company-filter').value;load();});$('refresh').addEventListener('click',load);$('prepare').addEventListener('click',openPrepare);
$('planning-month').value=state.month;
$('planning-month').addEventListener('change',()=>{if($('planning-month').checkValidity() && /^\d{4}-\d{2}$/.test($('planning-month').value)){state.month=$('planning-month').value;render();}});
$('editor-form').addEventListener('submit',saveForm);$('editor-form').addEventListener('input',()=>{if(!state.busy)state.formKey=crypto.randomUUID();});
for(const id of ['editor-cancel','editor-close'])$(id).addEventListener('click',()=>{if(!state.busy)$('editor').close();});$('editor').addEventListener('cancel',event=>{if(state.busy)event.preventDefault();});
$('editor').addEventListener('close',()=>{if(!$('editor').open&&state.form?.type==='secret'){$('editor-fields').replaceChildren();state.form=null;}});
function observeSession(){const ready=window.HUB_AUTH_READY;if(!ready||ready===state.ready)return;state.ready=ready;ready.then(result=>{if(ready!==state.ready)return;state.valid=result?.status==='valid';if(state.valid){load();}else{state.generation++;clearData();$('prepare').disabled=true;$('company-filter').disabled=true;render();}}).catch(()=>{state.valid=false;clearData();render();});}
if(window.top!==window.self){document.body.replaceChildren(empty('Abra o aplicativo diretamente','A área fiscal não pode ser aberta dentro de outro site.'));}else{observeSession();const watcher=setInterval(observeSession,250);window.addEventListener('pagehide',()=>clearInterval(watcher),{once:true});window.addEventListener('pageshow',event=>{if(event.persisted)location.reload();});}
