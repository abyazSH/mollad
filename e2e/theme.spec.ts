import { test, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { colorContrast } from '../src/lib/category-colors';

test.skip(
  !process.env.E2E_SESSION_TOKEN,
  'Requires an existing authenticated session.',
);
test('tema terang hijau dan tema gelap hitam-pink konsisten di desktop dan HP', async ({
  page,
  context,
  baseURL,
}) => {
  await context.addCookies([
    {
      name: 'm-session',
      value: process.env.E2E_SESSION_TOKEN!,
      url: baseURL!,
      httpOnly: true,
      sameSite: 'Lax',
    },
  ]);
  await mkdir('.cache/previews', { recursive: true });
  for (const theme of ['light', 'dark']) {
    await page.goto('/profil');
    await expect(page.locator('#main')).toHaveAttribute('aria-busy', 'false');
    await page.getByLabel('Tampilan', { exact: true }).selectOption(theme);
    for (const width of [390, 1440]) {
      await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
      await page.goto('/dashboard');
      await expect(page.locator('#main')).toHaveAttribute('aria-busy', 'false');
      const colors = await page.evaluate(() => ({
        canvas: getComputedStyle(document.body).backgroundColor,
        button: getComputedStyle(document.querySelector('#main .button')!)
          .backgroundColor,
        heroText: getComputedStyle(document.querySelector('.balance-hero p')!)
          .color,
        logo: getComputedStyle(
          document.querySelector('svg[aria-label="Logo mollad"] rect')!,
        ).fill,
        income: getComputedStyle(document.documentElement)
          .getPropertyValue('--chart-income')
          .trim(),
        expense: getComputedStyle(document.documentElement)
          .getPropertyValue('--chart-expense')
          .trim(),
      }));
      expect(colors.canvas).toBe(
        theme === 'light' ? 'rgb(252, 254, 253)' : 'rgb(9, 9, 11)',
      );
      expect(colors.button).toBe(
        theme === 'light' ? 'rgb(70, 180, 160)' : 'rgb(196, 75, 124)',
      );
      expect(colors.logo).toBe(colors.button);
      expect(colors.heroText).toBe(
        theme === 'light' ? 'rgb(56, 90, 85)' : 'rgb(255, 237, 245)',
      );
      expect(colors.income).toBe(theme === 'light' ? '#087f5b' : '#67e8f9');
      expect(colors.expense).toBe(theme === 'light' ? '#c05a12' : '#ff8fb8');
      for (const color of [colors.income, colors.expense]) {
        expect(
          colorContrast(color, theme === 'light' ? '#FFFFFF' : '#151316'),
        ).toBeGreaterThanOrEqual(3);
      }
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      await page.screenshot({
        path: `.cache/previews/theme-${theme}-${width}.png`,
        fullPage: true,
      });
    }
    for (const route of ['/dompet', '/anggaran', '/transaksi', '/profil']) {
      await page.goto(route);
      await expect(page.locator('#main')).toHaveAttribute('aria-busy', 'false');
      expect(
        await page
          .locator('body')
          .evaluate((el) => getComputedStyle(el).backgroundColor),
      ).toBe(theme === 'light' ? 'rgb(252, 254, 253)' : 'rgb(9, 9, 11)');
    }
  }
  await page.reload();
  await expect(page.locator('html')).toHaveClass(/dark/);
});
