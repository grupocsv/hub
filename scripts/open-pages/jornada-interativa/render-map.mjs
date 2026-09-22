// Rasterização da arte SVG integral, sem captura de tela e com as imagens incorporadas.
import fs from 'node:fs/promises';
import { createRequire } from 'node:module';
const require = createRequire(process.env.JORNADA_RUNTIME_PACKAGE || import.meta.url);
const { chromium } = require('playwright');
const [source, target] = process.argv.slice(2);
if (!source || !target) throw Error('Informe SVG e PNG de saída.');
const svg = await fs.readFile(source, 'utf8');
const browser = await chromium.launch({headless:true, ...(process.env.JORNADA_BROWSER_CHANNEL ? {channel:process.env.JORNADA_BROWSER_CHANNEL} : {})});
try {
  const page = await browser.newPage();
  const result = await page.evaluate(async svg => {
    const image = new Image();
    const url = URL.createObjectURL(new Blob([svg], {type:'image/svg+xml'}));
    image.src=url;
    await image.decode();
    const canvas=document.createElement('canvas');
    canvas.width=3640; canvas.height=2750;
    const ctx=canvas.getContext('2d');
    ctx.fillStyle='#fafaf7'; ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.drawImage(image,0,0,canvas.width,canvas.height);
    URL.revokeObjectURL(url);
    return canvas.toDataURL('image/png').split(',')[1];
  }, svg);
  await fs.writeFile(target, Buffer.from(result,'base64'));
} finally { await browser.close(); }
