// Peça editorial nova: marca oficial e texto, sem pixels ou nós do mapa.
import fs from 'node:fs/promises';
import {createRequire} from 'node:module';
const require=createRequire(process.env.JORNADA_RUNTIME_PACKAGE||import.meta.url);
const {chromium}=require('playwright');
const [brandFile,target]=process.argv.slice(2);
if(!brandFile||!target)throw Error('Informe marca SVG e WebP de saída.');
const brand=await fs.readFile(brandFile,'utf8');
const browser=await chromium.launch({headless:true,channel:process.env.JORNADA_BROWSER_CHANNEL||'chrome'});
try{
 const page=await browser.newPage();
 const data=await page.evaluate(async svg=>{
  const logo=new Image();logo.src='data:image/svg+xml;base64,'+btoa(unescape(encodeURIComponent(svg)));await logo.decode();
  const canvas=document.createElement('canvas');canvas.width=1600;canvas.height=1130;
  const ctx=canvas.getContext('2d');ctx.fillStyle='#fffdf8';ctx.fillRect(0,0,1600,1130);
  ctx.strokeStyle='#e7e2d5';ctx.lineWidth=2;ctx.strokeRect(32,32,1536,1066);
  const width=760,height=width*logo.naturalHeight/logo.naturalWidth;
  ctx.drawImage(logo,(1600-width)/2,210,width,height);
  ctx.textAlign='center';ctx.fillStyle='#034f4b';ctx.font='64px Georgia,serif';
  ctx.fillText('Cada etapa do cuidado,',800,675);ctx.fillText('em um mesmo caminho.',800,758);
  ctx.fillStyle='#61766e';ctx.font='28px Arial,sans-serif';ctx.fillText('Acesso institucional',800,916);
  return canvas.toDataURL('image/webp',0.95).split(',')[1];
 },brand);
 const bytes=Buffer.from(data,'base64');
 if(bytes.toString('ascii',0,4)!=='RIFF'||bytes.toString('ascii',8,12)!=='WEBP')throw Error('Saída não é WebP.');
 await fs.writeFile(target,bytes);
}finally{await browser.close();}
