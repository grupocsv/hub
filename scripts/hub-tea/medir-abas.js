// Confere que a barra inferior mostra que rola: quantas abas cabem inteiras e
// quanto da seguinte aparece, em cada largura de telefone.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  for (const w of process.argv.slice(2).map(Number)) {
    const p = await b.newPage({ viewport: { width: w, height: 780 }, deviceScaleFactor: 1 });
    await p.route('**/*', r => (r.request().url().startsWith('http') ? r.abort() : r.continue()));
    await p.goto('file://' + process.cwd() + '/mock-painel.html', { waitUntil: 'load' });
    await p.waitForTimeout(500);
    const r = await p.evaluate(() => {
      const barra = document.querySelector('.tabbar');
      const larg = document.documentElement.clientWidth;
      const itens = [...document.querySelectorAll('.tab-item')].map(e => e.getBoundingClientRect());
      const inteiras = itens.filter(b => b.right <= larg + 0.5).length;
      const proxima = itens[inteiras];
      const espia = proxima ? Math.max(0, Math.round(larg - proxima.left)) : 0;
      const fade = getComputedStyle(barra, '::after').width;
      const rola = document.querySelector('.tabbar .tabs');
      return { abas: itens.length, inteiras, espia, fade,
               rolavel: rola.scrollWidth > rola.clientWidth,
               visivel: getComputedStyle(barra).display };
    });
    console.log(`  ${w}px  abas=${r.abas} inteiras=${r.inteiras} espia=${r.espia}px `
      + `esmaecido=${r.fade} rolável=${r.rolavel} barra=${r.visivel}`);
    await p.close();
  }
  await b.close();
})();
