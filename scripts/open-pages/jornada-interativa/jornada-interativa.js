/* Camada progressiva sobre o SVG oficial. Sem dependências ou chamadas de rede. A proteção é aplicada pelo servidor.
 * Dados: script#jornada-interactive-points, type="application/json",
 * data-map-image="/jornada-tea/mapa.png"; array [{id,title,body,bounds:[x,y,w,h]}].
 * Carregar este arquivo com defer, depois de jornada-interativa.css.
 */
(function () {
  'use strict';

  function start() {
    const page = document.getElementById('p1');
    const data = document.getElementById('jornada-interactive-points');
    const frame = page && page.querySelector('.diagram-frame');
    const svg = frame && frame.querySelector(':scope > svg');
    if (!page || !data || !frame || !svg || page.classList.contains('ji-enhanced')) return;

    let points;
    try {
      const box = svg.viewBox.baseVal;
      if (box.x !== 0 || box.y !== 0 || box.width !== 1820 || box.height !== 1375) return;
      points = JSON.parse(data.textContent);
      if (!Array.isArray(points) || !points.length || points.length > 100) return;
      const ids = new Set();
      for (const point of points) {
        if (!point || typeof point.id !== 'string' || !/^[a-zA-Z0-9_-]{1,80}$/.test(point.id) || ids.has(point.id)) return;
        if (typeof point.title !== 'string' || !point.title.trim() || point.title.length > 180) return;
        if (typeof point.body !== 'string' || !point.body.trim() || point.body.length > 5000) return;
        if (!Array.isArray(point.bounds) || point.bounds.length !== 4 || !point.bounds.every(Number.isFinite)) return;
        const [x, y, width, height] = point.bounds;
        if (x < 0 || y < 0 || width <= 0 || height <= 0 || x + width > 1820 || y + height > 1375) return;
        ids.add(point.id);
      }
    } catch (_) { return; }

    // Sem a folha de estilos, conservar o comportamento original da página.
    frame.classList.add('ji-frame');
    if (getComputedStyle(frame).getPropertyValue('--ji-styles-ready').trim() !== '1') {
      frame.classList.remove('ji-frame');
      return;
    }

    const make = (tag, className, text) => {
      const element = document.createElement(tag);
      if (className) element.className = className;
      if (text !== undefined) element.textContent = text;
      return element;
    };
    const button = (className, text, label) => {
      const element = make('button', className, text);
      element.type = 'button';
      if (label) element.setAttribute('aria-label', label);
      return element;
    };
    const controls = make('div', 'ji-toolbar');
    const mapTools = make('div', 'ji-map-tools');

    // A imagem é apenas uma alternativa de abertura/download. Não é carregada
    // para montar o mapa, que continua sendo o SVG original já presente.
    try {
      const raw = data.getAttribute('data-map-image');
      if (raw && raw.length <= 2048) {
        const url = new URL(raw, document.baseURI);
        if (['https:', 'http:'].includes(url.protocol) && !url.username && !url.password) {
          const links = make('div', 'ji-image-actions');
          const open = make('a', 'ji-control', 'Abrir imagem');
          open.href = url.href;
          open.target = '_blank';
          open.rel = 'noopener noreferrer';
          const download = make('a', 'ji-control', 'Baixar mapa');
          download.href = url.href;
          download.download = 'jornada-tea.png';
          links.append(open, download);
          mapTools.append(links);
        }
      }
    } catch (_) { /* URL ausente ou inválida não desativa o mapa. */ }
    controls.append(mapTools);

    const help = make('p', 'ji-help', 'Clique ou toque em uma etapa para ler sua explicação abaixo do mapa. Você também pode escolher uma etapa na lista e usar Ler explicação. Para ampliar, use Abrir imagem ou o zoom do navegador.');
    help.id = 'ji-map-help';
    const pickerLabel = make('label', 'ji-stage-picker');
    const pickerTitle = make('span', '', 'Escolha uma etapa do mapa');
    pickerTitle.id = 'ji-stage-label';
    const picker = make('select', 'ji-select');
    picker.id = 'ji-stage';
    pickerLabel.htmlFor = picker.id;
    picker.setAttribute('aria-labelledby', pickerTitle.id);
    picker.setAttribute('aria-describedby', help.id);
    const placeholder = make('option', '', 'Selecione para ver a explicação');
    placeholder.value = '';
    picker.append(placeholder);
    pickerLabel.append(pickerTitle, picker);

    const mobileCards = page.querySelector('.diagram-mobile');
    const textToggle = button('ji-control ji-mobile-toggle', 'Ver percurso em texto');
    if (mobileCards) {
      if (!mobileCards.id) mobileCards.id = 'ji-percurso-texto';
      textToggle.setAttribute('aria-controls', mobileCards.id);
      textToggle.setAttribute('aria-expanded', 'false');
      controls.append(textToggle);
    }

    const canvas = make('div', 'ji-canvas');
    const hotspots = make('div', 'ji-hotspots');
    hotspots.setAttribute('role', 'group');
    hotspots.setAttribute('aria-label', 'Etapas do mapa oficial');
    const pointButtons = new Map();
    points.forEach(point => {
      const option = make('option', '', point.title);
      option.value = point.id;
      picker.append(option);
      const target = button('ji-hotspot', '', point.title);
      target.dataset.jiPoint = point.id;
      target.setAttribute('aria-pressed', 'false');
      target.setAttribute('aria-controls', 'ji-explanation');
      const [x, y, width, height] = point.bounds;
      target.style.left = `${x / 1820 * 100}%`;
      target.style.top = `${y / 1375 * 100}%`;
      target.style.width = `${width / 1820 * 100}%`;
      target.style.height = `${height / 1375 * 100}%`;
      hotspots.append(target);
      pointButtons.set(point.id, target);
    });

    const explanation = make('section', 'ji-explanation');
    explanation.id = 'ji-explanation';
    explanation.tabIndex = -1;
    explanation.setAttribute('aria-labelledby', 'ji-explanation-title');
    explanation.setAttribute('aria-describedby', 'ji-explanation-body');
    const explanationTitle = make('h2', 'ji-explanation-title', 'Entenda cada etapa');
    explanationTitle.id = 'ji-explanation-title';
    const explanationBody = make('p', 'ji-explanation-body', 'Selecione uma etapa do mapa para conhecer sua função na jornada.');
    explanationBody.id = 'ji-explanation-body';
    const returnToMap = button('ji-control ji-return', 'Voltar à etapa no mapa');
    returnToMap.hidden = true;
    explanation.append(explanationTitle, explanationBody, returnToMap);
    const readExplanation = button('ji-control ji-read', 'Ler explicação');
    readExplanation.disabled = true;
    readExplanation.setAttribute('aria-controls', explanation.id);
    const selectedStatus = make('span', 'ji-selection-status');
    selectedStatus.setAttribute('role', 'status');
    selectedStatus.setAttribute('aria-live', 'polite');
    const explanationActions = make('div', 'ji-explanation-actions');
    explanationActions.append(readExplanation, selectedStatus);

    // Mover o nó conserva o SVG, seus atributos, textos, definições e referências.
    canvas.append(svg, hotspots);
    frame.append(canvas);
    frame.before(controls, help, pickerLabel, explanationActions);
    frame.after(explanation);
    frame.setAttribute('role', 'region');
    frame.setAttribute('aria-label', 'Mapa interativo da jornada. Use Tab para explorar as etapas.');
    frame.setAttribute('aria-describedby', help.id);
    let active = null;
    let textOpen = false;

    function focusElement(element) {
      // Só uma ação explícita desloca a página. O hover nunca move o desenho.
      element.scrollIntoView({block: 'start', inline: 'nearest', behavior: 'instant'});
      element.focus({preventScroll: true});
    }
    function readSelected() {
      if (active) focusElement(explanation);
    }
    function select(point, moveToExplanation) {
      if (active && active.id !== point.id) {
        const previous = pointButtons.get(active.id);
        previous.classList.remove('ji-active');
        previous.setAttribute('aria-pressed', 'false');
      }
      active = point;
      const anchor = pointButtons.get(point.id);
      anchor.classList.add('ji-active');
      anchor.setAttribute('aria-pressed', 'true');
      picker.value = point.id;
      explanationTitle.textContent = point.title;
      explanationBody.textContent = point.body;
      readExplanation.disabled = false;
      returnToMap.hidden = false;
      selectedStatus.textContent = 'Etapa selecionada: ' + point.title;
      if (moveToExplanation) readSelected();
    }
    picker.addEventListener('change', () => {
      const point = points.find(item => item.id === picker.value);
      if (point) select(point, false);
      else if (active) picker.value = active.id;
    });
    for (const point of points) {
      const target = pointButtons.get(point.id);
      // :hover e :focus-visible realçam o contorno; seleção só ocorre no click,
      // que inclui toque e ativação nativa por Enter ou barra de espaço.
      target.addEventListener('click', () => select(point, true));
    }
    readExplanation.addEventListener('click', readSelected);
    returnToMap.addEventListener('click', () => {
      if (active) focusElement(pointButtons.get(active.id));
    });

    function toggleText(openText) {
      textOpen = openText;
      page.classList.toggle('ji-text-open', textOpen);
      textToggle.setAttribute('aria-expanded', String(textOpen));
      textToggle.textContent = textOpen ? 'Voltar ao mapa interativo' : 'Ver percurso em texto';
    }
    textToggle.addEventListener('click', () => toggleText(!textOpen));
    window.addEventListener('resize', () => {
      if (!matchMedia('(max-width: 860px)').matches && textOpen) toggleText(false);
    });
    page.classList.add('ji-enhanced');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once: true});
  else start();
  // Segunda tentativa apenas para CSS carregado depois do DOM; a inicialização
  // é idempotente e só ocorre se dados, SVG e estilos estiverem disponíveis.
  window.addEventListener('load', start, {once: true});
})();
