/** Extensão restrita sobre a versão publicada; preserva o Worker original. */
import production from './production/hub-unimedgv-20260921.mjs';
export const MAP_URL='https://open.grupocsv.com/jornada-tea/mapa-jornada-04689f954dadd0f5.png';
export function legacyMapRequest(request) {
  let path=new URL(request.url).pathname;
  try { for(let i=0;i<3;i++){const decoded=decodeURIComponent(path);if(decoded===path)break;path=decoded;} }
  catch { return null; }
  path=path.replace(/\\/g,'/').replace(/\/{2,}/g,'/').replace(/\/$/,'');
  if(path!='/tea/peca-jornada.webp')return null;
  if(!['GET','HEAD'].includes(request.method))return new Response(null,{status:405,headers:{Allow:'GET, HEAD','Cache-Control':'no-store'}});
  return new Response(null,{status:302,headers:{Location:MAP_URL,'Cache-Control':'private, no-store','X-TEA-Access':'required','Referrer-Policy':'no-referrer'}});
}
export default {
  async fetch(request,env,ctx) {
    const result=legacyMapRequest(request);
    return result??production.fetch(request,env,ctx);
  },
};
