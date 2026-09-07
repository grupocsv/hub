const { chromium } = require('playwright');
const larguras = process.argv.slice(2).map(Number);
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  for (const w of larguras) {
    const p = await b.newPage({ viewport: { width: w, height: 900 }, deviceScaleFactor: 1 });
    await p.route('**/*', r => (r.request().url().startsWith('http') ? r.abort() : r.continue()));
    await p.goto('file://' + process.cwd() + '/vista-tmp.html', { waitUntil: 'load' });
    await p.evaluate(() => document.querySelectorAll('.rv').forEach(e => e.classList.add('in')));
    await p.waitForTimeout(900);
    const r = await p.evaluate(() => {
      const cx = s => { const e = document.querySelector(s); if (!e) return null;
        const b = e.getBoundingClientRect(); return { t: Math.round(b.top), b: Math.round(b.bottom), l: Math.round(b.left), r: Math.round(b.right), w: Math.round(b.width), h: Math.round(b.height) }; };
      const o = {};
      for (const s of ['.p2', '.p2 .lado', '.p2 .folha', '.p2 .cta', '.p3', '.p3 .cta', '.p3 .peca-t', '.p3 .tablet',
                       '.p4', '.p4 .cta', '.p4 .peca-l', '.p4 .livro', '.p1'])
        o[s] = cx(s);
      o.overflowX = document.documentElement.scrollWidth > document.documentElement.clientWidth;
      return o;
    });
    console.log('== ' + w + 'px ==  overflowX=' + r.overflowX);
    for (const k of Object.keys(r)) if (k !== 'overflowX' && r[k])
      console.log('  %s  t=%d b=%d l=%d r=%d  %dx%d', k.padEnd(14), r[k].t, r[k].b, r[k].l, r[k].r, r[k].w, r[k].h);
    // conferencias: o objeto nunca comeca acima do fim da chamada
    for (const [cta, peca] of [['.p3 .cta', '.p3 .peca-t'], ['.p4 .cta', '.p4 .peca-l']])
      console.log('  %s -> %s : folga %dpx %s', cta, peca, r[peca].t - r[cta].b,
        r[peca].t >= r[cta].b ? 'ok' : '*** SOBREPOE ***');
    await p.close();
  }
  await b.close();
})();
