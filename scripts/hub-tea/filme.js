const { chromium } = require('playwright');
const fs = require('fs');
const [,, src, prefixo, ...tempos] = process.argv;
(async () => {
  let html = fs.readFileSync(src, 'utf8');
  const inter = fs.readFileSync('../fonts/inter-local.css', 'utf8');
  html = html.replace(/<link[^>]*fonts\.googleapis[^>]*>/gi, '').replace('<style>', '<style>' + inter + '\n');
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  await p.route('**/*', r => (r.request().url().startsWith('http') ? r.abort() : r.continue()));
  await p.setContent(html, { waitUntil: 'load' });
  await p.evaluate(() => document.querySelectorAll('.rv').forEach(e => e.classList.add('in')));
  await p.waitForTimeout(1500);
  const cartao = await p.locator('.p1').first();
  for (const t of tempos) {
    // congela a animação no instante pedido do ciclo
    await p.evaluate(seg => {
      document.getAnimations().forEach(a => { try { a.pause(); a.currentTime = seg * 1000; } catch (e) {} });
    }, Number(t));
    await p.waitForTimeout(120);
    await cartao.screenshot({ path: `${prefixo}-${t}s.png` });
  }
  await b.close();
})();
