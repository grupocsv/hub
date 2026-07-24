const CLASSIFICATION_LABELS = Object.freeze({
  public: 'Público',
  internal: 'Interno',
  restricted: 'Restrito',
  confidential: 'Confidencial',
});
const LIFECYCLE_LABELS = Object.freeze({
  draft: 'Rascunho',
  active: 'Ativo',
  archived: 'Arquivado',
  deletion_requested: 'Exclusão Solicitada',
  deleting: 'Em Exclusão',
  deleted: 'Excluído',
});
const ACTIONS = Object.freeze([
  Object.freeze({ id: 'open', label: 'Abrir Documento' }),
  Object.freeze({ id: 'favorite', label: 'Favoritar' }),
  Object.freeze({ id: 'edit', label: 'Editar Metadados' }),
  Object.freeze({ id: 'archive', label: 'Arquivar' }),
  Object.freeze({ id: 'restore', label: 'Restaurar' }),
  Object.freeze({ id: 'requestDeletion', label: 'Solicitar Exclusão' }),
]);

function plainObject(value) {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function catalogItem(value) {
  const searchResult = value?.source === 'search';
  if (
    !plainObject(value) ||
    typeof value.documentId !== 'string' ||
    typeof value.title !== 'string' ||
    (searchResult ? typeof value.excerpt !== 'string' : typeof value.description !== 'string') ||
    (!searchResult && typeof value.classification !== 'string') ||
    (!searchResult && typeof value.lifecycleStatus !== 'string') ||
    (!searchResult && typeof value.updatedAt !== 'string') ||
    (searchResult ? value.favorite !== null : typeof value.favorite !== 'boolean')
  ) {
    throw new TypeError('Item de catálogo inválido.');
  }
  return Object.freeze({
    ...value,
    description: searchResult ? value.excerpt : value.description,
    classificationLabel: searchResult ? 'Resultado da Busca' : CLASSIFICATION_LABELS[value.classification] ?? 'Não Classificado',
    lifecycleLabel: searchResult ? '' : LIFECYCLE_LABELS[value.lifecycleStatus] ?? 'Estado Indisponível',
    isSearchResult: searchResult,
  });
}

export function buildCatalogViewModel(state) {
  if (!plainObject(state) || !['loading', 'ready', 'empty', 'error'].includes(state.status)) {
    throw new TypeError('Estado de catálogo inválido.');
  }
  const items = Array.isArray(state.items) ? state.items.map(catalogItem) : [];
  if (state.status === 'ready' && items.length === 0) {
    throw new TypeError('Estado de catálogo inválido.');
  }
  return Object.freeze({
    status: state.status,
    mode: state.mode ?? 'catalog',
    items: Object.freeze(items),
    hasNextPage: typeof state.nextCursor === 'string' && state.nextCursor.length > 0,
  });
}

export function buildDetailViewModel(state, versions = []) {
  if (!plainObject(state) || !['loading', 'ready', 'saving', 'conflict', 'error'].includes(state.status)) {
    throw new TypeError('Estado de detalhe inválido.');
  }
  const document = state.detail?.document ?? null;
  const actions = state.actions ?? {};
  if (document !== null && !plainObject(document)) {
    throw new TypeError('Estado de detalhe inválido.');
  }
  const visibleActions = ACTIONS.filter((action) => actions[action.id] === true).map((action) =>
    Object.freeze({
      ...action,
      label:
        action.id === 'favorite' && state.favorite === true
          ? 'Remover dos Favoritos'
          : action.label,
    }),
  );
  const normalizedVersions = versions.map((version) => {
    if (!plainObject(version) || typeof version.versionId !== 'string') {
      throw new TypeError('Versão documental inválida.');
    }
    return Object.freeze({
      ...version,
      canPromote:
        actions.promoteVersion === true && version.publicationStatus === 'eligible',
    });
  });
  return Object.freeze({
    status: state.status,
    document,
    favorite: state.favorite === true,
    actions: Object.freeze(visibleActions),
    versions: Object.freeze(normalizedVersions),
    busy: state.status === 'loading' || state.status === 'saving',
  });
}

function appendTextElement(documentRef, parent, tagName, className, text) {
  const element = documentRef.createElement(tagName);
  if (className) element.className = className;
  element.textContent = text;
  parent.append(element);
  return element;
}

function button(documentRef, label, action, options = {}) {
  const element = documentRef.createElement('button');
  element.type = options.type ?? 'button';
  element.className = options.className ?? 'docs-button docs-button--secondary';
  element.textContent = label;
  element.dataset.action = action;
  if (options.documentId) element.dataset.documentId = options.documentId;
  if (options.versionId) element.dataset.versionId = options.versionId;
  if (options.disabled) element.disabled = true;
  return element;
}

function formatDate(value) {
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));
  } catch {
    return 'Data Indisponível';
  }
}

export function createDocumentosView(options = {}) {
  const documentRef = options.documentRef ?? globalThis.document;
  const renderState = options.renderState ?? (() => {});
  if (!documentRef?.querySelector || typeof renderState !== 'function') {
    throw new TypeError('Dependências obrigatórias da apresentação estão ausentes.');
  }

  const content = documentRef.querySelector('#docs-content');
  const loadMore = documentRef.querySelector('#docs-load-more');
  const detailRoot = documentRef.querySelector('#docs-detail');
  const detailPanel = detailRoot?.querySelector('.docs-dialog__panel');
  const detailTitle = documentRef.querySelector('#docs-detail-title');
  const detailContent = documentRef.querySelector('#docs-detail-content');
  const detailActions = documentRef.querySelector('#docs-detail-actions');
  const versionList = documentRef.querySelector('#docs-version-list');
  const filtersForm = documentRef.querySelector('.docs-filters__form');
  const searchForm = documentRef.querySelector('.docs-search');
  const searchInput = documentRef.querySelector('#docs-search');
  const collectionFilter = documentRef.querySelector('#docs-collection-filter');
  const tagFilter = documentRef.querySelector('#docs-tag-filter');
  const classificationFilter = documentRef.querySelector('#docs-classification-filter');
  const lifecycleFilter = documentRef.querySelector('#docs-lifecycle-filter');
  if (!content || !loadMore || !detailRoot || !detailPanel || !detailContent || !detailActions || !versionList) {
    throw new TypeError('Shell de apresentação incompleto.');
  }

  let boundHandlers = null;
  let previousFocus = null;
  let lastDetailState = null;
  let versions = Object.freeze([]);
  let cleanup = [];

  function listen(target, event, handler) {
    target?.addEventListener?.(event, handler);
    cleanup.push(() => target?.removeEventListener?.(event, handler));
  }

  function replaceSelectOptions(select, items, valueKey, labelKey, initialLabel) {
    if (!select) return;
    const selected = select.value;
    select.replaceChildren();
    const initial = documentRef.createElement('option');
    initial.value = '';
    initial.textContent = initialLabel;
    select.append(initial);
    for (const item of items) {
      const option = documentRef.createElement('option');
      option.value = item[valueKey];
      option.textContent = item[labelKey];
      select.append(option);
    }
    if ([...select.options].some((option) => option.value === selected)) select.value = selected;
  }

  function setMetadata(metadata) {
    replaceSelectOptions(
      collectionFilter,
      metadata.collections,
      'collectionId',
      'name',
      'Todas as Coleções',
    );
    replaceSelectOptions(tagFilter, metadata.tags, 'tagId', 'name', 'Todas as Tags');
  }

  function showContent() {
    const status = documentRef.querySelector('#docs-status');
    if (status) status.hidden = true;
    content.hidden = false;
  }

  function renderCatalog(state) {
    const model = buildCatalogViewModel(state);
    if (model.status === 'loading') {
      renderState('loading', undefined, { controlsEnabled: true });
      return;
    }
    if (model.status === 'empty') {
      renderState('empty', undefined, { controlsEnabled: true });
      loadMore.hidden = true;
      return;
    }
    if (model.status === 'error') {
      renderState('error', undefined, { controlsEnabled: true });
      loadMore.hidden = true;
      return;
    }

    content.replaceChildren();
    const grid = documentRef.createElement('div');
    grid.className = 'docs-card-grid';
    for (const item of model.items) {
      const article = documentRef.createElement('article');
      article.className = 'docs-card';
      article.dataset.documentId = item.documentId;

      const header = documentRef.createElement('div');
      header.className = 'docs-card__header';
      appendTextElement(documentRef, header, 'span', 'docs-badge', item.classificationLabel);
      if (item.lifecycleLabel) {
        appendTextElement(documentRef, header, 'span', 'docs-card__status', item.lifecycleLabel);
      }
      article.append(header);

      appendTextElement(documentRef, article, 'h3', '', item.title);
      appendTextElement(documentRef, article, 'p', 'docs-card__description', item.description || 'Sem descrição.');
      if (item.updatedAt) {
        appendTextElement(
          documentRef,
          article,
          'p',
          'docs-card__date',
          `Atualizado em ${formatDate(item.updatedAt)}`,
        );
      }

      const actions = documentRef.createElement('div');
      actions.className = 'docs-card__actions';
      actions.append(
        button(documentRef, 'Ver Detalhes', 'open-detail', {
          documentId: item.documentId,
          className: 'docs-button docs-button--secondary',
        }),
      );
      if (typeof item.favorite === 'boolean') {
        const favoriteButton = button(
          documentRef,
          item.favorite ? 'Remover dos Favoritos' : 'Favoritar',
          'toggle-card-favorite',
          { documentId: item.documentId },
        );
        favoriteButton.dataset.favorite = String(item.favorite);
        actions.append(favoriteButton);
      }
      article.append(actions);
      grid.append(article);
    }
    content.append(grid);
    showContent();
    loadMore.hidden = !model.hasNextPage;
    loadMore.disabled = !model.hasNextPage;
  }

  function closeDetail() {
    if (detailRoot.hidden) return;
    detailRoot.hidden = true;
    documentRef.body?.classList?.remove('is-dialog-open');
    previousFocus?.focus?.();
    previousFocus = null;
  }

  function openDetail() {
    if (!detailRoot.hidden) return;
    previousFocus = documentRef.activeElement;
    detailRoot.hidden = false;
    documentRef.body?.classList?.add('is-dialog-open');
    detailPanel.focus();
  }

  function detailField(list, label, value) {
    const wrapper = documentRef.createElement('div');
    wrapper.className = 'docs-detail-field';
    appendTextElement(documentRef, wrapper, 'dt', '', label);
    appendTextElement(documentRef, wrapper, 'dd', '', value || 'Não Informado');
    list.append(wrapper);
  }

  function renderEditForm(document) {
    const form = documentRef.createElement('form');
    form.id = 'docs-edit-form';
    form.className = 'docs-inline-form';
    const titleLabel = appendTextElement(documentRef, form, 'label', '', 'Título');
    const title = documentRef.createElement('input');
    title.name = 'title';
    title.required = true;
    title.maxLength = 500;
    title.value = document.title;
    titleLabel.append(title);
    const descriptionLabel = appendTextElement(documentRef, form, 'label', '', 'Descrição');
    const description = documentRef.createElement('textarea');
    description.name = 'description';
    description.maxLength = 4000;
    description.value = document.description;
    descriptionLabel.append(description);
    form.append(button(documentRef, 'Salvar Alterações', 'save-metadata', { type: 'submit' }));
    detailContent.append(form);
    title.focus();
  }

  function renderDeletionForm() {
    const form = documentRef.createElement('form');
    form.id = 'docs-deletion-form';
    form.className = 'docs-inline-form';
    const reasonLabel = appendTextElement(documentRef, form, 'label', '', 'Motivo da Solicitação');
    const reason = documentRef.createElement('textarea');
    reason.name = 'reason';
    reason.required = true;
    reason.maxLength = 2000;
    reasonLabel.append(reason);
    form.append(button(documentRef, 'Confirmar Solicitação', 'confirm-deletion', { type: 'submit' }));
    detailContent.append(form);
    reason.focus();
  }

  function renderVersions(items = versions) {
    versions = Object.freeze([...items]);
    versionList.replaceChildren();
    if (versions.length === 0) {
      appendTextElement(documentRef, versionList, 'p', 'docs-muted', 'Nenhuma versão disponível.');
      return;
    }
    const list = documentRef.createElement('ul');
    list.className = 'docs-version-list';
    const model = lastDetailState ? buildDetailViewModel(lastDetailState, versions) : null;
    for (const version of model?.versions ?? versions) {
      const item = documentRef.createElement('li');
      appendTextElement(
        documentRef,
        item,
        'span',
        '',
        `Versão ${version.versionNumber ?? version.versionId} — ${version.publicationStatus}`,
      );
      if (version.canPromote) {
        item.append(
          button(documentRef, 'Promover', 'promote-version', { versionId: version.versionId }),
        );
      }
      list.append(item);
    }
    versionList.append(list);
  }

  function renderDetail(state) {
    lastDetailState = state;
    const model = buildDetailViewModel(state, versions);
    if (!model.document) {
      if (state.status === 'loading') {
        detailContent.replaceChildren();
        appendTextElement(documentRef, detailContent, 'p', 'docs-muted', 'Carregando Detalhes.');
        openDetail();
      }
      return;
    }
    if (detailTitle) detailTitle.textContent = model.document.title;
    detailContent.replaceChildren();
    const description = appendTextElement(
      documentRef,
      detailContent,
      'p',
      'docs-detail-description',
      model.document.description || 'Sem descrição.',
    );
    description.id = 'docs-detail-description';
    const list = documentRef.createElement('dl');
    list.className = 'docs-detail-list';
    detailField(list, 'Classificação', CLASSIFICATION_LABELS[model.document.classification]);
    detailField(list, 'Estado', LIFECYCLE_LABELS[model.document.lifecycleStatus]);
    detailField(list, 'Política de Indexação', model.document.indexingPolicy);
    detailField(list, 'Última Atualização', formatDate(model.document.updatedAt));
    detailContent.append(list);

    detailActions.replaceChildren();
    for (const action of model.actions) {
      const actionButton = button(documentRef, action.label, action.id, {
        disabled: model.busy,
        className:
          action.id === 'requestDeletion'
            ? 'docs-button docs-button--danger'
            : 'docs-button docs-button--secondary',
      });
      if (action.id === 'favorite') actionButton.dataset.favorite = String(model.favorite);
      detailActions.append(actionButton);
    }
    renderVersions(model.versions);
    openDetail();
  }

  function renderRecent(items) {
    renderCatalog({
      status: items.length === 0 ? 'empty' : 'ready',
      mode: 'recent',
      items,
      nextCursor: null,
    });
  }

  function renderCollections(items) {
    if (items.length === 0) {
      renderState('empty', 'Nenhuma coleção está disponível.', { controlsEnabled: true });
      return;
    }
    content.replaceChildren();
    const list = documentRef.createElement('div');
    list.className = 'docs-collection-grid';
    for (const item of items) {
      const card = documentRef.createElement('article');
      card.className = 'docs-collection-card';
      appendTextElement(documentRef, card, 'h3', '', item.name);
      const open = button(documentRef, 'Ver Documentos', 'open-collection');
      open.dataset.collectionId = item.collectionId;
      card.append(open);
      list.append(card);
    }
    content.append(list);
    showContent();
    loadMore.hidden = true;
  }

  function formFilters() {
    const filters = {};
    for (const select of [collectionFilter, tagFilter, classificationFilter, lifecycleFilter]) {
      if (select?.value) filters[select.name] = select.value;
    }
    return filters;
  }

  function bind(handlers) {
    if (boundHandlers) throw new TypeError('Apresentação já vinculada.');
    boundHandlers = handlers;

    listen(searchForm, 'submit', (event) => {
      event.preventDefault();
      const query = searchInput?.value?.trim();
      if (query) handlers.search(query);
      else handlers.navigate('documentos');
    });
    listen(filtersForm, 'submit', (event) => {
      event.preventDefault();
      handlers.applyFilters(formFilters());
    });
    listen(filtersForm, 'reset', () => {
      globalThis.queueMicrotask(() => handlers.applyFilters({}));
    });
    listen(loadMore, 'click', () => handlers.loadNext());
    for (const navigation of documentRef.querySelectorAll('[data-view]')) {
      listen(navigation, 'click', () => handlers.navigate(navigation.dataset.view));
    }
    listen(content, 'click', (event) => {
      const target = event.target.closest?.('[data-action]');
      if (!target) return;
      const documentId = target.dataset.documentId;
      if (target.dataset.action === 'open-detail') {
        const favorite = target.closest('[data-document-id]')
          ?.querySelector('[data-action="toggle-card-favorite"]')
          ?.dataset.favorite === 'true';
        handlers.openDocument(documentId, { favorite });
      }
      if (target.dataset.action === 'toggle-card-favorite') {
        handlers.openDocument(documentId, { favorite: target.dataset.favorite === 'true' }).then(() =>
          handlers.setFavorite(target.dataset.favorite !== 'true'),
        );
      }
      if (target.dataset.action === 'open-collection') {
        handlers.applyFilters({ collectionId: target.dataset.collectionId });
      }
    });
    listen(detailRoot, 'click', (event) => {
      const target = event.target.closest?.('[data-action]');
      if (!target) return;
      const action = target.dataset.action;
      if (action === 'close-detail') closeDetail();
      if (action === 'open') handlers.openViewer?.();
      if (action === 'favorite') handlers.setFavorite(target.dataset.favorite !== 'true');
      if (action === 'edit' && lastDetailState?.detail?.document) {
        renderEditForm(lastDetailState.detail.document);
      }
      if (action === 'archive') handlers.archive();
      if (action === 'restore') handlers.restore();
      if (action === 'requestDeletion') renderDeletionForm();
      if (action === 'promote-version') handlers.promoteVersion(target.dataset.versionId);
    });
    listen(detailRoot, 'submit', (event) => {
      event.preventDefault();
      const data = new FormData(event.target);
      if (event.target.id === 'docs-edit-form') {
        handlers.updateMetadata({
          title: String(data.get('title') ?? ''),
          description: String(data.get('description') ?? ''),
        });
      }
      if (event.target.id === 'docs-deletion-form') {
        handlers.requestDeletion(String(data.get('reason') ?? ''));
      }
    });
    listen(detailRoot, 'keydown', (event) => {
      if (event.key === 'Escape') closeDetail();
      if (event.key !== 'Tab') return;
      const focusable = [...detailRoot.querySelectorAll('button:not(:disabled), input, textarea, select, [tabindex]:not([tabindex="-1"])')]
        .filter((element) => !element.hidden);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable.at(-1);
      if (event.shiftKey && documentRef.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && documentRef.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });

    return () => {
      for (const remove of cleanup.splice(0)) remove();
      boundHandlers = null;
    };
  }

  return Object.freeze({
    bind,
    setMetadata,
    renderCatalog,
    renderDetail,
    renderVersions,
    renderRecent,
    renderCollections,
    clearSensitiveState() {
      closeDetail();
      content.replaceChildren();
      detailContent.replaceChildren();
      detailActions.replaceChildren();
      versionList.replaceChildren();
      loadMore.hidden = true;
      versions = Object.freeze([]);
      lastDetailState = null;
    },
    destroy() {
      for (const remove of cleanup.splice(0)) remove();
      boundHandlers = null;
      closeDetail();
    },
  });
}
