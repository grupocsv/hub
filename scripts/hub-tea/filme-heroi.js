// Congela a abertura da página num instante e fotografa o herói: é assim que se
// vê os seis pontos e a estrela nascendo em sequência, sem depender de sorte.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  for (const seg of process.argv.slice(2).map(Number)) {
    const p = await b.newPage({ viewport: { width: 1440, height: 620 }, deviceScaleFactor: 2 });
    await p.route('**/*', r => (r.request().url().startsWith('http') ? r.abort() : r.continue()));
    await p.goto('file://' + process.cwd() + '/vista-tmp.html', { waitUntil: 'load' });
    await p.evaluate(() => document.querySelectorAll('.rv').forEach(e => e.classList.add('in')));
    await p.waitForTimeout(400);
    const n = await p.evaluate(s => {
      const a = document.querySelectorAll('h1.marca .rastro circle, h1.marca .rastro .estrela');
      let vis = 0;
      document.getAnimations().forEach(x => { try { x.pause(); x.currentTime = s * 1000; } catch (e) {} });
      a.forEach(e => { if (+getComputedStyle(e).opacity > 0.5) vis++; });
      return `${vis}/${a.length} acesos`;
    }, seg);
    console.log(`  ${seg}s  ${n}`);
    await p.screenshot({ path: `heroi-${String(seg).replace('.', '_')}s.png`, clip: { x: 100, y: 120, width: 800, height: 300 } });
    await p.close();
  }
  await b.close();
})();
