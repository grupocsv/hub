// Codifica a OG nos dois formatos que a slug serve, a partir do render em 2x.
// JPEG para o og:image (é o que o WhatsApp busca) e PNG para quem preferir
// sem perdas. uso: node og-codificar.js entrada.png saidaBase larguraFinal qualidadeJpg
const { chromium } = require('playwright');
const fs = require('fs');

const [, , entrada, base, largStr, qStr] = process.argv;
const largura = parseInt(largStr, 10);
const q = Number(qStr || 0.92);

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-proxy-server'] });
  const p = await b.newPage();
  const b64 = fs.readFileSync(entrada).toString('base64');
  const r = await p.evaluate(async ({ b64, largura, q }) => {
    const img = new Image();
    img.src = 'data:image/png;base64,' + b64;
    await img.decode();
    const c = document.createElement('canvas');
    c.width = largura;
    c.height = Math.round(largura * img.naturalHeight / img.naturalWidth);
    const cx = c.getContext('2d');
    cx.imageSmoothingQuality = 'high';
    // o JPEG não tem alfa: pinta o papel antes, senão o fundo vira preto
    cx.fillStyle = '#FAF6EE';
    cx.fillRect(0, 0, c.width, c.height);
    cx.drawImage(img, 0, 0, c.width, c.height);
    return { jpg: c.toDataURL('image/jpeg', q), png: c.toDataURL('image/png'),
             w: c.width, h: c.height };
  }, { b64, largura, q });
  for (const [ext, url] of [['jpg', r.jpg], ['png', r.png]]) {
    const bytes = Buffer.from(url.split(',')[1], 'base64');
    fs.writeFileSync(`${base}.${ext}`, bytes);
    console.log(`  ${base}.${ext}  ${r.w}x${r.h}  ${(bytes.length / 1024).toFixed(1)} KB`);
  }
  await b.close();
})();
