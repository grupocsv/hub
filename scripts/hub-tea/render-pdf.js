// Rasteriza páginas de um PDF usando pdf.js dentro do Chromium do Playwright.
// É assim que a prancha da Jornada e a capa do Relatório entram na página: do
// PDF verdadeiro, e não de uma captura de tela que pode pegar a página no meio
// do carregamento ou com imagem faltando.
//
// uso: node render-pdf.js arquivo.pdf prefixo escala [primeira ultima]
//
// Precisa de pdfjs-dist instalado no diretório e de um servidor local servindo
// esse diretório na porta abaixo — o Chromium recusa import de módulo por
// file:// (CORS), então a folha e o worker do pdf.js têm que vir por http:
//
//   npm install pdfjs-dist
//   printf '<!doctype html><meta charset="utf-8"><title>r</title>' > vazio.html
//   npx http-server -p 8791 -s .
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const BASE = 'http://127.0.0.1:8791';

const [, , pdfPath, prefixo, escalaStr, pStr, uStr] = process.argv;
const escala = Number(escalaStr || 2);

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-proxy-server'] });
  const p = await b.newPage();
  p.on('console', m => console.log('  [browser]', m.text()));
  await p.goto(BASE + '/vazio.html');
  const b64 = fs.readFileSync(pdfPath).toString('base64');
  const total = await p.evaluate(async ({ b64 }) => {
    const mod = await import('/node_modules/pdfjs-dist/build/pdf.min.mjs');
    mod.GlobalWorkerOptions.workerSrc = '/node_modules/pdfjs-dist/build/pdf.worker.min.mjs';
    const bin = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
    window.__doc = await mod.getDocument({
      data: bin,
      standardFontDataUrl: '/node_modules/pdfjs-dist/standard_fonts/',
      cMapUrl: '/node_modules/pdfjs-dist/cmaps/', cMapPacked: true,
    }).promise;
    return window.__doc.numPages;
  }, { b64 });
  console.log(pdfPath, total, 'páginas');
  const primeira = pStr ? Number(pStr) : 1;
  const ultima = uStr ? Number(uStr) : total;
  for (let n = primeira; n <= ultima; n++) {
    const url = await p.evaluate(async ({ n, escala }) => {
      const pg = await window.__doc.getPage(n);
      const vp = pg.getViewport({ scale: escala });
      const c = document.createElement('canvas');
      c.width = Math.floor(vp.width); c.height = Math.floor(vp.height);
      const cx = c.getContext('2d');
      cx.fillStyle = '#fff'; cx.fillRect(0, 0, c.width, c.height);
      await pg.render({ canvasContext: cx, viewport: vp }).promise;
      return c.toDataURL('image/png');
    }, { n, escala });
    const arq = `${prefixo}-${String(n).padStart(2, '0')}.png`;
    const bytes = Buffer.from(url.split(',')[1], 'base64');
    fs.writeFileSync(arq, bytes);
    console.log(' ', arq, (bytes.length / 1024).toFixed(0), 'KB');
  }
  await b.close();
})();
