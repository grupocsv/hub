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
const statusNames = { prepared:'Preparada', approved:'Aprovada', queued:'Na fila', preparing:'Preparando', ready_to_send:'Pronta para envio', sending:'Enviando', authorized:'Autorizada', rejected:'Rejeitada', unknown:'Aguardando confirmação', reconciling:'Consultando resultado', active:'Ativa', paused:'Pausada', pending_configuration:'Configuração pendente', suspended:'Suspensa', pending:'Pendente', postponed:'Adiada', skipped:'Dispensada', cancelled:'Cancelada', substituted:'Substituída' };
const state = { view:'overview', company:'', month:currentMonth(), valid:false, loading:false, generation:0, meta:null, companies:[], overview:null, requests:[], calendar:[], operations:[], documents:[], events:[], clients:[], occurrences:[], selectedOccurrences:new Set(), selectedRequests:new Set(), requestFilters:{status:'',competence:''}, documentFilters:{status:'',competence:'',issued_from:'',issued_to:'',customer_document:'',access_key:''}, cursors:{}, busy:false, form:null, formKey:null, ready:null };

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined && text !== null) node.textContent = String(text);
  return node;
}
function button(text, className, action) { const b = el('button',className,text); b.type='button'; b.addEventListener('click',event=>{if(!state.busy)action(event);}); return b; }
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
    if(response.status===401){expireSession();throw new Error('Sua sessão expirou. Entre novamente para continuar.');}
    let payload;try{payload=await response.json();}catch{throw new Error('O serviço retornou uma resposta inválida. Tente atualizar.');}
    if(!response.ok) throw new Error(payload.error?.message ?? 'Não foi possível concluir a solicitação.');
    if(!payload || !Object.hasOwn(payload,'data')) throw new Error('A resposta não contém os dados esperados.');
    return payload;
  } catch(error) {
    if(error.name==='NotAllowedError'){expireSession();throw new Error('Sua sessão expirou. Entre novamente para continuar.');}
    if(error.name==='AbortError')throw new Error('O serviço demorou para responder. Atualize para conferir o resultado antes de repetir uma ação.');
    throw error;
  } finally {clearTimeout(timer);}
}
function clearData(){state.meta=null;state.overview=null;state.companies=[];state.requests=[];state.calendar=[];state.operations=[];state.documents=[];state.events=[];state.clients=[];state.occurrences=[];state.selectedOccurrences.clear();state.selectedRequests.clear();state.cursors={};state.form=null;state.formKey=null;$('editor').close();$('editor-fields').replaceChildren();}
function expireSession(){state.valid=false;state.generation++;state.loading=false;clearData();$('prepare').disabled=true;$('company-filter').disabled=true;$('refresh').disabled=true;$('content').setAttribute('aria-busy','false');render();}
async function load() {
  if(!state.valid)return;
  const generation=++state.generation;state.loading=true;note('Atualizando informações…');$('content').setAttribute('aria-busy','true');$('refresh').disabled=true;
  const q=state.company?`?company_id=${encodeURIComponent(state.company)}`:'';
  const names=['meta','companies','overview','requests','calendar','operations','documents','events','clients','occurrences'];
  const paths=['/v2/meta','/v2/companies','/v2/overview'+q,listPath('requests','/v2/requests'),'/v2/calendar-rules'+q,'/v2/operations'+q,listPath('documents','/v2/documents'),'/v2/events'+q,'/v2/clients',listPath('occurrences','/v2/calendar-occurrences')];
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
  const coverageStatus=state.overview?.history_coverage?.status;
  note(coverageStatus==='not_synchronized'?'O histórico oficial ainda não foi sincronizado nesta área. As contagens abaixo representam somente os dados disponíveis aqui.':coverageStatus==='partially_synchronized'?'O histórico está parcialmente sincronizado. Confira a cobertura de cada empresa.':null);
  render();
}
function listPath(kind,path,extra={}){const filters=kind==='requests'?state.requestFilters:kind==='documents'?state.documentFilters:kind==='occurrences'?{month:state.month}:{};const q=new URLSearchParams();if(state.company)q.set('company_id',state.company);for(const [key,value]of Object.entries({...filters,...extra}))if(value)q.set(key,value);return path+(q.size?'?'+q:'');}
function filteredCompanies(){return state.companies.filter(c=>!state.company||c.company_id===state.company);}
function readinessText(c){return c.readiness?.can_emit?'Habilitada para emissão':'Aguardando configuração fiscal';}
function historySummary(company){
  const coverage=state.overview?.history_coverage,history=Array.isArray(coverage?.companies)?coverage.companies.find(item=>item.company_id===company.company_id):null;
  const labels={never_synced:'Ainda não sincronizado',not_synchronized:'Ainda não sincronizado',more_available:'Sincronização parcial — há páginas pendentes',partially_synchronized:'Sincronização parcial',up_to_date:'Sem páginas pendentes na última consulta'};
  const section=el('section');section.setAttribute('aria-label',`Histórico de ${company.name}`);
  section.append(el('p','',labels[history?.status]??'Cobertura não informada'));
  const value=history?.last_success_at??history?.last_synced_at,date=typeof value==='string'?new Date(value):null;
  const stamp=date&&Number.isFinite(date.getTime())?new Intl.DateTimeFormat('pt-BR',{dateStyle:'short',timeStyle:'short',timeZone:'America/Sao_Paulo'}).format(date):'não registrada';
  section.append(el('p','',`Última sincronização: ${stamp}`));
  if(history)section.append(el('p','muted','Consulta ao fluxo disponível do ADN; histórico integral não comprovado.'));
  return section;
}
function companyRow(c){const row=el('div','company-row'),identity=el('div','identity'),text=el('div');text.append(el('h3','',c.name),el('p','',readinessText(c)),historySummary(c));identity.append(el('span','initial',c.name.slice(0,1)),text);row.append(identity,badge(c.status));return row;}
function renderOverview(root){
  const o=state.overview,stats=el('div','stats');
  [['Preparadas',o.counts.prepared,'Prontas para conferência'],['Aprovadas',o.counts.approved,'Com aprovação registrada'],['Em processamento',o.counts.processing,'Aguardando resultado'],['Autorizadas',o.counts.authorized,'Confirmadas nesta base']].forEach(([label,value,help])=>{const s=el('article','stat');s.append(el('span','',label),el('strong','',value),el('small','',help));stats.append(s);});root.append(stats);
  const columns=el('div','columns'),schedule=panel('Calendário de emissões','Planejamento de '+state.month.split('-').reverse().join('/'),{text:'Ver calendário →',run:()=>setView('calendar')}),companies=panel('Suas empresas','Condições de emissão por empresa');
  const occurrences=(state.occurrences.length?state.occurrences.map(o=>({rule:o,item:{date:o.planned_date,competence:o.competence,needsDate:!o.planned_date},status:o.status})):state.calendar.map(rule=>({rule,item:occurrence(rule,state.month)})).filter(x=>x.item)).sort((a,b)=>(a.item.date??'9999').localeCompare(b.item.date??'9999'));
  if(!occurrences.length)schedule.append(empty('Seu calendário começa aqui','Cadastre as emissões recorrentes. Você poderá editar as regras a qualquer momento.',{text:'Configurar calendário',run:()=>openCalendar()}));
  else occurrences.slice(0,5).forEach(({rule,item,status})=>{const row=el('div','schedule-row'),identity=el('div','identity'),text=el('div'),value=el('div','text-end');text.append(el('h3','',rule.title),el('p','',companyName(rule.company_id)));if(status)text.append(badge(status));identity.append(el('div','date-block',item.date?.slice(-2)??'—'),text);value.append(el('strong','amount',rule.amount_mode==='fixed'?money(rule.gross_amount_cents):'Valor a informar'),el('p','',item.needsDate?'Definir data':'Competência '+item.competence));row.append(identity,value);schedule.append(row);});
  filteredCompanies().forEach(c=>companies.append(companyRow(c)));columns.append(schedule,companies);root.append(columns);
  const small=el('p','subnote');small.append(el('span'),document.createTextNode('O calendário organiza a preparação. Cada emissão continua dependendo da sua aprovação.'));root.append(small);
}
function heading(title,description,action){const h=el('div','section-title'),d=el('div');d.append(el('h2','',title));if(description)d.append(el('p','muted',description));h.append(d);if(action)h.append(button(action.text,'primary',action.run));return h;}
function table(headers,rows){const wrap=el('div','panel table-wrap'),t=el('table'),thead=el('thead'),tr=el('tr'),body=el('tbody');headers.forEach(h=>{const th=el('th','',h);th.scope='col';tr.append(th);});thead.append(tr);rows.forEach(cells=>{const row=el('tr');cells.forEach((cell,i)=>{const td=el('td');td.dataset.label=headers[i];td.append(cell instanceof Node?cell:document.createTextNode(String(cell??'—')));row.append(td);});body.append(row);});t.append(thead,body);wrap.append(t);return wrap;}
function selectionBox(set,value,label){const box=el('input');box.type='checkbox';box.checked=set.has(value);box.setAttribute('aria-label',label);box.addEventListener('change',()=>{box.checked?set.add(value):set.delete(value);render();});return box;}
function canChangeOccurrence(o){return ['pending','postponed'].includes(o.status);}
function canPrepareOccurrence(o){return canChangeOccurrence(o)&&Boolean(o.planned_date);}
function renderCalendar(root){
  const current=el('section');current.setAttribute('aria-label','Ocorrências do mês');
  current.append(heading('Ocorrências de '+state.month.split('-').reverse().join('/'),'Planejamento preservado por mês; gerar ocorrências não emite notas.',{text:'Gerar ocorrências do mês',run:generateOccurrences}));
  if(!state.occurrences.length)current.append(empty('Nenhuma ocorrência gerada','Depois de configurar as regras, gere as ocorrências deste mês para preparar e acompanhar cada cobrança.'));
  else{
    const selected=state.occurrences.filter(o=>state.selectedOccurrences.has(o.occurrence_id)&&canPrepareOccurrence(o)),actions=el('div','batch-actions');
    actions.append(el('p','',`${selected.length} ocorrência(s) selecionada(s)`));const prepare=button('Preparar selecionadas','primary',()=>openOccurrenceBatch(selected));prepare.disabled=!selected.length;actions.append(prepare);current.append(actions);
    current.append(table(['Selecionar','Emissão','Empresa','Data prevista','Valor bruto','Situação','Ações'],state.occurrences.map(o=>{
      const name=el('div');name.append(el('strong','',o.title),el('small','',`Competência ${o.competence}`));if(o.reason)name.append(el('small','',o.reason));if(o.rule_changed)name.append(el('small','warning-text','A regra mudou após esta ocorrência.'));
      const options=el('div','row-actions');if(canChangeOccurrence(o)){if(canPrepareOccurrence(o))options.append(button('Preparar','quiet',()=>openOccurrenceBatch([o])));options.append(button(o.planned_date?'Adiar':'Definir data','quiet',()=>openOccurrenceChange(o,'postpone')),button('Dispensar','quiet',()=>openOccurrenceChange(o,'skip')));}else if(o.request_id)options.append(button('Conferir prévia','quiet',()=>openRequest({request_id:o.request_id})));
      return[canPrepareOccurrence(o)?selectionBox(state.selectedOccurrences,o.occurrence_id,`Selecionar ocorrência ${o.title}`):'—',name,companyName(o.company_id),o.planned_date?dateLabel(o.planned_date):'Definir manualmente',o.gross_amount_cents===null?'A informar':money(o.gross_amount_cents),badge(o.status),options];
    })));
  }
  root.append(current);
  root.append(heading('Regras de emissão','Defina datas e valores sem agendar transmissões automáticas.',{text:'Nova regra',run:()=>openCalendar()}));
  if(!state.calendar.length){root.append(el('section','panel'));root.lastChild.append(empty('Nenhuma regra cadastrada','Comece por uma emissão recorrente. Você também poderá preparar notas avulsas.'));return;}
  root.append(table(['Emissão','Empresa','Previsão','Valor bruto','Situação','Ações'],state.calendar.map(rule=>{
    const name=el('div');name.append(el('strong','',rule.title),el('small','',rule.competence_rule==='previous_month'?'Competência do mês anterior':'Competência do mesmo mês'));
    const actions=el('div','row-actions');actions.append(button('Editar','quiet',()=>openCalendar(rule)),button(rule.status==='active'?'Pausar':'Ativar','quiet',()=>toggleRule(rule)),button('Arquivar','quiet',()=>openArchive(rule)));
    return[name,companyName(rule.company_id),`Dia ${rule.day_of_month}`,rule.amount_mode==='fixed'?money(rule.gross_amount_cents):'A informar',badge(rule.status),actions];
  })));pagination(root,'calendar','/v2/calendar-rules');
  root.append(el('p','safe-note','Editar uma regra preserva as ocorrências já preparadas, adiadas ou dispensadas. Cada emissão depende da aprovação da prévia.'));
}
function renderCompanies(root){const grid=el('div','grid-cards');filteredCompanies().forEach(c=>{const card=el('article','panel company-card');card.append(el('div','initial',c.name.slice(0,1)),el('h2','',c.name),badge(c.status));const list=el('ul');(c.readiness?.blockers??[]).forEach(b=>list.append(el('li','',b.message)));card.append(list,historySummary(c));const sync=button('Sincronizar notas','secondary',async()=>{sync.disabled=true;try{await api('/v2/sync',{body:{company_id:c.company_id}});await load();note('Consulta de distribuição concluída. O acervo pode não cobrir todo o histórico anterior.');}catch(e){note(e.message,true);}finally{sync.disabled=false;}});card.append(sync);grid.append(card);});root.append(grid);root.append(el('p','safe-note','Os dados fiscais serão preenchidos a partir das fontes validadas. Os certificados e suas senhas são recebidos por procedimento privado; não os envie aos agentes ou às conversas.'));}
function listFilters(kind){
  const form=el('form','list-filters');form.setAttribute('aria-label',kind==='requests'?'Filtros de solicitações':'Filtros do acervo');const filters=kind==='requests'?state.requestFilters:state.documentFilters;
  const add=(label,name,type,choices)=>{const wrapper=el('label');wrapper.append(document.createTextNode(label));const input=el(choices?'select':'input');input.name=name;input.setAttribute('aria-label',label);if(choices)choices.forEach(([value,text])=>input.add(new Option(text,value)));else input.type=type;input.value=filters[name]??'';wrapper.append(input);form.append(wrapper);return input;};
  add('Situação','status','',[['','Todas'],...(kind==='requests'?[['prepared','Preparadas'],['approved','Aprovadas'],['processing','Em processamento'],['authorized','Autorizadas'],['rejected','Rejeitadas'],['unknown','Aguardando confirmação']]:[['authorized','Autorizadas'],['cancelled','Canceladas'],['substituted','Substituídas']])]);add('Competência do filtro','competence','month');
  if(kind==='documents'){add('Emitida a partir de','issued_from','date');add('Emitida até','issued_to','date');add('CNPJ ou CPF do tomador','customer_document','text');add('Chave de acesso','access_key','text');}
  const apply=button('Aplicar filtros','secondary',()=>form.requestSubmit()),clear=button('Limpar filtros','quiet',()=>{for(const key of Object.keys(filters))filters[key]='';state.selectedRequests.clear();load();});form.append(apply,clear);
  form.addEventListener('submit',event=>{event.preventDefault();const data=Object.fromEntries(new FormData(form));if(kind==='documents'){if(data.issued_from&&data.issued_to&&data.issued_from>data.issued_to){note('A data inicial deve ser anterior ou igual à data final.',true);return;}data.customer_document=data.customer_document.toUpperCase().replace(/[^A-Z0-9]/g,'');data.access_key=data.access_key.trim();if(data.customer_document&&!/^(?:[A-Z0-9]{12}\d{2}|\d{11})$/.test(data.customer_document)||data.access_key&&!/^[A-Z0-9]{50}$/.test(data.access_key)){note('Confira o documento do tomador e a chave de acesso.',true);return;}}Object.assign(filters,data);state.selectedRequests.clear();load();});return form;
}
function mayApproveRequest(r){return state.meta?.capabilities?.approve&&(r.status==='prepared'||r.status==='approved'&&!r.active_approval);}
function renderRequests(root){
  const section=el('section');section.setAttribute('aria-label','Solicitações');section.append(heading('Solicitações','Prepare e confira cada nota antes de autorizar a emissão.'),listFilters('requests'));
  const selected=state.requests.filter(r=>state.selectedRequests.has(r.request_id)&&mayApproveRequest(r));const actions=el('div','batch-actions');actions.append(el('p','',`${selected.length} prévia(s) selecionada(s)`));const approve=button('Aprovar selecionadas','primary',()=>openApprovalBatch(selected));approve.disabled=!selected.length;actions.append(approve);section.append(actions);
  if(!state.requests.length)section.append(empty('Nenhuma solicitação neste filtro','Ajuste os filtros ou prepare notas pelo calendário e pelo botão Preparar nota.'));
  else section.append(table(['Selecionar','Nota','Empresa','Competência','Valor bruto','Valor líquido','Situação','Detalhes'],state.requests.map(r=>{const d=r.snapshot?.data??{},a=d.amounts??{};return[mayApproveRequest(r)?selectionBox(state.selectedRequests,r.request_id,`Selecionar prévia ${r.request_id}`):'—',d.profile?.name??d.profile?.profile_id??r.request_id.slice(0,8),companyName(r.company_id),d.input?.competence??'—',money(a.gross_amount_cents),money(a.net_amount_cents),badge(r.status),button('Conferir','quiet',()=>openRequest(r))];})));pagination(section,'requests','/v2/requests');root.append(section);
  const archive=el('section');archive.setAttribute('aria-label','Acervo de notas');archive.append(heading('Acervo de notas','Documentos oficiais preservados e eventos acompanhados.',{text:'Importar XMLs',run:openImport}),listFilters('documents'));
  if(!state.documents.length)archive.append(empty('Nenhuma nota neste filtro','Ajuste os filtros ou sincronize o acervo da empresa.'));
  else archive.append(table(['Chave de acesso','Empresa','Competência','Valor bruto','Valor líquido','Situação','Arquivos'],state.documents.map(d=>[d.access_key,companyName(d.company_id),dateLabel(d.competence),money(d.gross_amount_cents),money(d.net_amount_cents),badge(d.status),button('Abrir nota','quiet',()=>openDocument(d))])));pagination(archive,'documents','/v2/documents');root.append(archive);
}
function operationStatus(operation){
  const cell=el('div');cell.append(badge(operation.status));
  const warnings=operation.result?.reconciliation_warnings;
  if(Array.isArray(warnings)&&warnings.length){
    cell.append(el('p','safe-note','Os dados oficiais diferem da prévia aprovada.'));
    const detail=el('details'),labels={gross_amount_cents:'Valor bruto',net_amount_cents:'Valor líquido',competence_date:'Data da competência',customer_document:'Documento do tomador',description:'Descrição'};
    detail.append(el('summary','','Conferir diferenças'));
    for(const warning of warnings){const field=warning?.field;if(!Object.hasOwn(labels,field))continue;const format=value=>field.endsWith('_cents')?money(value):field==='competence_date'?dateLabel(value):String(value??'Não informado');const row=el('div');row.append(el('strong','',labels[field]),el('p','',`Aprovado: ${format(warning.approved)} · Oficial: ${format(warning.official)}`));detail.append(row);}
    cell.append(detail);
  }
  return cell;
}
function renderActivity(root){root.append(heading('Operações','Resultados confirmados e consultas em andamento.'));if(!state.operations.length)root.append(empty('Nenhuma operação registrada','As operações aparecerão aqui quando uma emissão for solicitada.'));else root.append(table(['Operação','Empresa','Situação','Registro'],state.operations.map(o=>[o.operation_id,companyName(o.company_id),operationStatus(o),dateLabel(o.created_at)])));pagination(root,'operations','/v2/operations');
  if(state.events.length){const names={prepared:'Prévia preparada',approved:'Aprovação registrada',calendar_created:'Regra criada',calendar_updated:'Regra atualizada',calendar_archived:'Regra arquivada',operation_queued:'Emissão solicitada',queued:'Emissão solicitada',occurrence_postponed:'Ocorrência adiada',occurrence_skipped:'Ocorrência dispensada',occurrence_prepared:'Ocorrência preparada',document_registered:'Nota registrada',archive_imported:'Acervo importado',pdf_generated:'PDF gerado',authorized:'Nota autorizada',rejected:'Nota rejeitada',unknown:'Resultado aguardando consulta'};root.append(heading('Histórico de atividade','Alterações registradas pela plataforma.'),table(['Evento','Empresa','Registro'],state.events.map(e=>[names[e.event_type]??e.event_type,companyName(e.company_id),dateLabel(e.created_at)])));pagination(root,'events','/v2/events');}}
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
function pagination(root,key,path){if(!state.cursors[key])return;const div=el('div','pagination');div.append(button('Carregar mais','secondary',async event=>{event.currentTarget.disabled=true;try{const generation=state.generation;const next=await api(listPath(key,path,{cursor:state.cursors[key]}));if(generation!==state.generation)return;state[key].push(...next.data);state.cursors[key]=next.meta?.next_cursor??null;render();}catch(e){note(e.message,true);event.currentTarget.disabled=false;}}));root.append(div);}
function field(label,name,type='text',value='',wide=false){const l=el('label',wide?'wide':'');l.append(document.createTextNode(label));const input=el(type==='textarea'?'textarea':'input');input.name=name;if(type!=='textarea')input.type=type;input.value=value??'';l.append(input);$('editor-fields').append(l);return input;}
function selectField(label,name,options,value,wide=false){const l=el('label',wide?'wide':'');l.append(document.createTextNode(label));const input=el('select');input.name=name;input.setAttribute('aria-label',label);options.forEach(([v,t])=>input.add(new Option(t,v)));input.value=value??'';l.append(input);$('editor-fields').append(l);return input;}
function displayMoneyInput(cents){return Number.isSafeInteger(cents)?`${Math.floor(cents/100)},${String(cents%100).padStart(2,'0')}`:'';}
function openEditor(title,kind,save,form){state.form=form;state.formKey=crypto.randomUUID();$('editor-title').textContent=title;$('editor-kind').textContent=kind;$('editor-save').textContent=save;$('editor-save').hidden=false;$('editor-save').disabled=false;$('editor-error').textContent='';$('editor-fields').replaceChildren();$('editor').showModal();}
function closeEditor(){const secret=state.form?.type==='secret';$('editor').close();if(secret){$('editor-fields').replaceChildren();state.form=null;state.formKey=null;}}
function setBusy(busy){state.busy=busy;$('editor-fields').inert=busy;for(const id of ['editor-save','editor-cancel','editor-close'])$(id).disabled=busy;}
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
  const generation=state.generation;let d;try{d=(await api(`/v2/documents/${encodeURIComponent(document.document_id)}`)).data;}catch(e){note(e.message,true);return;}
  if(!state.valid||generation!==state.generation)return;
  const form={type:'document',document:d};openEditor('Nota fiscal preservada','ACERVO','Fechar',form);$('editor-save').hidden=true;
  const grid=el('div','detail-grid wide');[['Empresa',companyName(d.company_id)],['Situação',({authorized:'Autorizada',cancelled:'Cancelada',substituted:'Substituída'})[d.status]??d.status],['Emitente',d.issuer_document],['Tomador',d.customer_document??'Não identificado'],['Emissão',dateLabel(d.issued_at)],['Competência',dateLabel(d.competence)],['Valor bruto',money(d.gross_amount_cents)],['Valor líquido',money(d.net_amount_cents)],['Chave',d.access_key],['Origem',({platform:'Plataforma',adn:'Distribuição nacional',import:'Importação'})[d.source]??d.source]].forEach(([name,value])=>{const item=el('div');item.append(el('small','',name),el('strong','',value));grid.append(item);});$('editor-fields').append(grid);
  appendTimeline($('editor-fields'),d.timeline);
  const files=el('div','wide row-actions');for(const artifact of d.artifacts??[])files.append(button(`Baixar ${artifact.kind.toUpperCase()}`,'secondary',event=>downloadDocument(d,artifact.kind,event.currentTarget)));if(d.artifacts?.some(a=>a.kind==='xml'))files.append(button('Gerar nova versão do PDF','secondary',()=>openPdfRegeneration(d)));$('editor-fields').append(files);
  const versions=el('section','wide');versions.append(el('h3','','Versões do PDF'));$('editor-fields').append(versions);
  try{const result=await api(`/v2/documents/${encodeURIComponent(d.document_id)}/versions`);if(state.form!==form)return;const list=result.data.versions??[];if(!list.length)versions.append(el('p','muted','Nenhuma versão de PDF disponível. O XML é o documento fiscal preservado.'));else for(const version of list){const item=el('div','version-row'),text=el('div');text.append(el('strong','',version.version===0?'PDF original':`PDF v${version.version}`),el('small','',`${dateLabel(version.created_at)} · ${version.renderer_version??'Versão preservada'}`));if(version.reason)text.append(el('p','',version.reason));item.append(text,button(version.version===0?'Baixar PDF original':`Baixar PDF v${version.version}`,'quiet',event=>downloadDocument(d,'pdf',event.currentTarget,version.version)));versions.append(item);}}
  catch(error){if(state.form===form)versions.append(el('p','warning-text',error.message));}
}
function openPdfRegeneration(document){openEditor('Gerar versão do PDF','ARQUIVO DE APRESENTAÇÃO','Gerar PDF',{type:'regenerate_pdf',document});$('editor-fields').append(el('p','wide',`A nova versão usa o XML preservado da nota ${document.access_key}. As versões anteriores continuam disponíveis.`));field('Motivo (opcional)','reason','textarea','',true).maxLength=200;}
async function downloadDocument(doc,kind,button,version){const generation=state.generation;button.disabled=true;try{
  const response=await window.HUB_AUTH_API.fetch(`${API}/v2/documents/${encodeURIComponent(doc.document_id)}/${kind}${version===undefined?'':`?version=${version}`}`);
  if(response.status===401){expireSession();throw new Error('Sua sessão expirou. Entre novamente para continuar.');}
  if(!response.ok){const body=await response.json();throw new Error(body.error?.message??'Não foi possível obter o arquivo.');}
  const blob=await response.blob();if(!state.valid||generation!==state.generation)return;const url=URL.createObjectURL(blob),link=el('a');link.href=url;link.download=`NFSe-${doc.access_key}${version===undefined?'':`-v${version}`}.${kind}`;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}catch(e){if(e.name==='NotAllowedError')expireSession();if(state.valid)$('editor-error').textContent=e.message;else note('Sua sessão expirou. Entre novamente para continuar.',true);}finally{button.disabled=false;}}
function openImport(){
 openEditor('Importar acervo','CONFERÊNCIA DE ARQUIVOS','Conferir arquivos',{type:'import_source'});
 selectField('Empresa dos documentos','company_id',state.companies.map(c=>[c.company_id,c.name]),state.company||state.companies[0]?.company_id,true);
 const files=field('Arquivos XML','xml_files','file','',true);files.accept='.xml,application/xml,text/xml';files.multiple=true;
 const legacy=field('JSON legado (opcional)','legacy_file','file','',true);legacy.accept='.json,application/json';
 $('editor-fields').append(el('p','safe-note wide','Selecione até 20 XMLs (2 MiB no total). O JSON opcional contém apenas o histórico exportado: solicitações, aprovações, operações e documentos. Não inclua certificados, senhas ou credenciais. O lote completo deve ter até 3 MiB.'),el('p','safe-note wide','A conferência não grava documentos. Você verá os resultados por arquivo antes de confirmar a importação.'));
}
async function previewImport(form){
 const files=[...$('editor-form').elements.xml_files.files],legacyFile=$('editor-form').elements.legacy_file.files[0];
 if(files.length>20||files.reduce((total,file)=>total+file.size,0)>2*1024*1024)throw new Error('Selecione até 20 XMLs, com no máximo 2 MiB no total.');
 if(!files.length&&!legacyFile)throw new Error('Selecione ao menos um XML ou um JSON legado.');
 if(legacyFile?.size>3*1024*1024)throw new Error('O JSON legado excede 3 MiB.');
 const names=new Map(),payload={company_id:$('editor-form').elements.company_id.value,sources:[]};
 for(const file of files){const source_id=crypto.randomUUID();payload.sources.push({source_id,xml:await file.text()});names.set(source_id,file.name);}
 if(legacyFile){let legacy;try{legacy=JSON.parse(await legacyFile.text());}catch{throw new Error('O arquivo legado não contém JSON válido.');}if(!legacy||typeof legacy!=='object'||Array.isArray(legacy))throw new Error('O histórico legado deve ser um objeto JSON com as tabelas exportadas.');payload.legacy=legacy;}
 if(new TextEncoder().encode(JSON.stringify(payload)).byteLength>3*1024*1024)throw new Error('O lote completo excede 3 MiB. Divida os arquivos.');
 const result=await api('/v2/imports/preview',{body:payload,key:state.formKey});if(state.form!==form)return;showImportPreview(payload,names,result.data);
}
function showImportPreview(payload,names,preview){
 const form={type:'import_commit',payload,names,preview};openEditor('Conferir importação','ACERVO HISTÓRICO','Confirmar importação',form);$('editor-save').disabled=!preview.can_commit;
 $('editor-fields').append(el('p','wide',`${companyName(payload.company_id)} · ${preview.environment==='production'?'Produção':preview.environment==='test'?'Teste':'Ambiente da plataforma'}`));
 const labels={new:'Novo documento',duplicate:'Já preservado',invalid:'Inválido',conflict:'Conteúdo em conflito'},errors={adn_issuer_mismatch:'O emitente do XML difere da empresa selecionada.',adn_environment_mismatch:'O ambiente do XML difere do ambiente da plataforma.',adn_document_too_large:'O XML excede o tamanho permitido.',adn_unsafe_xml:'O XML contém uma estrutura não permitida.',adn_missing_element:'O XML não contém todos os campos obrigatórios.',adn_invalid_xml:'Não foi possível interpretar este XML.'};
 $('editor-fields').append(table(['Arquivo','Conferência','Nota','Valor bruto'],(preview.items??[]).map(item=>{const status=el('div');status.append(el('strong','',labels[item.status]??item.status));if(item.error)status.append(el('p','warning-text',errors[item.error.code]??`XML inválido ou incompatível com a empresa/ambiente selecionados (${item.error.code??'invalid_xml'}).`));return[names.get(item.source_id)??item.source_id,status,item.document?.access_key??'—',item.document?money(item.document.gross_amount_cents):'—'];})));$('editor-fields').lastChild.classList.add('wide');
 const summary=preview.summary??{};$('editor-fields').append(el('p','wide',`${summary.new??0} novo(s) · ${summary.duplicate??0} já preservado(s) · ${summary.invalid??0} inválido(s) · ${summary.conflict??0} conflito(s)`));
 const legacy=preview.legacy;if(legacy?.records)$('editor-fields').append(el('p','wide',`${legacy.records} registro(s) históricos. As aprovações importadas ficam como evidência e não autorizam novas emissões.`));if(legacy?.documents_without_xml?.length)$('editor-fields').append(el('p','warning-text wide',`${legacy.documents_without_xml.length} documento(s) do legado sem XML vinculado.`));if(legacy?.conflicts?.length)$('editor-fields').append(el('p','warning-text wide','Há registros do legado com conteúdo diferente do histórico já preservado.'));
 $('editor-fields').append(el('p','safe-note wide',preview.can_commit?'Ao confirmar, estes arquivos serão preservados no acervo. Nenhuma nota será emitida.':'Corrija os arquivos indicados e faça uma nova conferência antes de importar.'),button('Escolher outros arquivos','secondary',openImport));
}
async function commitImport(form){
 if(!form.preview.can_commit)throw new Error('A conferência contém erros que impedem importar.');
 const result=await api('/v2/imports/commit',{body:{...form.payload,preview_hash:form.preview.preview_hash},key:state.formKey});
 if(result.data.status!=='complete'){throw new Error('A importação está parcial. Confirme novamente o mesmo lote para retomar os itens pendentes.');}
 closeEditor();await load();if(!state.valid)return;
 openEditor('Importação concluída','ACERVO HISTÓRICO','Fechar',{type:'import_result'});$('editor-save').hidden=true;
 $('editor-fields').append(el('p','wide',`Lote ${result.data.batch_id}`),el('p','safe-note wide','Os documentos e registros históricos foram preservados. Nenhuma aprovação importada autoriza uma nova emissão.'),table(['Arquivo','Resultado','Chave'],(result.data.items??[]).map(item=>[form.names.get(item.source_id)??item.source_id,item.status==='duplicate'?'Já preservado':'Importado',item.access_key??'—'])));$('editor-fields').lastChild.classList.add('wide');
}
async function generateOccurrences(){if(state.busy)return;state.busy=true;try{await api('/v2/calendar-occurrences/generate',{body:{month:state.month,...(state.company?{company_id:state.company}:{})}});await load();note('Ocorrências do mês atualizadas. Nenhuma nota foi emitida.');}catch(error){note(error.message,true);}finally{state.busy=false;}}
function openOccurrenceChange(occurrence,action){openEditor(action==='postpone'?'Adiar ocorrência':'Dispensar ocorrência','CALENDÁRIO',action==='postpone'?'Salvar adiamento':'Dispensar ocorrência',{type:'occurrence_change',occurrence,action});$('editor-fields').append(el('p','wide',`${occurrence.title} · ${companyName(occurrence.company_id)} · Competência ${occurrence.competence}`));if(action==='postpone'){const date=field('Nova data prevista','date','date',occurrence.planned_date??'',true);date.required=true;if(occurrence.planned_date)date.min=occurrence.planned_date;}const reason=field('Motivo','reason','textarea','',true);reason.required=true;reason.minLength=3;reason.maxLength=500;$('editor-fields').append(el('p','safe-note wide',action==='postpone'?'A competência permanece a mesma. A data fiscal será escolhida na preparação.':'A dispensa vale para esta ocorrência e preserva a regra dos próximos meses.'));}
function nestedField(container,label,name,type='text',value=''){const input=field(label,name,type,value,true);container.append(input.parentElement);return input;}
function nestedSelect(container,label,name,options,value){const input=selectField(label,name,options,value,true);container.append(input.parentElement);return input;}
async function openOccurrenceBatch(occurrences){
 if(!occurrences.length||occurrences.length>20){note('Selecione de uma a vinte ocorrências para preparar.',true);return;}
 const form={type:'occurrence_batch',rows:[],prepared:new Map()};openEditor('Preparar ocorrências','LOTE DISCRIMINADO',`Preparar ${occurrences.length} ${occurrences.length===1?'prévia':'prévias'}`,form);$('editor-save').disabled=true;$('editor-fields').append(el('p','safe-note wide','Informe a data fiscal de cada nota. Preparar o lote cria prévias; a aprovação será feita depois da conferência.'));
 for(const occurrence of occurrences){const group=el('fieldset','wide batch-item');group.append(el('legend','',`${occurrence.title} · ${companyName(occurrence.company_id)}`));$('editor-fields').append(group);const row={occurrence,client_item_id:crypto.randomUUID(),group,prepared:false,profiles:[]};
 row.profile=nestedSelect(group,`Perfil — ${occurrence.title}`,`profile_${row.client_item_id}`,[['','Carregando perfis…']],'');row.profile.required=true;
 row.amount=nestedField(group,`Valor bruto — ${occurrence.title}`,`amount_${row.client_item_id}`,'text',displayMoneyInput(occurrence.gross_amount_cents));row.amount.required=true;row.amount.inputMode='decimal';
 row.date=nestedField(group,`Data da competência — ${occurrence.title}`,`date_${row.client_item_id}`,'date','');row.date.required=true;row.date.min=occurrence.competence+'-01';const [year,month]=occurrence.competence.split('-').map(Number);row.date.max=occurrence.competence+'-'+new Date(Date.UTC(year,month,0)).getUTCDate();
 row.order=nestedField(group,`Ordem de compra — ${occurrence.title}`,`order_${row.client_item_id}`);row.description=nestedField(group,`Descrição — ${occurrence.title}`,`description_${row.client_item_id}`,'textarea','');row.result=el('p','batch-result');group.append(row.result);form.rows.push(row);
 row.showProfile=()=>{const p=row.profiles.find(p=>p.profile_id===row.profile.value);row.description.disabled=p?.description_policy==='fixed';row.description.required=p?.description_policy==='free';row.description.value=p?.description_policy==='fixed'?p.description??'':'';row.order.required=p?.purchase_order_required===true;};row.profile.addEventListener('change',row.showProfile);}
 const results=await Promise.allSettled(form.rows.map(async row=>{const response=await api(`/v2/companies/${encodeURIComponent(row.occurrence.company_id)}/profiles`);if(state.form!==form)return;const seen=new Set();row.profiles=response.data.filter(p=>p.status==='active'&&!seen.has(p.profile_id)&&seen.add(p.profile_id));row.profile.replaceChildren(new Option('Selecione um perfil',''));row.profiles.forEach(p=>row.profile.add(new Option(p.name??p.profile_id,p.profile_id)));row.profile.value=row.occurrence.profile_id??'';row.showProfile();}));
 if(state.form!==form||!$('editor').open)return;const failure=results.find(r=>r.status==='rejected');if(failure){$('editor-error').textContent=failure.reason.message;return;}$('editor-save').disabled=false;
}
async function saveOccurrenceBatch(form){
 const pending=form.rows.filter(row=>!row.prepared),items=pending.map(row=>{const item={client_item_id:row.client_item_id,occurrence_id:row.occurrence.occurrence_id,expected_version:row.occurrence.version,competence_date:row.date.value,profile_id:row.profile.value,gross_amount_cents:parseMoney(row.amount.value)};if(!row.description.disabled&&row.description.value.trim())item.description=row.description.value;if(row.order.value.trim())item.purchase_order=row.order.value;return item;});
 const response=await api('/v2/request-batches/prepare',{body:{items},key:state.formKey}),results=response.data?.items;if(!Array.isArray(results)||results.length!==items.length||results.some(result=>!items.some(item=>item.client_item_id===result.client_item_id)||!['prepared','error'].includes(result.status)))throw new Error('O lote retornou um resultado incompleto. Consulte as solicitações antes de repetir.');
 for(const result of results){const row=form.rows.find(row=>row.client_item_id===result.client_item_id);if(result.status==='prepared'){row.prepared=true;form.prepared.set(result.request.request_id,result.request);state.selectedOccurrences.delete(row.occurrence.occurrence_id);row.result.textContent='Prévia preparada';row.result.className='batch-result success-text';row.group.querySelectorAll('input,select,textarea').forEach(input=>input.disabled=true);}else{row.result.textContent=result.error?.message??'Não foi possível preparar esta ocorrência.';row.result.className='batch-result warning-text';}}
 if(form.rows.every(row=>row.prepared)){const count=form.prepared.size;state.selectedRequests=new Set(form.prepared.keys());state.view='requests';closeEditor();await load();setView('requests');note(`${count} ${count===1?'prévia preparada':'prévias preparadas'}. Confira os dados antes de aprovar.`);}else{$('editor-error').textContent=`${form.prepared.size} prévia(s) preparada(s). Corrija os itens pendentes; os sucessos não serão repetidos.`;$('editor-save').textContent='Preparar pendentes';state.formKey=crypto.randomUUID();}
}
function appendTimeline(container,events){
 const section=el('section','wide timeline');section.append(el('h3','','Linha do tempo'));if(!Array.isArray(events)){section.append(el('p','muted','Histórico detalhado ainda indisponível.'));container.append(section);return;}
 const labels={prepared:'Prévia preparada',revised:'Prévia revisada',request_revised:'Prévia revisada',approved:'Aprovação registrada',operation_queued:'Emissão solicitada',queued:'Emissão solicitada',occurrence_postponed:'Ocorrência adiada',occurrence_skipped:'Ocorrência dispensada',occurrence_prepared:'Ocorrência preparada',document_registered:'Nota registrada',archive_imported:'Acervo importado',pdf_generated:'PDF gerado',authorized:'Nota autorizada',cancelled:'Cancelamento registrado',substituted:'Substituição registrada',imported:'Documento importado',document_imported:'Documento importado',pdf_regenerated:'PDF atualizado'};
 if(!events.length)section.append(el('p','muted','Nenhum evento disponível nesta consulta.'));else{const list=el('ol');for(const event of events){const item=el('li'),type=event.event_type??event.effect??event.type;item.append(el('strong','',labels[type]??event.title??'Evento registrado'));const stamp=event.created_at??event.processed_at??event.occurred_at;if(stamp){const date=new Date(stamp);item.append(el('small','',Number.isFinite(date.getTime())?new Intl.DateTimeFormat('pt-BR',{dateStyle:'short',timeStyle:'short',timeZone:'America/Sao_Paulo'}).format(date):'Data não informada'));}if(event.message)item.append(el('p','',event.message));list.append(item);}section.append(list);}container.append(section);
}
async function openApprovalBatch(requests){
 const generation=state.generation;
 if(!requests.length||requests.length>20){note('Selecione de uma a vinte prévias para aprovar.',true);return;}let current;try{current=await Promise.all(requests.map(async r=>(await api(`/v2/requests/${encodeURIComponent(r.request_id)}`)).data));}catch(error){note(error.message,true);return;}if(!state.valid||generation!==state.generation)return;if(!current.every(mayApproveRequest)){await load();note('Uma prévia mudou de situação. Atualize e selecione novamente.',true);return;}
 openEditor('Conferir lote de aprovação','APROVAÇÃO DISCRIMINADA',`Aprovar ${current.length} ${current.length===1?'nota':'notas'}`,{type:'approve_batch',requests:current});
 for(const request of current){const data=request.snapshot.data,amounts=data.amounts,group=el('fieldset','wide batch-item');group.append(el('legend','',data.company_name??companyName(request.company_id)),el('strong','',data.profile.customer.legal_name));group.append(el('p','',`CNPJ emitente: ${data.establishment.document} · Tomador: ${data.profile.customer.document}`),el('p','',`Competência: ${data.input.competence} · Data: ${dateLabel(data.input.competence_date)}`),el('p','',`Bruto: ${money(amounts.gross_amount_cents)} · Líquido: ${money(amounts.net_amount_cents)}`));const detail=el('details');detail.append(el('summary','','Tributos, descrição e revisão'),el('p','',`IRRF: ${money(amounts.irrf_cents)} · PIS: ${money(amounts.pis_cents)} · Cofins: ${money(amounts.cofins_cents)} · CSLL: ${money(amounts.csll_cents)} · ISS: ${money(amounts.iss_highlight_cents)}`),el('p','',data.input.description??''),el('p','',`Revisão ${request.revision} · ${request.snapshot.hash}`));group.append(detail);$('editor-fields').append(group);}
 const total=current.reduce((sum,r)=>sum+r.snapshot.data.amounts.gross_amount_cents,0);$('editor-fields').append(el('p','safe-note wide',`Total bruto: ${money(total)}. Ao aprovar, você autoriza apenas estas prévias e revisões. A transmissão é uma ação separada.`));
}

async function openPrepare(argument){
  const revision=argument?.request_id?argument:null;
  const companies=state.companies.filter(c=>c.readiness?.can_simulate);
  if(!companies.length){setView('companies');return;}
  openEditor(revision?'Revisar prévia':'Preparar uma nota',revision?'NOVA REVISÃO':'NOVA SOLICITAÇÃO',revision?'Salvar nova revisão':'Preparar prévia',{type:revision?'revise':'prepare',request:revision});
  const original=revision?.snapshot?.data?.input;
  const company=selectField('Empresa','company_id',companies.map(c=>[c.company_id,c.name]),revision?.company_id??(state.company||companies[0].company_id));company.disabled=Boolean(revision);
  const profiles=selectField('Perfil de serviço e tomador','profile_id',[['','Carregando perfis…']],'');profiles.required=true;
  field('Valor bruto (R$)','gross_amount','text',displayMoneyInput(original?.gross_amount_cents)).required=true;
  field('Competência','competence','month',original?.competence??state.month).required=true;
  field('Data da competência','competence_date','date',original?.competence_date??'').required=true;
  const purchaseOrder=field('Ordem de compra (quando exigida)','purchase_order','text',original?.purchase_order??'');const description=field('Descrição (conforme o perfil)','description','textarea','',true);
  let profileList=[];const showProfile=()=>{const p=profileList.find(p=>p.profile_id===profiles.value);description.disabled=p?.description_policy==='fixed';description.required=p?.description_policy==='free';description.value=p?.description_policy==='fixed'?p.description??'':'';purchaseOrder.required=p?.purchase_order_required===true;};profiles.addEventListener('change',showProfile);
  let generation=0;
  const loadProfiles=async()=>{const current=++generation;profiles.disabled=true;$('editor-save').disabled=true;try{const result=await api(`/v2/companies/${encodeURIComponent(company.value)}/profiles`);if(current!==generation||!$('editor').open)return;profileList=result.data.filter((p,i,all)=>p.status==='active'&&all.findIndex(x=>x.profile_id===p.profile_id)===i);profiles.replaceChildren(new Option('Selecione um perfil',''));profileList.forEach(p=>profiles.add(new Option(p.name??p.legal_name??p.profile_id,p.profile_id)));profiles.value=original?.profile_id??'';profiles.disabled=false;$('editor-save').disabled=!profileList.length;showProfile();if(original&&original.profile_id===profiles.value&&!description.disabled)description.value=original.description??'';}catch(e){$('editor-error').textContent=e.message;}};
  company.addEventListener('change',loadProfiles);await loadProfiles();
}
async function openRequest(request){
  const generation=state.generation;let r;try{r=(await api(`/v2/requests/${encodeURIComponent(request.request_id)}`)).data;}catch(e){note(e.message,true);return;}
  if(!state.valid||generation!==state.generation)return;
  const mayApprove=state.meta?.capabilities?.approve&&(r.status==='prepared'||(r.status==='approved'&&!r.active_approval));
  const mayEmit=r.status==='approved'&&r.active_approval&&state.meta?.capabilities?.emit&&state.companies.find(c=>c.company_id===r.company_id)?.readiness?.can_emit;
  openEditor('Conferir solicitação','PRÉVIA',mayEmit?'Emitir nota aprovada':'Aprovar nota',{type:mayEmit?'emit':mayApprove?'approve':'detail',request:r});$('editor-save').hidden=!mayApprove&&!mayEmit;
  const d=r.snapshot?.data??{},a=d.amounts??{},grid=el('div','detail-grid wide');
  [['Empresa',d.company_name??companyName(r.company_id)],['CNPJ emitente',d.establishment?.document],['Tomador',d.profile?.customer?.legal_name],['CNPJ tomador',d.profile?.customer?.document],['Ambiente',d.environment==='production'?'Produção':'Teste'],['Situação',statusNames[r.status]??r.status],['Competência',d.input?.competence],['Data da competência',dateLabel(d.input?.competence_date)],['Serviço',d.profile?.service_code],['Ordem de compra',d.input?.purchase_order],['Valor bruto',money(a.gross_amount_cents)],['IRRF',money(a.irrf_cents)],['PIS',money(a.pis_cents)],['Cofins',money(a.cofins_cents)],['CSLL',money(a.csll_cents)],['Retenções federais',money(a.federal_total_cents)],['ISS destacado',money(a.iss_highlight_cents)],['ISS retido',d.profile?.iss_retained?'Sim':'Não'],['Valor líquido',money(a.net_amount_cents)],['Descrição',d.input?.description]].forEach(([name,value])=>{const item=el('div');item.append(el('small','',name),el('strong','',value??'—'));grid.append(item);});
  const identity=el('details','wide'),summary=el('summary','','Identificação da prévia');identity.append(summary,el('p','subnote',`Solicitação ${r.request_id} · Revisão ${r.revision}`),el('code','snapshot-hash',r.snapshot?.hash));
  $('editor-fields').append(grid,identity);
  if(['prepared','approved'].includes(r.status))$('editor-fields').append(button('Revisar prévia','secondary',()=>openPrepare(r)));
  for(const warning of r.business_warnings??[])$('editor-fields').append(el('p','safe-note wide',warning.message));
  appendTimeline($('editor-fields'),r.timeline);
  if(!state.meta?.capabilities?.emit)$('editor-fields').append(el('p','safe-note wide','A transmissão está indisponível enquanto a configuração fiscal não estiver concluída. Esta prévia não representa nota emitida.'));
  else if(mayApprove)$('editor-fields').append(el('p','safe-note wide','Ao aprovar, você confirma os dados desta prévia. A emissão usará exatamente esta revisão.'));
}
async function saveForm(event){event.preventDefault();if(state.busy||!state.form)return;const data=Object.fromEntries(new FormData($('editor-form'))),form=state.form;setBusy(true);$('editor-error').textContent='';try{
  if(form.type==='import_source'){await previewImport(form);return;}
  if(form.type==='import_commit'){await commitImport(form);return;}
  if(form.type==='regenerate_pdf'){await api(`/v2/documents/${encodeURIComponent(form.document.document_id)}/regenerate-pdf`,{body:data.reason?.trim()?{reason:data.reason}:{},key:state.formKey});await openDocument(form.document);return;}
  if(form.type==='occurrence_batch'){await saveOccurrenceBatch(form);return;}
  if(form.type==='occurrence_change'){const payload={expected_version:form.occurrence.version,reason:data.reason,...(form.action==='postpone'?{date:data.date}:{})};await api(`/v2/calendar-occurrences/${encodeURIComponent(form.occurrence.occurrence_id)}/${form.action}`,{body:payload,key:state.formKey});state.selectedOccurrences.delete(form.occurrence.occurrence_id);
  } else if(form.type==='approve_batch'){await api('/v2/approval-batches',{body:{items:form.requests.map(r=>({company_id:r.company_id,request_id:r.request_id,snapshot_id:r.snapshot.snapshot_id,snapshot_hash:r.snapshot.hash})),consent:{mode:'owner_session',text:`Aprovo as ${form.requests.length} notas e revisões discriminadas no aplicativo.`}},key:state.formKey});state.selectedRequests.clear();
  } else if(form.type==='calendar'){
    const payload={company_id:form.rule?.company_id??data.company_id,title:data.title,profile_id:data.profile_id===undefined?(form.rule?.profile_id??null):(data.profile_id||null),day_of_month:Number(data.day_of_month),frequency:'monthly',start_date:data.start_date,end_date:data.end_date||null,amount_mode:data.amount_mode,gross_amount_cents:data.amount_mode==='fixed'?parseMoney(data.gross_amount):null,competence_rule:data.competence_rule,missing_day_policy:data.missing_day_policy,notes:data.notes||null,status:data.status};
    if(form.rule)payload.expected_version=form.rule.version;
    await api('/v2/calendar-rules'+(form.rule?'/'+encodeURIComponent(form.rule.rule_id):''),{body:payload,key:state.formKey});
  } else if(form.type==='archive'){
    await api(`/v2/calendar-rules/${encodeURIComponent(form.rule.rule_id)}/archive`,{body:{expected_version:form.rule.version},key:state.formKey});
  } else if(form.type==='client'){
    const scopes=({read:['read'],prepare:['read','simulate','request','calendar'],full:['read','simulate','request','approve','emit','calendar']})[data.access];
    const payload={name:data.name,company_ids:new FormData($('editor-form')).getAll('company_ids'),scopes,expires_at:data.expires_at?`${data.expires_at}T23:59:59.000Z`:null};
    const result=await api('/v2/clients'+(form.client?'/'+encodeURIComponent(form.client.client_id):''),{body:payload,key:state.formKey});$('editor').close();await load();if(!form.client&&state.valid)openSecret(result.data);return;
  } else if(form.type==='revoke'){
    await api(`/v2/clients/${encodeURIComponent(form.client.client_id)}/revoke`,{body:{},key:state.formKey});
  } else if(form.type==='approve'){
    const r=form.request;await api('/v2/approval-batches',{body:{items:[{company_id:r.company_id,request_id:r.request_id,snapshot_id:r.snapshot.snapshot_id,snapshot_hash:r.snapshot.hash}],consent:{mode:'owner_session',text:'Aprovo esta nota conforme a prévia discriminada no aplicativo.'}},key:state.formKey});
  } else if(form.type==='emit'){
    const r=form.request;await api('/v2/operations',{body:{company_id:r.company_id,request_id:r.request_id,approval_batch_id:r.active_approval.batch_id},key:state.formKey});
  } else if(form.type==='prepare'||form.type==='revise'){
    const payload={company_id:form.request?.company_id??data.company_id,profile_id:data.profile_id,gross_amount_cents:parseMoney(data.gross_amount),competence:data.competence,competence_date:data.competence_date};if(data.description?.trim())payload.description=data.description;if(data.purchase_order?.trim())payload.purchase_order=data.purchase_order;
    if(form.type==='revise')payload.expected_revision=form.request.revision;
    await api(form.type==='revise'?`/v2/requests/${encodeURIComponent(form.request.request_id)}/revise`:'/v2/requests',{body:payload,key:state.formKey});state.view='requests';
  } else return;
  $('editor').close();await load();setView(state.view);if(form.type==='approve')note('Aprovação registrada');if(form.type==='emit')note('Emissão solicitada. Acompanhe o resultado em Atividade.');if(form.type==='approve_batch')note(`Aprovação registrada para ${form.requests.length} ${form.requests.length===1?'nota':'notas'}.`);if(form.type==='revise')note('Nova revisão preparada. A aprovação anterior não autoriza esta revisão.');
}catch(e){$('editor-error').textContent=e.message;}finally{setBusy(false);if(state.form?.type==='import_commit'&&!state.form.preview.can_commit)$('editor-save').disabled=true;}}

$('nav').addEventListener('click',event=>{const b=event.target.closest('button[data-view]');if(b)setView(b.dataset.view);});
$('company-filter').addEventListener('change',()=>{state.company=$('company-filter').value;load();});$('refresh').addEventListener('click',load);$('prepare').addEventListener('click',openPrepare);
$('planning-month').value=state.month;
$('planning-month').addEventListener('change',()=>{if($('planning-month').checkValidity() && /^\d{4}-\d{2}$/.test($('planning-month').value)){state.month=$('planning-month').value;state.selectedOccurrences.clear();load();}});
$('editor-form').addEventListener('submit',saveForm);$('editor-form').addEventListener('input',()=>{if(!state.busy)state.formKey=crypto.randomUUID();});
for(const id of ['editor-cancel','editor-close'])$(id).addEventListener('click',()=>{if(!state.busy)closeEditor();});$('editor').addEventListener('cancel',event=>{event.preventDefault();if(!state.busy)closeEditor();});
$('editor').addEventListener('close',()=>{if(!$('editor').open&&state.form?.type==='secret'){$('editor-fields').replaceChildren();state.form=null;}});
function observeSession(){const ready=window.HUB_AUTH_READY;if(!ready||ready===state.ready)return;state.ready=ready;ready.then(result=>{if(ready!==state.ready)return;state.valid=result?.status==='valid';if(state.valid){load();}else{state.generation++;clearData();$('prepare').disabled=true;$('company-filter').disabled=true;render();}}).catch(()=>{state.valid=false;clearData();render();});}
if(window.top!==window.self){document.body.replaceChildren(empty('Abra o aplicativo diretamente','A área fiscal não pode ser aberta dentro de outro site.'));}else{observeSession();const watcher=setInterval(observeSession,250);window.addEventListener('pagehide',()=>clearInterval(watcher),{once:true});window.addEventListener('pageshow',event=>{if(event.persisted)location.reload();});}
