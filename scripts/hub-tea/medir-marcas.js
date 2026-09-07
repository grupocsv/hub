// Confere a grade das marcas no telefone: quantas fileiras, se alguma marca
// transborda a célula e se a página ganhou rolagem horizontal.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  for (const w of process.argv.slice(2).map(Number)) {
    const p = await b.newPage({ viewport: { width: w, height: 800 }, deviceScaleFactor: 1 });
    await p.route('**/*', r => (r.request().url().startsWith('http') ? r.abort() : r.continue()));
    await p.goto('file://' + process.cwd() + '/vista-tmp.html', { waitUntil: 'load' });
    await p.evaluate(() => document.querySelectorAll('.rv').forEach(e => e.classList.add('in')));
    await p.waitForTimeout(600);
    const r = await p.evaluate(() => {
      const sec = document.querySelector('.parceiros');
      const cx = sec.getBoundingClientRect();
      const imgs = [...sec.querySelectorAll('img')];
      // fileira se define pelo CENTRO, não pelo topo: as marcas têm alturas
      // diferentes e alinham pelo meio, então topos iguais não existem
      const centros = imgs.map(i => { const c = i.getBoundingClientRect(); return c.top + c.height / 2; });
      const fileiras = centros.reduce((acc, y) => {
        if (!acc.some(v => Math.abs(v - y) < 6)) acc.push(y);
        return acc;
      }, []);
      const grade = getComputedStyle(sec).display === 'grid';
      const transbordo = !grade ? [] : imgs.filter(i => {
        const c = i.getBoundingClientRect();
        return c.left < cx.left + 1 || c.right > cx.right - 1;
      }).map(i => i.alt.split(' ')[0]);
      const larguras = imgs.map(i => `${i.alt.split(/[ —]/)[0]}:${Math.round(i.getBoundingClientRect().width)}`);
      return { grade: getComputedStyle(sec).display, fileiras: fileiras.length,
               cartao: Math.round(cx.width), transbordo, larguras,
               alturas: imgs.map(i => `${i.alt.split(/[ —]/)[0]}:${Math.round(i.getBoundingClientRect().height)}`),
               rolagem: document.documentElement.scrollWidth > document.documentElement.clientWidth };
    });
    console.log(`  ${String(w).padStart(3)}px  ${r.grade}  ${r.fileiras} fileiras  cartão ${r.cartao}px  `
      + `rolagemX=${r.rolagem}  transbordo=${r.transbordo.length ? r.transbordo.join(',') : 'nenhum'}`);
    console.log(`         larguras ${r.larguras.join('  ')}`);
    console.log(`         alturas  ${r.alturas.join('  ')}`);
    await p.close();
  }
  await b.close();
})();
