const { chromium } = require('playwright');
const fs = require('fs');
const [,, src, prefixo] = process.argv;
(async () => {
  let html = fs.readFileSync(src, 'utf8');
  const inter = fs.readFileSync('../fonts/inter-local.css', 'utf8');
  html = html.replace(/<link[^>]*fonts\.googleapis[^>]*>/g, '').replace('<style>', '<style>' + inter + '\n');
  html = html.split('https://assets.grupocsv.com/logos/unimed-gv/sem-box-pinheiro.png')
             .join('file://' + process.cwd() + '/ativos/logos-unimed-gv-sem-box-pinheiro.png');
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  for (const [w, tag, dpr] of [[1440, 'desk', 2], [390, 'mob', 2]]) {
    const p = await b.newPage({ viewport: { width: w, height: 900 }, deviceScaleFactor: dpr });
    await p.route('**/*', r => (r.request().url().startsWith('http') ? r.abort() : r.continue()));
    await p.setContent(html, { waitUntil: 'load' });
    await p.evaluate(() => document.querySelectorAll('.rv').forEach(e => e.classList.add('in')));
    await p.waitForTimeout(2600);
    await p.screenshot({ path: `${prefixo}-${tag}.png`, fullPage: true });
    const over = await p.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    console.log(`${tag} ${w}px overflow=${over}`);
    await p.close();
  }
  await b.close();
})();
