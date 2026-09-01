export const COMPASS_BRAND_CREDITS = Object.freeze({
  product: 'Compass™ — um produto do Grupo CSV',
  editorialResponsibility: 'Responsabilidade editorial: MedValor®',
  elaboration: 'Elaboração: AxiaCare®',
});

const MONTHS_PT_BR = new Map([
  ['janeiro', '01'],
  ['fevereiro', '02'],
  ['março', '03'],
  ['abril', '04'],
  ['maio', '05'],
  ['junho', '06'],
  ['julho', '07'],
  ['agosto', '08'],
  ['setembro', '09'],
  ['outubro', '10'],
  ['novembro', '11'],
  ['dezembro', '12'],
]);

function error(path, message) {
  return { path, message };
}

function parseLegacyDate(value) {
  if (!value) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const match = String(value)
    .trim()
    .toLocaleLowerCase('pt-BR')
    .match(/^(\d{1,2}) de ([a-zç]+) de (\d{4})$/u);
  if (!match) return null;
  const month = MONTHS_PT_BR.get(match[2]);
  if (!month) return null;
  return `${match[3]}-${month}-${match[1].padStart(2, '0')}`;
}

function extractLegacyIdentity(metadata) {
  const editionValue = metadata.edition ?? metadata.edicao ?? metadata.id;
  const match = String(editionValue ?? '').match(/(\d{1,3})(?:\/(\d{4}))?/);
  if (!match) throw new Error('Edição histórica sem identificador válido.');
  const number = Number.parseInt(match[1], 10);
  const year = Number.parseInt(metadata.year ?? metadata.ano ?? match[2], 10);
  if (!Number.isInteger(year)) throw new Error('Edição histórica sem ano válido.');
  return { number, year, slug: buildEditionSlug(number) };
}

export function buildEditionSlug(number) {
  if (!Number.isInteger(number) || number < 1 || number > 999) {
    throw new RangeError('O número da edição deve ser um inteiro entre 1 e 999.');
  }
  return String(number).padStart(3, '0');
}

export function normalizeEditionMetadata(metadata) {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    throw new TypeError('Os metadados da edição devem ser um objeto.');
  }

  if (metadata.schemaVersion === 2) {
    return structuredClone(metadata);
  }

  const { number, year, slug } = extractLegacyIdentity(metadata);
  const title = metadata.title ?? metadata.titulo;
  const publishedAt = parseLegacyDate(metadata.date ?? metadata.data_publicacao);

  return {
    schemaVersion: 2,
    id: `${slug}-${year}`,
    number,
    year,
    slug,
    title,
    subtitle: metadata.subtitle ?? metadata.subtitulo ?? null,
    publishedAt,
    status: metadata.status ?? 'Publicado',
    topics: structuredClone(metadata.topics ?? metadata.temas ?? []),
    tags: structuredClone(metadata.tags ?? []),
    summary: metadata.abstract ?? metadata.resumo ?? null,
    sources: structuredClone(metadata.sources ?? metadata.fontes ?? []),
    product: { name: 'Compass™', owner: 'Grupo CSV' },
    editorial: { responsible: 'MedValor®' },
    elaboration: ['AxiaCare®'],
    engine: {
      name: 'compass-v2',
      version: '2.0.0',
      templateVersion: '2.0.0',
    },
    routes: {
      web: `/compass/edicoes/${year}/${slug}/compass`,
      pdf: `/compass/edicoes/${year}/${slug}/compass_${slug}_${year}.pdf`,
    },
    artifacts: {
      source: 'compass.md',
      pdf: `compass_${slug}_${year}.pdf`,
      manifest: 'release.json',
    },
    release: {
      version: 1,
      active: metadata.status === 'Publicado' || !metadata.status,
      checksum: null,
      publishedAt,
    },
    migration: {
      state: 'adapted-legacy',
      sourceSchema: 1,
    },
  };
}

export function validateEditionMetadata(metadata) {
  const errors = [];
  const requiredStrings = [
    ['id', metadata?.id],
    ['slug', metadata?.slug],
    ['title', metadata?.title],
    ['status', metadata?.status],
    ['product.name', metadata?.product?.name],
    ['product.owner', metadata?.product?.owner],
    ['editorial.responsible', metadata?.editorial?.responsible],
    ['engine.name', metadata?.engine?.name],
    ['engine.version', metadata?.engine?.version],
    ['engine.templateVersion', metadata?.engine?.templateVersion],
    ['routes.web', metadata?.routes?.web],
    ['routes.pdf', metadata?.routes?.pdf],
    ['artifacts.source', metadata?.artifacts?.source],
    ['artifacts.pdf', metadata?.artifacts?.pdf],
    ['artifacts.manifest', metadata?.artifacts?.manifest],
    ['migration.state', metadata?.migration?.state],
  ];

  for (const [path, value] of requiredStrings) {
    if (typeof value !== 'string' || !value.trim()) errors.push(error(path, 'Campo textual obrigatório.'));
  }

  if (metadata?.schemaVersion !== 2) errors.push(error('schemaVersion', 'Deve ser 2.'));
  if (!Number.isInteger(metadata?.number) || metadata.number < 1 || metadata.number > 999) {
    errors.push(error('number', 'Número de edição inválido.'));
  }
  if (!Number.isInteger(metadata?.year) || metadata.year < 2000) errors.push(error('year', 'Ano inválido.'));
  if (metadata?.slug !== (Number.isInteger(metadata?.number) ? buildEditionSlug(metadata.number) : null)) {
    errors.push(error('slug', 'Slug deve corresponder ao número em três dígitos.'));
  }
  if (metadata?.product?.name !== 'Compass™') errors.push(error('product.name', 'Produto deve ser Compass™.'));
  if (metadata?.product?.owner !== 'Grupo CSV') errors.push(error('product.owner', 'Proprietário deve ser Grupo CSV.'));
  if (metadata?.editorial?.responsible !== 'MedValor®') {
    errors.push(error('editorial.responsible', 'Responsabilidade editorial deve ser MedValor®.'));
  }
  if (!Array.isArray(metadata?.elaboration) || !metadata.elaboration.includes('AxiaCare®')) {
    errors.push(error('elaboration', 'A elaboração deve identificar AxiaCare®.'));
  }
  if (!metadata?.release || typeof metadata.release !== 'object') errors.push(error('release', 'Release obrigatório.'));
  if (!metadata?.migration || typeof metadata.migration !== 'object') errors.push(error('migration', 'Migração obrigatória.'));

  return { valid: errors.length === 0, errors };
}

export function deriveCompassCatalog(editions) {
  if (!Array.isArray(editions)) throw new TypeError('A coleção de edições deve ser um array.');
  const seenIds = new Set();
  const seenSlugs = new Set();
  const catalog = editions.map((input) => normalizeEditionMetadata(input));

  for (const edition of catalog) {
    const validation = validateEditionMetadata(edition);
    if (!validation.valid) {
      throw new Error(`Edição inválida: ${validation.errors.map((item) => item.path).join(', ')}`);
    }
    const slugKey = `${edition.year}/${edition.slug}`;
    if (seenIds.has(edition.id) || seenSlugs.has(slugKey)) {
      throw new Error(`Edição duplicada: ${edition.id}.`);
    }
    seenIds.add(edition.id);
    seenSlugs.add(slugKey);
  }

  return catalog.sort((a, b) => b.year - a.year || b.number - a.number);
}
