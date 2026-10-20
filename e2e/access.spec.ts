import { test, expect } from '@playwright/test';

test('tamu melihat pengenalan dan tidak dapat membuka data aplikasi', async ({
  page,
}) => {
  for (const route of [
    '/dashboard',
    '/dompet',
    '/kategori',
    '/transaksi',
    '/anggaran',
    '/scan',
    '/profil',
  ]) {
    await page.goto(route);
    await expect(page).toHaveURL('/');
    await expect(
      page.getByRole('heading', {
        name: /Kenali uangmu/,
      }),
    ).toBeVisible();
    await expect(
      page.getByRole('navigation', { name: 'Navigasi utama', exact: true }),
    ).toHaveCount(0);
  }
  for (const route of [
    '/api/finance/wallets',
    '/api/finance/categories',
    '/api/finance/transactions',
    '/api/budgets',
    '/api/export',
  ]) {
    expect((await page.request.get(route)).status()).toBe(401);
  }
  for (const route of ['/login', '/register', '/daftar']) {
    await page.goto(route);
    await expect(page).toHaveURL(route);
    await expect(
      page.getByRole('button', {
        name: route === '/login' ? 'Masuk' : 'Buat akun',
        exact: true,
      }),
    ).toBeEnabled();
  }
});

test('halaman pengenalan nyaman di HP dan tautan pendaftaran berfungsi', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 844 });
  await page.goto('/');
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page
    .getByRole('link', { name: 'Buat akun mollad', exact: true })
    .click();
  await expect(page).toHaveURL('/register');
  await expect(
    page.getByRole('heading', { name: 'Buat akun mollad', exact: true }),
  ).toBeVisible();
});
