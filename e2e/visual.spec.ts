import { testOrigin } from './test-origin';
import { test, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
test('tampilan desktop, mobile, dan mode gelap', async ({ page }) => {
  const headers = { origin: testOrigin };
  await page.request.post('/api/auth/login', {
    headers,
    data: { email: 'demo@m.local', password: 'DemoM2026!' },
  });
  await mkdir('.cache/previews', { recursive: true });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/dashboard');
  await expect(page.getByRole('main')).toHaveAttribute('aria-busy', 'false');
  await page.screenshot({
    path: '.cache/previews/dashboard.png',
    fullPage: true,
  });
  await page.goto('/profil');
  await expect(page.getByRole('main')).toHaveAttribute('aria-busy', 'false');
  await page.getByLabel('Tampilan', { exact: true }).selectOption('dark');
  await page.goto('/dashboard');
  await expect(page.locator('html')).toHaveClass(/dark/);
  await page.screenshot({
    path: '.cache/previews/dashboard-dark.png',
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/scan');
  await expect(page.getByRole('main')).toHaveAttribute('aria-busy', 'false');
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({ path: '.cache/previews/mobile.png', fullPage: true });
});
