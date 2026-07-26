import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const WCAG_TAGS = [
  'wcag2a',
  'wcag2aa',
  'wcag21a',
  'wcag21aa',
  'wcag22aa',
];

function maximumDurationMs(value) {
  return Math.max(
    ...value.split(',').map((part) => {
      const duration = part.trim();
      if (duration.endsWith('ms')) return Number.parseFloat(duration);
      if (duration.endsWith('s')) return Number.parseFloat(duration) * 1_000;
      return Number.POSITIVE_INFINITY;
    }),
  );
}

async function expectNoOverflow(page) {
  const measurements = await page.evaluate(() => {
    const root = document.documentElement;
    const body = document.body;
    return {
      rootClientWidth: root.clientWidth,
      rootScrollWidth: root.scrollWidth,
      bodyClientWidth: body.clientWidth,
      bodyScrollWidth: body.scrollWidth,
    };
  });
  expect(measurements.rootScrollWidth, JSON.stringify(measurements)).toBeLessThanOrEqual(
    measurements.rootClientWidth,
  );
  expect(measurements.bodyScrollWidth, JSON.stringify(measurements)).toBeLessThanOrEqual(
    measurements.bodyClientWidth,
  );
}

async function expectNoWcagViolations(page, include) {
  let builder = new AxeBuilder({ page }).withTags(WCAG_TAGS);
  if (include) builder = builder.include(include);
  const result = await builder.analyze();
  expect(
    result.violations,
    result.violations
      .map((violation) => `${violation.id}: ${violation.nodes.flatMap((node) => node.target).join(', ')}`)
      .join('\n'),
  ).toEqual([]);
}

test('reflow a 320 CSS px respeita redução de movimento e mantém ações acessíveis', async ({
  page,
}) => {
  const externalRequests = [];
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (
      (url.protocol === 'http:' || url.protocol === 'https:') &&
      url.origin !== 'http://127.0.0.1:4180'
    ) {
      externalRequests.push(`${request.method()} ${url.origin}${url.pathname}`);
    }
  });

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/documentos/?portal=unimed');
  await expect(page.locator('.docs-card')).toHaveCount(2);
  expect(
    await page.evaluate(() =>
      globalThis.matchMedia('(prefers-reduced-motion: reduce)').matches,
    ),
  ).toBe(true);

  const motion = await page.evaluate(() => {
    const transitionTarget = document.querySelector('.docs-nav__item');
    const animationTarget = document.querySelector('.docs-state__indicator');
    return {
      animationDuration: getComputedStyle(animationTarget).animationDuration,
      scrollBehavior: getComputedStyle(document.documentElement).scrollBehavior,
      transitionDuration: getComputedStyle(transitionTarget).transitionDuration,
    };
  });
  expect(maximumDurationMs(motion.animationDuration)).toBeLessThanOrEqual(0.001);
  expect(maximumDurationMs(motion.transitionDuration)).toBeLessThanOrEqual(0.001);
  expect(motion.scrollBehavior).toBe('auto');

  for (const control of [
    page.getByRole('searchbox', { name: 'Buscar Documentos' }),
    page.getByRole('button', { name: 'Buscar' }),
    page.getByRole('button', { name: 'Aplicar Filtros' }),
    page.getByRole('button', { name: 'Carregar Mais' }),
    page.getByRole('button', { name: 'Enviar Documento' }),
    page.getByRole('button', { name: 'Ver detalhes de Manual Seguro em PDF' }),
    page.getByRole('button', { name: 'Favoritar: Manual Seguro em PDF' }),
  ]) {
    await expect(control).toBeVisible();
    await expect(control).toBeEnabled();
  }

  await expectNoOverflow(page);
  await expectNoWcagViolations(page);

  const uploadButton = page.getByRole('button', { name: 'Enviar Documento' });
  await uploadButton.focus();
  await page.keyboard.press('Enter');
  const dialog = page.locator('#docs-upload-dialog');
  await expect(dialog).toBeVisible();
  await expect(page.locator('#docs-upload-document-title')).toBeFocused();
  await expectNoOverflow(page);
  await expectNoWcagViolations(page, '#docs-upload-dialog');

  const controlsFitViewport = await dialog
    .locator(
      'button:not([hidden]), input:not([hidden]), textarea:not([hidden]), select:not([hidden])',
    )
    .evaluateAll((elements) => {
      const viewportWidth = document.documentElement.clientWidth;
      return elements
        .filter((element) => !element.disabled && element.getClientRects().length > 0)
        .every((element) => {
          const rect = element.getBoundingClientRect();
          return rect.left >= -0.5 && rect.right <= viewportWidth + 0.5;
        });
    });
  expect(controlsFitViewport).toBe(true);

  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(uploadButton).toBeFocused();
  expect(externalRequests).toEqual([]);
});
