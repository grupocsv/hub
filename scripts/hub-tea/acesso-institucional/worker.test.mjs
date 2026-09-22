import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import worker,{legacyMapRequest,MAP_URL} from './worker.mjs';
import original from './production/hub-unimedgv-20260921.mjs';

const variants=['/tea/peca-jornada.webp','/tea//peca-jornada.webp','/tea/peca-jornada.webp/','/%74ea/peca-jornada.webp','/tea%2Fpeca-jornada.webp','/tea/%70eca-jornada.webp','/tea%252fpeca-jornada.webp','/tea/other/../peca-jornada.webp'];
for(const path of variants)test('A prancha antiga exige o mesmo acesso: '+path,async()=>{
 for(const method of ['GET','HEAD']){
  const response=await worker.fetch(new Request('https://hub.unimedgv.com'+path+'?cache=old',{method}),{},{});
  assert.equal(response.status,302);assert.equal(response.headers.get('Location'),MAP_URL);
  assert.match(response.headers.get('Cache-Control'),/no-store/);assert.equal(response.headers.get('X-TEA-Access'),'required');assert.equal(await response.text(),'');
 }
});
test('O endereço alternativo do Worker recebe a mesma proteção',async()=>{
 const response=await worker.fetch(new Request('https://hub-unimedgv.example.workers.dev/tea/peca-jornada.webp'),{},{});
 assert.equal(response.status,302);assert.equal(response.headers.get('Location'),MAP_URL);
});
test('Métodos de escrita não recebem conteúdo nem redirect',()=>assert.equal(legacyMapRequest(new Request('https://hub.unimedgv.com/tea/peca-jornada.webp',{method:'POST'})).status,405));
test('Outras rotas e login original continuam delegados',async()=>{
 const env={PAGES_KV:{get:async()=>null},PAGES_R2:{get:async()=>null}};
 for(const path of ['/api/pages','/_admin','/cuidado-coordenado/','/tea/peca-painel.webp','/tea/peca-relatorio.webp','/_assets/favicons/favicon.ico','/tea/','/tea/index.html']){
  const req=new Request('https://hub.unimedgv.com'+path);
  assert.equal(legacyMapRequest(req),null);
  const before=await original.fetch(req,env,{}),after=await worker.fetch(req,env,{});
  assert.equal(after.status,before.status);assert.deepEqual([...after.headers],[...before.headers]);assert.equal(await after.text(),await before.text());
 }
});
test('Backend publicado preservado integralmente',()=>{
 const raw=fs.readFileSync(new URL('./production/hub-unimedgv-20260921.mjs',import.meta.url));
 assert.equal(crypto.createHash('sha256').update(raw).digest('hex'),'c5a9fd5b855cb0e9cc0064cfa16d34e5b36edb3e5b6cc82cb656a8f0574123e3');
});
