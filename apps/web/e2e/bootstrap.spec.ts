import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import en from '../src/shared/i18n/messages/bootstrap.en.json';
import hi from '../src/shared/i18n/messages/bootstrap.hi.json';

test('@bootstrap English root GET and HEAD do not redirect to themselves', async ({
  request,
}) => {
  for (const method of ['GET', 'HEAD']) {
    const response = await request.fetch('/', { method, maxRedirects: 0 });
    expect(response.status(), `${method} / must render the English shell`).toBe(
      200,
    );
    expect(response.headers().location).toBeUndefined();
    if (method === 'GET') {
      expect(await response.text()).toMatch(/<html[^>]+lang="en"/);
    }
  }
  const canonical = await request.get('/en', { maxRedirects: 0 });
  expect(canonical.status()).toBe(308);
  expect(new URL(canonical.headers().location!, canonical.url()).pathname).toBe(
    '/',
  );
  const hindi = await request.get('/hi', { maxRedirects: 0 });
  expect(hindi.status()).toBe(200);
});

test('@bootstrap real API proxy: alive, explicitly not ready until C01/C02', async ({
  request,
}) => {
  const live = await request.get('/api/health/live');
  expect(live.status()).toBe(200);
  const ready = await request.get('/api/health/ready');
  expect(ready.status()).toBe(503);
  expect(
    await request
      .get('/api/api/health/live')
      .then((response) => response.status()),
  ).toBe(404);
});

for (const [locale, messages] of [
  ['en', en],
  ['hi', hi],
] as const) {
  for (const theme of ['light', 'dark'] as const) {
    test(`@bootstrap ${locale} ${theme} public shells, keyboard and screenshots`, async ({
      page,
      context,
      baseURL,
    }, testInfo) => {
      await context.addCookies([
        { name: 'apnatown-theme', value: theme, url: baseURL! },
      ]);
      const prefix = locale === 'hi' ? '/hi' : '';
      for (const [path, key] of [
        ['/', 'empty'],
        ['/404', 'notFound'],
        ['/500', 'error'],
        ['/offline', 'offline'],
        ['/maintenance', 'maintenance'],
      ] as const) {
        const response = await page.goto(
          prefix + (path === '/' ? '' : path) || '/',
        );
        expect(response?.status()).toBe(path === '/404' ? 404 : 200);
        expect(response?.headers()['content-security-policy']).toContain(
          "'nonce-",
        );
        expect(response?.headers()['content-security-policy']).not.toContain(
          'unsafe-inline',
        );
        await expect(page.locator('html')).toHaveAttribute('lang', locale);
        await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
        await expect(page.getByRole('heading', { level: 1 })).toHaveText(
          messages.common[key].title,
        );
        await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
          'content',
          /noindex/,
        );
        await page.evaluate(() => document.fonts.ready);
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        ).toBe(true);
        expect((await new AxeBuilder({ page }).analyze()).violations).toEqual(
          [],
        );
        await expect(page).toHaveScreenshot(`${locale}-${theme}-${key}.png`, {
          fullPage: true,
          animations: 'disabled',
        });
        await testInfo.attach(`${locale}-${theme}-${key}`, {
          body: await page.screenshot({ fullPage: true }),
          contentType: 'image/png',
        });
        await page.keyboard.press('Tab');
        const skip = page.getByRole('link', {
          name: messages.common.navigation.skipToContent,
        });
        await expect(skip).toBeFocused();
        await expect(skip).toBeVisible();
        await expect(skip).toHaveCSS('outline-width', '3px');
        const box = await skip.boundingBox();
        expect(box).not.toBeNull();
        expect(box!.height).toBeGreaterThanOrEqual(48);
        expect(box!.x).toBeGreaterThanOrEqual(0);
        expect(box!.x + box!.width).toBeLessThanOrEqual(
          page.viewportSize()!.width,
        );
        await page.keyboard.press('Enter');
        await expect(page.locator('#main')).toBeFocused();
        await page.keyboard.press('Tab');
        await expect(
          page.locator('main').locator('a, button').first(),
        ).toBeFocused();
      }
    });
  }
}

test('J13 shell language/Back and theme auto/reduced motion', async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
  await page.goto('/500?retry=1#main');
  await page.getByRole('link', { name: en.common.language.label }).click();
  await expect(page).toHaveURL(/\/hi\/500\?retry=1#main$/);
  await page.goBack();
  await expect(page).toHaveURL(/\/500\?retry=1#main$/);
  await page
    .getByRole('combobox', { name: en.common.theme.label })
    .selectOption('auto');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'auto');
  expect(
    await page
      .locator('body')
      .evaluate((element) => getComputedStyle(element).backgroundColor),
  ).toBe('rgb(20, 17, 13)');
  expect(
    await page
      .getByRole('button', { name: en.common.actions.retry })
      .evaluate((element) => getComputedStyle(element).transitionDuration),
  ).toBe('0s');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'auto');
});

test('canonical English redirect and invalid/private Hindi paths stay unavailable', async ({
  page,
  request,
}) => {
  const redirect = await request.get('/en/500?retry=1', { maxRedirects: 0 });
  expect(redirect.status()).toBe(308);
  expect(redirect.headers().location).toMatch(/\/500\?retry=1$/);
  const normalized = await request.get('/en/500/?retry=1', { maxRedirects: 0 });
  expect(normalized.status()).toBe(308);
  expect(normalized.headers().location).toMatch(/\/500\?retry=1$/);
  for (const path of ['/fr', '/hi/account', '/hi/admin', '/does-not-exist']) {
    expect((await page.goto(path))?.status()).toBe(404);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      'content',
      /noindex/,
    );
  }
});
