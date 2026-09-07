const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  let html = fs.readFileSync('jornada-live.html', 'utf8');
  const css = fs.readFileSync('../fonts/inter-local.css', 'utf8');
  html = html.replace(/<link[^>]*fonts\.googleapis[^>]*>/g, '').replace('<style>', '<style>' + css + '\n');
  const mapa = {"https://assets.grupocsv.com/logos/unimed-gv/coordenacao-cuidado/selo-transparente-4k.webp": "ativos/ccc-selo-4k.webp", "https://open.grupocsv.com/jornada-tea/ccc-selo-branco.png": "ativos/ccc-selo-branco.png", "https://assets.grupocsv.com/logos/evs/selo-hd-contorno.png": "ativos/logos-evs-selo-hd-contorno.png", "https://assets.grupocsv.com/logos/evs/selo-white-web-360.png": "ativos/logos-evs-selo-white-web-360.png", "https://assets.grupocsv.com/logos/unimed-gv/box-pinheiro.png": "ativos/logos-unimed-gv-box-pinheiro.png", "https://assets.grupocsv.com/logos/unimed-gv/sem-box-pinheiro.png": "ativos/logos-unimed-gv-sem-box-pinheiro.png", "https://assets.grupocsv.com/logos/caminhos-brilhantes/01-trilha/horizontal-negativo.svg": "ativos/cb-horizontal-negativo.svg", "https://assets.grupocsv.com/logos/caminhos-brilhantes/01-trilha/horizontal-positivo.svg": "ativos/cb-horizontal-positivo.svg"};
  for (const [r, l] of Object.entries(mapa)) html = html.split(r).join('file://' + process.cwd() + '/' + l);
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 1700, height: 1100 }, deviceScaleFactor: 2 });
  await p.route('**/*', r => (r.request().url().startsWith('http') ? r.abort() : r.continue()));
  await p.setContent(html, { waitUntil: 'load' });
  await p.waitForTimeout(600);
  const caixa = await p.evaluate(() => {
    const svg = document.querySelector('svg[role="img"]');
    const r = svg.getBoundingClientRect();
    return { x: r.x, y: r.y, width: r.width, height: r.height };
  });
  console.log('svg', JSON.stringify(caixa));
  // recorte: metade esquerda do fluxo, onde estao as estacoes 01 a 04
  await p.screenshot({ path: 'mock-jornada-raw.png', clip: { x: caixa.x, y: caixa.y, width: caixa.width, height: Math.round(caixa.height * 0.72) } });
  await b.close();
})();
