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
    const safeLinks = new Map();
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
        if (point.link !== undefined) {
          if (!point.link || typeof point.link.href !== 'string' || typeof point.link.label !== 'string' || !point.link.label.trim() || point.link.label.length > 120) return;
          const link = new URL(point.link.href);
          if (link.origin !== 'https://open.grupocsv.com' || link.pathname !== '/esc-tea-100' || link.username || link.password || link.search || link.hash) return;
          safeLinks.set(point.id, {href: link.href, label: point.link.label});
        }
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

    const help = make('p', 'ji-help', 'Passe o mouse ou toque em uma etapa para conhecer sua função. Você também pode escolher uma etapa na lista.');
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
      target.setAttribute('aria-expanded', 'false');
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
    explanation.hidden = true;
    explanation.tabIndex = -1;
    explanation.setAttribute('role', 'region');
    explanation.setAttribute('aria-labelledby', 'ji-explanation-title');
    explanation.setAttribute('aria-describedby', 'ji-explanation-body');
    const explanationTitle = make('h2', 'ji-explanation-title');
    explanationTitle.id = 'ji-explanation-title';
    const explanationBody = make('p', 'ji-explanation-body');
    explanationBody.id = 'ji-explanation-body';
    const returnToMap = button('ji-control ji-return', 'Voltar à etapa no mapa');
    const closeExplanation = button('ji-control ji-close', 'Fechar', 'Fechar explicação');
    const explanationHead = make('div', 'ji-explanation-head');
    explanationHead.append(explanationTitle, closeExplanation);
    const explanationLink = make('a', 'ji-control ji-methodology');
    explanationLink.hidden = true;
    explanationLink.target = '_blank';
    explanationLink.rel = 'noopener noreferrer';
    const explanationFooter = make('div', 'ji-explanation-footer');
    explanationFooter.append(explanationLink, returnToMap);
    explanation.append(explanationHead, explanationBody, explanationFooter);
    const readExplanation = button('ji-control ji-read', 'Ver explicação');
    readExplanation.disabled = true;
    readExplanation.setAttribute('aria-controls', explanation.id);
    const readSlot = make('div', 'ji-read-slot');
    readSlot.append(readExplanation);
    const pickerRow = make('div', 'ji-picker-row');
    pickerRow.append(pickerLabel, readSlot);

    // Mover o nó conserva o SVG, seus atributos, textos, definições e referências.
    canvas.append(svg, hotspots, explanation);
    frame.append(canvas);
    frame.before(controls, help, pickerRow);
    frame.setAttribute('role', 'region');
    frame.setAttribute('aria-label', 'Mapa interativo da jornada. Use Tab para explorar as etapas.');
    frame.setAttribute('aria-describedby', help.id);
    let active = null;
    let textOpen = false;
    let pinned = false;
    let closeTimer = null;
    let hoverTimer = null;
    let pointerInside = false;
    let frameHovered = false;
    let readHovered = false;
    let hoveredPoint = null;
    let ignoreNextFocus = false;
    let hoverSuppressed = false;
    let lastPointerPosition = null;
    const finePointer = matchMedia('(any-hover: hover) and (any-pointer: fine)');

    function cancelClose() {
      if (closeTimer !== null) clearTimeout(closeTimer);
      closeTimer = null;
    }
    function cancelHover() {
      if (hoverTimer !== null) clearTimeout(hoverTimer);
      hoverTimer = null;
    }
    function reserveSpace() {
      // Reserva somente a sobra inferior do painel; o SVG conserva sua dimensão.
      const extra = explanation.hidden ? 0 : Math.max(0, explanation.offsetTop + explanation.offsetHeight + 12 - canvas.clientHeight);
      frame.style.setProperty('--ji-popup-space', `${Math.ceil(extra)}px`);
      updateReadHint();
    }
    function updateReadHint() {
      const rect = explanation.getBoundingClientRect();
      const offscreen = !explanation.hidden && page.classList.contains('active') && (rect.top > innerHeight - 160 || rect.bottom < 90);
      readExplanation.classList.toggle('ji-read-offscreen', offscreen);
    }
    function close(restoreFocus) {
      cancelClose();
      cancelHover();
      // Fechar ou retornar pode mover o desenho sob um cursor imóvel.
      // Um pointerenter causado por essa rolagem não representa nova intenção.
      hoverSuppressed = true;
      hoveredPoint = null;
      const target = active && pointButtons.get(active.id);
      const hadFocus = explanation.contains(document.activeElement);
      if (target) {
        target.classList.remove('ji-active');
        target.setAttribute('aria-pressed', 'false');
        target.setAttribute('aria-expanded', 'false');
      }
      explanation.hidden = true;
      pinned = false;
      active = null;
      pointerInside = false;
      picker.value = '';
      readExplanation.disabled = true;
      reserveSpace();
      if (restoreFocus && hadFocus && target) {
        ignoreNextFocus = true;
        target.focus({preventScroll: true});
        ignoreNextFocus = false;
      }
    }
    function scheduleClose() {
      cancelClose();
      if (pinned) return;
      closeTimer = setTimeout(() => {
        closeTimer = null;
        if (!active || pinned || pointerInside || frameHovered || readHovered || hoveredPoint === active.id || explanation.contains(document.activeElement) || readExplanation === document.activeElement || pointButtons.get(active.id) === document.activeElement) return;
        close(false);
      }, 600);
    }

    function focusElement(element) {
      // Só uma ação explícita desloca a página. O hover nunca move o desenho.
      element.scrollIntoView({block: 'start', inline: 'nearest', behavior: 'instant'});
      element.focus({preventScroll: true});
    }
    function readSelected() {
      if (active) {
        pinned = true;
        cancelClose();
        pointButtons.get(active.id).setAttribute('aria-pressed', 'true');
        focusElement(explanation);
      }
    }
    function select(point, pin) {
      cancelClose();
      cancelHover();
      if (active && active.id !== point.id) {
        const previous = pointButtons.get(active.id);
        previous.classList.remove('ji-active');
        previous.setAttribute('aria-pressed', 'false');
        previous.setAttribute('aria-expanded', 'false');
      }
      active = point;
      pinned = pin;
      const anchor = pointButtons.get(point.id);
      anchor.classList.add('ji-active');
      anchor.setAttribute('aria-pressed', String(pinned));
      anchor.setAttribute('aria-expanded', 'true');
      picker.value = point.id;
      explanationTitle.textContent = point.title;
      explanationBody.textContent = point.body;
      const link = safeLinks.get(point.id);
      explanationLink.hidden = !link;
      explanationLink.removeAttribute('href');
      explanationLink.textContent = '';
      if (link) {
        explanationLink.href = link.href;
        explanationLink.textContent = link.label;
      }
      explanation.hidden = false;
      readExplanation.disabled = false;
      reserveSpace();
    }
    picker.addEventListener('change', () => {
      const point = points.find(item => item.id === picker.value);
      if (point) select(point, true);
      else if (active) picker.value = active.id;
    });
    function previewPoint(point) {
      if (hoverSuppressed) return;
      hoveredPoint = point.id;
      cancelClose();
      cancelHover();
      if (pinned) return;
      if (!active || active.id === point.id) select(point, false);
      else {
        // Cruzar outra etapa a caminho do painel não deve trocar sua leitura.
        hoverTimer = setTimeout(() => {
          hoverTimer = null;
          if (!hoverSuppressed && !pinned && hoveredPoint === point.id) select(point, false);
        }, 150);
      }
    }
    for (const point of points) {
      const target = pointButtons.get(point.id);
      target.addEventListener('pointerenter', event => {
        if (!finePointer.matches || event.pointerType === 'touch') return;
        if (!lastPointerPosition && !hoverSuppressed) lastPointerPosition = {x: event.clientX, y: event.clientY};
        previewPoint(point);
      });
      target.addEventListener('pointerleave', () => {
        if (hoveredPoint === point.id) hoveredPoint = null;
        cancelHover();
        scheduleClose();
      });
      target.addEventListener('focus', () => {
        if (!ignoreNextFocus) select(point, false);
      });
      target.addEventListener('blur', scheduleClose);
      target.addEventListener('click', () => {
        select(point, true);
        readSelected();
      });
      target.addEventListener('keydown', event => {
        if (event.key === 'ArrowDown') {
          event.preventDefault();
          select(point, true);
          readSelected();
        }
      });
    }
    readExplanation.addEventListener('click', readSelected);
    returnToMap.addEventListener('click', () => {
      if (active) {
        const target = pointButtons.get(active.id);
        close(false);
        ignoreNextFocus = true;
        focusElement(target);
        ignoreNextFocus = false;
      }
    });
    closeExplanation.addEventListener('click', () => close(true));
    explanation.addEventListener('pointerenter', () => { pointerInside = true; cancelClose(); });
    explanation.addEventListener('pointerleave', () => { pointerInside = false; scheduleClose(); });
    explanation.addEventListener('focusin', cancelClose);
    explanation.addEventListener('focusout', scheduleClose);
    frame.addEventListener('pointerenter', event => {
      if (event.pointerType !== 'touch') { frameHovered = true; cancelClose(); }
    });
    frame.addEventListener('pointerleave', () => { frameHovered = false; scheduleClose(); });
    readExplanation.addEventListener('pointerenter', () => { readHovered = true; cancelClose(); });
    readExplanation.addEventListener('pointerleave', () => { readHovered = false; scheduleClose(); });
    readExplanation.addEventListener('focus', cancelClose);
    readExplanation.addEventListener('blur', scheduleClose);
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && active) {
        event.preventDefault();
        close(true);
      }
    });
    document.addEventListener('pointerdown', event => {
      if (active && !explanation.contains(event.target) && !hotspots.contains(event.target) && !pickerRow.contains(event.target)) close(false);
    });
    document.addEventListener('pointerdown', event => {
      if (event.pointerType !== 'touch') lastPointerPosition = {x: event.clientX, y: event.clientY};
    }, {capture: true, passive: true});
    document.addEventListener('pointermove', event => {
      if (event.pointerType === 'touch') return;
      const moved = !lastPointerPosition || event.clientX !== lastPointerPosition.x || event.clientY !== lastPointerPosition.y;
      lastPointerPosition = {x: event.clientX, y: event.clientY};
      if (!hoverSuppressed || !moved) return;
      hoverSuppressed = false;
      // O cursor pode continuar dentro da mesma área após a rolagem, sem
      // disparar outro pointerenter. Resolver o alvo pelo ponto visível.
      const element = document.elementFromPoint(event.clientX, event.clientY);
      const target = element && element.closest('[data-ji-point]');
      if (!finePointer.matches || !target || !hotspots.contains(target)) return;
      const point = points.find(item => item.id === target.dataset.jiPoint);
      if (point) previewPoint(point);
    }, {passive: true});
    window.addEventListener('scroll', updateReadHint, {passive: true});
    // A alternância editorial das abas não pertence a esta camada.
    // Observar apenas sua visibilidade evita manter a pista sobre Apoio Textual.
    new MutationObserver(updateReadHint).observe(page, {attributes: true, attributeFilter: ['class']});
    if (typeof ResizeObserver === 'function') {
      const observer = new ResizeObserver(reserveSpace);
      observer.observe(canvas);
      observer.observe(explanation);
    }

    function toggleText(openText) {
      if (openText) close(false);
      textOpen = openText;
      page.classList.toggle('ji-text-open', textOpen);
      textToggle.setAttribute('aria-expanded', String(textOpen));
      textToggle.textContent = textOpen ? 'Voltar ao mapa interativo' : 'Ver percurso em texto';
    }
    textToggle.addEventListener('click', () => toggleText(!textOpen));
    window.addEventListener('resize', () => {
      if (!matchMedia('(max-width: 860px)').matches && textOpen) toggleText(false);
      reserveSpace();
    });
    page.classList.add('ji-enhanced');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once: true});
  else start();
  // Segunda tentativa apenas para CSS carregado depois do DOM; a inicialização
  // é idempotente e só ocorre se dados, SVG e estilos estiverem disponíveis.
  window.addEventListener('load', start, {once: true});
})();
