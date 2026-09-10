/* Camada progressiva sobre o SVG oficial. Sem dependências, rede ou autenticação.
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

    const help = make('p', 'ji-help', 'O mapa se ajusta à largura da página. Passe o cursor, toque ou escolha uma etapa para ver a explicação. Para ampliar os detalhes, use Abrir imagem ou o zoom do navegador. Esc fecha a explicação.');
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
      target.setAttribute('aria-haspopup', 'dialog');
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

    const popup = make('div', 'ji-popover');
    popup.id = 'ji-explanation';
    popup.hidden = true;
    popup.tabIndex = -1;
    popup.setAttribute('role', 'dialog');
    popup.setAttribute('aria-modal', 'false');
    popup.setAttribute('aria-labelledby', 'ji-explanation-title');
    popup.setAttribute('aria-describedby', 'ji-explanation-body');
    const popupTop = make('div', 'ji-popover-top');
    const popupTitle = make('h2', 'ji-popover-title');
    popupTitle.id = 'ji-explanation-title';
    const close = button('ji-close', '×', 'Fechar explicação');
    const popupBody = make('p', 'ji-popover-body');
    popupBody.id = 'ji-explanation-body';
    popupTop.append(popupTitle, close);
    popup.append(popupTop, popupBody);

    // Mover o nó conserva o SVG, seus atributos, textos, definições e referências.
    canvas.append(svg, hotspots);
    frame.append(canvas);
    frame.before(controls, help, pickerLabel);
    frame.setAttribute('role', 'region');
    frame.setAttribute('aria-label', 'Mapa interativo da jornada. Use Tab para explorar as etapas.');
    frame.setAttribute('aria-describedby', help.id);
    document.body.append(popup);

    let active = null;
    let pinned = false;
    let origin = null;
    let timer = 0;
    let animation = 0;
    let suppressFocus = null;
    let textOpen = false;

    function cancelClose() { window.clearTimeout(timer); }
    function dismiss(restoreFocus) {
      cancelClose();
      const previous = active && pointButtons.get(active.id);
      if (previous) {
        previous.classList.remove('ji-active');
        previous.setAttribute('aria-expanded', 'false');
        previous.removeAttribute('aria-describedby');
      }
      const destination = origin;
      const focusWasInside = popup.contains(document.activeElement);
      popup.hidden = true;
      active = null;
      pinned = false;
      origin = null;
      picker.value = '';
      picker.setAttribute('aria-describedby', help.id);
      if (restoreFocus && focusWasInside && destination && destination.isConnected && page.classList.contains('active')) {
        suppressFocus = destination;
        destination.focus({preventScroll: true});
        suppressFocus = null;
      }
    }
    function scheduleClose() {
      cancelClose();
      timer = window.setTimeout(() => {
        const anchor = active && pointButtons.get(active.id);
        if (!pinned && document.activeElement !== anchor && !popup.contains(document.activeElement)) dismiss(false);
      }, 180);
    }
    function positionPopup() {
      animation = 0;
      if (!active || popup.hidden) return;
      const anchor = pointButtons.get(active.id);
      if (!anchor || !page.classList.contains('active') || (textOpen && matchMedia('(max-width: 860px)').matches)) { dismiss(false); return; }
      const rect = anchor.getBoundingClientRect();
      const clip = frame.getBoundingClientRect();
      const viewport = window.visualViewport;
      const leftEdge = viewport ? viewport.offsetLeft : 0;
      const topEdge = viewport ? viewport.offsetTop : 0;
      const viewWidth = viewport ? viewport.width : document.documentElement.clientWidth;
      const viewHeight = viewport ? viewport.height : window.innerHeight;
      const rightEdge = leftEdge + viewWidth;
      const bottomEdge = topEdge + viewHeight;
      if (rect.right <= Math.max(clip.left, leftEdge) || rect.left >= Math.min(clip.right, rightEdge) || rect.bottom <= Math.max(clip.top, topEdge) || rect.top >= Math.min(clip.bottom, bottomEdge)) { dismiss(false); return; }
      const nav = document.querySelector('.nav');
      const navRect = nav && nav.getBoundingClientRect();
      const safeTop = Math.max(topEdge + 12, navRect && navRect.top <= topEdge + 1 && navRect.bottom > topEdge ? navRect.bottom + 8 : topEdge + 12);
      popup.style.maxWidth = `${Math.max(1, Math.min(380, viewWidth - 24))}px`;
      popup.style.maxHeight = `${Math.max(1, bottomEdge - safeTop - 12)}px`;
      const size = popup.getBoundingClientRect();
      const left = Math.max(leftEdge + 12, Math.min(rect.left, rightEdge - size.width - 12));
      let top = rect.bottom + 10;
      if (top + size.height > bottomEdge - 12) top = rect.top - size.height - 10;
      top = Math.max(safeTop, Math.min(top, bottomEdge - size.height - 12));
      popup.style.left = `${left}px`;
      popup.style.top = `${top}px`;
      popup.style.visibility = 'visible';
    }
    function queuePosition() {
      if (active && !animation) animation = requestAnimationFrame(positionPopup);
    }
    function reveal(point, target, shouldPin, focusPanel) {
      cancelClose();
      if (active && active.id !== point.id) {
        const previous = pointButtons.get(active.id);
        previous.classList.remove('ji-active');
        previous.setAttribute('aria-expanded', 'false');
        previous.removeAttribute('aria-describedby');
      }
      active = point;
      pinned = shouldPin;
      origin = target;
      const anchor = pointButtons.get(point.id);
      anchor.classList.add('ji-active');
      anchor.setAttribute('aria-expanded', 'true');
      anchor.setAttribute('aria-describedby', popupBody.id);
      picker.value = point.id;
      picker.setAttribute('aria-describedby', `${help.id} ${popupBody.id}`);
      popupTitle.textContent = point.title;
      popupBody.textContent = point.body;
      popup.style.visibility = 'hidden';
      popup.hidden = false;
      positionPopup();
      if (focusPanel && !popup.hidden) popup.focus({preventScroll: true});
    }
    picker.addEventListener('change', () => {
      const point = points.find(item => item.id === picker.value);
      if (!point) { dismiss(false); return; }
      const anchor = pointButtons.get(point.id);
      // Centraliza também a página, sem animação, mantendo o seletor como origem.
      anchor.scrollIntoView({block: 'center', inline: 'nearest', behavior: 'instant'});
      reveal(point, picker, true, false);
    });
    for (const point of points) {
      const target = pointButtons.get(point.id);
      target.addEventListener('pointerenter', event => {
        if (event.pointerType === 'mouse' && !pinned) reveal(point, target, false, false);
      });
      target.addEventListener('pointerleave', scheduleClose);
      target.addEventListener('focus', () => {
        if (suppressFocus !== target) reveal(point, target, false, false);
      });
      target.addEventListener('blur', scheduleClose);
      target.addEventListener('click', event => {
        if (active && active.id === point.id && pinned) dismiss(false);
        else reveal(point, target, true, event.detail === 0);
      });
    }
    popup.addEventListener('pointerenter', cancelClose);
    popup.addEventListener('pointerleave', scheduleClose);
    popup.addEventListener('focusin', cancelClose);
    popup.addEventListener('focusout', scheduleClose);
    close.addEventListener('click', () => dismiss(true));
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && active) {
        if (popup.contains(document.activeElement)) event.preventDefault();
        dismiss(true);
      }
    });
    document.addEventListener('pointerdown', event => {
      if (active && event.target instanceof Element && !popup.contains(event.target) && !event.target.closest('.ji-hotspot')) dismiss(false);
    }, true);
    document.querySelectorAll('.nav [data-go]').forEach(target => {
      target.addEventListener('click', () => { if (target.getAttribute('data-go') !== '1') dismiss(false); });
    });
    new MutationObserver(() => {
      if (!page.classList.contains('active')) dismiss(false);
      else queuePosition();
    }).observe(page, {attributes: true, attributeFilter: ['class']});

    function toggleText(openText) {
      dismiss(false);
      textOpen = openText;
      page.classList.toggle('ji-text-open', textOpen);
      textToggle.setAttribute('aria-expanded', String(textOpen));
      textToggle.textContent = textOpen ? 'Voltar ao mapa interativo' : 'Ver percurso em texto';
    }
    textToggle.addEventListener('click', () => toggleText(!textOpen));
    const resized = () => {
      if (!matchMedia('(max-width: 860px)').matches && textOpen) toggleText(false);
      queuePosition();
    };
    window.addEventListener('resize', resized);
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', queuePosition);
      window.visualViewport.addEventListener('scroll', queuePosition);
    }
    document.addEventListener('scroll', queuePosition, true);
    page.classList.add('ji-enhanced');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once: true});
  else start();
  // Segunda tentativa apenas para CSS carregado depois do DOM; a inicialização
  // é idempotente e só ocorre se dados, SVG e estilos estiverem disponíveis.
  window.addEventListener('load', start, {once: true});
})();
