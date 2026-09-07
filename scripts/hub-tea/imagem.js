// Recorta, redimensiona e grava em WEBP usando o canvas do navegador.
// uso: node imagem.js entrada.png saida.webp larguraFinal [sx sy sw sh] [qualidade]
const { chromium } = require('playwright');
const fs = require('fs');

const [, , entrada, saida, largStr, ...resto] = process.argv;
const larguraFinal = parseInt(largStr, 10);
let recorte = null;
let qualidade = 0.88;
if (resto.length >= 4) recorte = resto.slice(0, 4).map(Number);
const q = resto.length === 1 ? Number(resto[0]) : resto.length === 5 ? Number(resto[4]) : null;
if (q) qualidade = q;

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage();
  const b64 = fs.readFileSync(entrada).toString('base64');
  const res = await p.evaluate(async ({ b64, larguraFinal, recorte, qualidade }) => {
    const img = new Image();
    img.src = 'data:image/png;base64,' + b64;
    await img.decode();
    const sx = recorte ? recorte[0] : 0;
    const sy = recorte ? recorte[1] : 0;
    const sw = recorte ? recorte[2] : img.naturalWidth;
    const sh = recorte ? recorte[3] : img.naturalHeight;
    const escala = larguraFinal / sw;
    const c = document.createElement('canvas');
    c.width = Math.round(sw * escala);
    c.height = Math.round(sh * escala);
    const cx = c.getContext('2d');
    cx.imageSmoothingQuality = 'high';
    cx.drawImage(img, sx, sy, sw, sh, 0, 0, c.width, c.height);
    return { url: c.toDataURL('image/webp', qualidade), w: c.width, h: c.height, ow: img.naturalWidth, oh: img.naturalHeight };
  }, { b64, larguraFinal, recorte, qualidade });
  const bytes = Buffer.from(res.url.split(',')[1], 'base64');
  fs.writeFileSync(saida, bytes);
  console.log(`${entrada} ${res.ow}x${res.oh} -> ${saida} ${res.w}x${res.h}  ${(bytes.length / 1024).toFixed(1)} KB`);
  await b.close();
})();
