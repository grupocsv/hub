const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  let html = fs.readFileSync('hub-novo.html', 'utf8');
  const inter = fs.readFileSync('../fonts/inter-local.css', 'utf8');
  html = html.replace(/<link[^>]*fonts\.googleapis[^>]*>/gi, '').replace('<style>', '<style>' + inter + '\n');
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  await p.route('**/*', r => (r.request().url().startsWith('http') ? r.abort() : r.continue()));
  await p.setContent(html, { waitUntil: 'load' });
  await p.evaluate(() => document.querySelectorAll('.rv').forEach(e => e.classList.add('in')));
  await p.waitForTimeout(600);
  const r = await p.evaluate(() => {
    const card = document.querySelector('.p1').getBoundingClientRect();
    const svg = document.querySelector('.p1 .caminho').getBoundingClientRect();
    const cta = document.querySelector('.p1 .cta').getBoundingClientRect();
    const pontos = [...document.querySelectorAll('.p1 .marco')].map(c => {
      const b = c.getBoundingClientRect();
      return { cx: Math.round(b.x + b.width / 2 - card.x), cy: Math.round(b.y + b.height / 2 - card.y), cor: getComputedStyle(c).fill };
    });
    return {
      cartao: { w: Math.round(card.width), h: Math.round(card.height) },
      svg: { x: Math.round(svg.x - card.x), y: Math.round(svg.y - card.y), w: Math.round(svg.width), h: Math.round(svg.height) },
      cta: { x: Math.round(cta.x - card.x), y: Math.round(cta.y - card.y), w: Math.round(cta.width), h: Math.round(cta.height) },
      pontos,
    };
  });
  console.log(JSON.stringify(r, null, 1));
  await b.close();
})();
