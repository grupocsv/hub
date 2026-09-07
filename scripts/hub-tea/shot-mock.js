const { chromium } = require('playwright');
const [,, src, out, w, h, dpr] = process.argv;
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: +(dpr || 2) });
  await p.route('**/*', r => (r.request().url().startsWith('http') ? r.abort() : r.continue()));
  await p.goto('file://' + process.cwd() + '/' + src, { waitUntil: 'load' });
  await p.waitForTimeout(700);
  await p.screenshot({ path: out });
  await b.close();
})();
