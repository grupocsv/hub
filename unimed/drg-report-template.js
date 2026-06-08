// DRG Report Template - Lightweight version using CDN assets
// Uses Google Fonts (Poppins for display, Libre Baskerville for body) as substitutes
// for TeX Gyre Heros and TeX Gyre Pagella
window.DRG_REPORT_TEMPLATE = {
  css: `
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;700&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&display=swap');
:root{
  --bg:#003b3b; --orange:#d15900; --green:#009559; --blue:#004f7c;
  --mint:#6fcf97; --cov-gray:#8fb3a7; --row:#f4f6f4;
  --display:'Poppins',Arial,sans-serif; --body:'Libre Baskerville','Palatino',serif;
}
*{margin:0;padding:0;box-sizing:border-box;}
@page{size:A4;margin:0;}
html,body{font-family:var(--body);color:#1f1f1f;-webkit-font-smoothing:antialiased;}

.page{width:210mm;height:297mm;position:relative;overflow:hidden;background:#fff;page-break-after:always;}
.page:last-child{page-break-after:auto;}

/* ============ COVER ============ */
.cover{background:var(--bg);color:#fff;}
.cover::before{content:"";position:absolute;right:-120mm;top:-30mm;width:240mm;height:240mm;border-radius:50%;
  background:radial-gradient(circle, rgba(255,255,255,0.045) 0%, rgba(255,255,255,0.02) 45%, transparent 70%);}
.cover-top{position:absolute;top:0;left:0;right:0;height:20mm;background:#fff;display:flex;align-items:center;
  justify-content:space-between;padding:0 14mm;z-index:3;}
.cover-top .lg-uni{height:8.5mm;}
.cover-top .lg-evs{height:13mm;}
.cover-top .lg-umed{height:9.5mm;}
.cover-body{position:absolute;top:20mm;left:0;right:0;bottom:0;padding:0 14mm;z-index:2;}
.cov-eyebrow{font-family:var(--display);font-size:9pt;letter-spacing:5px;color:var(--cov-gray);
  text-transform:uppercase;margin-top:42mm;}
.cov-h1{font-family:var(--display);font-weight:700;font-size:33pt;line-height:1.12;color:#fff;
  letter-spacing:-0.5px;margin-top:8mm;}
.cov-sub{font-family:var(--display);font-size:14pt;color:var(--cov-gray);margin-top:5mm;font-weight:400;}
.cov-divider{height:1px;background:rgba(255,255,255,0.18);margin:11mm 0 0;}
.cov-cols{display:flex;gap:0;margin-top:7mm;}
.cov-col{flex:1;padding-right:8mm;}
.cov-bar{width:42px;height:3px;margin-bottom:7px;}
.cov-col-eyebrow{font-family:var(--display);font-size:7.5pt;letter-spacing:1.6px;color:var(--cov-gray);
  text-transform:uppercase;}
.cov-col-v{font-family:var(--display);font-weight:700;font-size:17pt;color:#fff;margin-top:5px;letter-spacing:-0.3px;}
.cov-col-s{font-family:var(--display);font-size:8.5pt;color:#7a9c92;margin-top:4px;}
.cov-total{margin-top:9mm;border-left:4px solid var(--mint);background:rgba(255,255,255,0.05);
  border-radius:0 7px 7px 0;padding:8mm 9mm;display:flex;align-items:center;}
.cov-total-left{flex:1;}
.cov-total-eyebrow{font-family:var(--display);font-size:8.5pt;letter-spacing:2px;color:var(--cov-gray);text-transform:uppercase;}
.cov-total-v{font-family:var(--display);font-weight:700;font-size:31pt;color:#fff;margin-top:5mm;letter-spacing:-0.5px;}
.cov-total-right{text-align:right;}
.cov-pp{font-family:var(--display);font-weight:700;font-size:26pt;color:var(--mint);letter-spacing:-0.5px;}
.cov-pp-s{font-family:var(--display);font-size:8.5pt;color:#7a9c92;margin-top:3px;}
.cov-class{position:absolute;left:0;right:0;bottom:14mm;text-align:center;font-family:var(--display);
  font-size:7.5pt;letter-spacing:2.5px;color:#5e7c72;text-transform:uppercase;z-index:2;}
.cov-foot{position:absolute;left:0;right:0;bottom:6mm;display:flex;align-items:center;justify-content:center;
  gap:7px;font-family:var(--display);font-size:7pt;color:#5e7c72;z-index:2;}
.cov-foot img{height:9px;opacity:0.85;}

/* ============ INTERNAL PAGES ============ */
.phead{position:absolute;top:0;left:0;right:0;height:16mm;background:var(--bg);display:flex;
  align-items:center;justify-content:space-between;padding:0 14mm;}
.phead-l{font-family:var(--display);font-weight:700;font-size:9.5pt;letter-spacing:2.5px;color:#fff;text-transform:uppercase;}
.phead-r{font-family:var(--display);font-size:8pt;color:#7fa093;text-align:right;line-height:1.35;}
.pbody{padding:21mm 14mm 14mm;}
.pbody.cont{padding-top:0;}

.pfoot{position:absolute;left:0;right:0;bottom:0;height:13mm;border-top:1.5px solid #003c3c;
  display:flex;align-items:center;justify-content:space-between;padding:0 12mm;}
.pfoot-l{font-family:var(--display);font-size:6.5pt;color:#7a8a82;}
.pfoot-r{display:flex;align-items:center;gap:5px;font-family:var(--display);font-size:6.5pt;color:#7a8a82;white-space:nowrap;}
.pfoot-r img{height:8px;}

.sec-title{font-family:var(--display);font-weight:700;font-size:17pt;color:var(--bg);letter-spacing:-0.3px;
  padding-bottom:7px;border-bottom:2px solid var(--green);margin-bottom:9px;}
.sec-title.mt{margin-top:6mm;}
.para{font-family:var(--body);font-size:10.5pt;line-height:1.38;color:#262626;text-align:justify;margin:6px 0 3px;}
.eyebrow-blk{font-family:var(--display);font-weight:700;font-size:8.5pt;letter-spacing:1.6px;color:var(--bg);
  text-transform:uppercase;margin:9px 0 0;}
.footnote{font-family:var(--display);font-size:8pt;color:#8a8a8a;margin-top:7px;}

/* tables */
table{width:100%;border-collapse:collapse;margin-top:6px;}
thead th{background:var(--bg);color:#fff;font-family:var(--display);font-weight:700;font-size:8.5pt;
  letter-spacing:1.2px;text-transform:uppercase;text-align:left;padding:5px 14px;}
th.num,td.num{text-align:right;}
tbody td{padding:5px 14px;font-size:10pt;font-family:var(--body);color:#262626;}
tbody tr:nth-child(even){background:var(--row);}
td.tarifa{font-family:var(--display);font-weight:700;}
td.green{color:var(--green);font-family:var(--display);font-weight:700;}

/* bonus table */
.bonus thead th{background:var(--blue);padding:4px 14px !important;}
.bonus td{font-family:var(--display);font-size:9pt;padding:3px 14px;}
.bonus tr.total td{background:var(--blue);color:#fff;font-family:var(--display);font-weight:700;font-size:9.5pt;padding:4px 14px;}

/* CGP matrices */
.cgp{width:100%;border-collapse:collapse;margin-top:8px;page-break-inside:avoid;break-inside:avoid;}
.cgp .title-row td{font-family:var(--display);font-weight:700;font-size:9pt;letter-spacing:1.2px;
  color:#fff;text-transform:uppercase;padding:5px 14px;}
.cgp tbody td{padding:4px 14px;font-size:9.5pt;}
.cgp .lbl{font-family:var(--body);color:#262626;}
.cgp .formula{text-align:center;font-family:var(--display);font-size:8.5pt;color:#3a3a3a;}
.cgp .res{text-align:right;font-family:var(--display);font-weight:700;font-size:10pt;color:#1f1f1f;}
.cgp .total-row td{font-family:var(--display);font-weight:700;font-size:9pt;letter-spacing:0.4px;color:#fff;padding:6px 14px;}
.cgp .total-row .res{text-align:right;color:#fff;}
.cgp-2024 .title-row td,.cgp-2024 .total-row td{background:var(--orange);}
.cgp-2025 .title-row td,.cgp-2025 .total-row td{background:var(--green);}
.cgp-2024 tbody tr.calc.alt{background:#faf2ea;}
.cgp-2025 tbody tr.calc.alt{background:#eef8f2;}

/* component cards */
.card{border-radius:7px;overflow:hidden;margin-top:11px;page-break-inside:avoid;break-inside:avoid;}
.card-head{padding:11px 16px;}
.card-orange .card-head{background:var(--orange);}
.card-green .card-head{background:var(--green);}
.card-blue .card-head{background:var(--blue);}
.card-eyebrow{font-family:var(--display);font-size:7.5pt;letter-spacing:1.6px;color:rgba(255,255,255,0.82);text-transform:uppercase;}
.card-title{font-family:var(--display);font-weight:700;font-size:12.5pt;color:#fff;letter-spacing:-0.2px;}
.card-body{padding:8px 16px 9px;}
.card-orange .card-body{background:#fff9f4;border:1px solid #f0cdad;border-top:none;}
.card-green .card-body{background:#f4fbf7;border:1px solid #c2e3d2;border-top:none;}
.card-blue .card-body{background:#f4f8fb;border:1px solid #c4d7e4;border-top:none;}
.card-text{font-family:var(--body);font-size:10.2pt;line-height:1.38;color:#262626;margin-bottom:0;}
.pills{display:flex;gap:11px;}
.pill{flex:1;border:1px solid;border-radius:6px;padding:11px 8px;text-align:center;background:#fff;}
.card-orange .pill{border-color:#f0cdad;}
.card-green .pill{border-color:#c2e3d2;}
.pill-v{font-family:var(--display);font-weight:700;font-size:16pt;letter-spacing:-0.3px;}
.card-orange .pill-v{color:var(--orange);}
.card-green .pill-v{color:var(--green);}
.pill.money .pill-v{font-size:12.5pt;}
.pill-l{font-family:var(--display);font-size:8pt;color:#6a6a6a;margin-top:5px;line-height:1.25;}

/* consolidated block */
.consol{background:var(--bg);border-radius:8px;padding:14px 22px;margin-top:9px;page-break-inside:avoid;break-inside:avoid;}
.consol-eyebrow{text-align:center;font-family:var(--display);font-size:8.5pt;letter-spacing:2.2px;
  color:#7fb8a8;text-transform:uppercase;margin-bottom:10px;}
.consol-row{display:flex;align-items:center;justify-content:center;gap:9px;}
.subcard{flex:1;background:rgba(255,255,255,0.06);border-radius:6px;padding:10px 10px;text-align:center;}
.subcard-l{font-family:var(--display);font-size:7.5pt;letter-spacing:1.2px;color:#9fc4b8;text-transform:uppercase;}
.subcard-v{font-family:var(--display);font-weight:700;font-size:13pt;color:#fff;margin:6px 0 4px;letter-spacing:-0.3px;}
.subcard-s{font-family:var(--display);font-size:7pt;letter-spacing:0.8px;color:#7fa99c;text-transform:uppercase;}
.plus{font-family:var(--display);font-weight:700;font-size:15pt;color:#7fb8a8;}
.total-block{background:#004a40;border-radius:6px;padding:11px 18px;text-align:center;margin-top:8px;}
.total-block-l{font-family:var(--display);font-size:9pt;letter-spacing:2.2px;color:#9fc4b8;text-transform:uppercase;}
.total-block-v{font-family:var(--display);font-weight:700;font-size:27pt;color:#fff;margin:6px 0 5px;letter-spacing:-0.5px;}
.total-block-s{font-family:var(--display);font-size:8.5pt;color:#8fb5a8;}

/* calc + premissas */
div.calc{border-left:4px solid var(--green);background:#f5faf7;border-radius:0 6px 6px 0;padding:12px 20px;margin-top:6px;page-break-inside:avoid;break-inside:avoid;}
.calc-line{font-family:var(--display);font-size:10.5pt;color:#1f1f1f;margin:5px 0;}
.calc-total{font-family:var(--display);font-weight:700;font-size:13pt;color:var(--green);margin-top:9px;}
.premissas{border-left:4px solid var(--green);background:#f5faf7;border-radius:0 6px 6px 0;padding:12px 20px;margin-top:10px;page-break-inside:avoid;break-inside:avoid;}
.premissas p{font-family:var(--display);font-size:8.5pt;line-height:1.7;color:#5a5a5a;}
.premissas b{color:var(--bg);}

/* CTA */
.cta{border-radius:8px;overflow:hidden;margin-top:14px;page-break-inside:avoid;break-inside:avoid;}
.cta-head{background:var(--bg);padding:18px 22px;}
.cta-head h3{font-family:var(--display);font-weight:700;font-size:15pt;color:#fff;}
.cta-head p{font-family:var(--display);font-size:9.5pt;color:#7fb8a8;margin-top:5px;}
.cta-body{background:#f4f6f4;padding:20px 22px;}
.cta-top{display:flex;gap:18px;align-items:flex-start;}
.cta-avatar{width:80px;height:80px;border-radius:50%;border:3px solid #a6fb90;object-fit:cover;flex-shrink:0;}
.cta-text{font-family:var(--body);font-size:11pt;line-height:1.5;color:#1f1f1f;flex:1;padding-top:3px;}
.cta-bottom{display:flex;align-items:flex-end;justify-content:space-between;margin-top:14px;padding-left:98px;}
.cta-sig img{height:42px;}
.cta-btn{background:var(--green);border-radius:6px;padding:11px 22px;text-align:center;}
.cta-btn .b1{font-family:var(--display);font-weight:700;font-size:10.5pt;color:#fff;}
.cta-btn .b2{font-family:var(--display);font-size:8.5pt;color:rgba(255,255,255,0.8);margin-top:2px;}
`,
  images: [
    "https://assets.grupocsv.com/logos/unihealth/horizontal-box.png",
    "https://assets.grupocsv.com/logos/evs/selo-hd-contorno.png",
    "https://assets.grupocsv.com/logos/unimed-gv/sem-box.png",
    "https://assets.grupocsv.com/logos/axiacare/horizontal-positivo.png",
    "https://assets.grupocsv.com/logos/axiacare/horizontal-mono-negativo.png",
    "https://assets.grupocsv.com/logos/axiacare/horizontal-mono-negativo.png",
    "https://assets.grupocsv.com/logos/axiacare/horizontal-mono-negativo.png",
    "https://assets.grupocsv.com/email-assets/avatar-guilherme-thome-csv.png",
    "https://assets.grupocsv.com/institucional/guilherme-thome/assinatura-azul.webp",
    "https://assets.grupocsv.com/logos/axiacare/horizontal-mono-negativo.png"
  ]
};
