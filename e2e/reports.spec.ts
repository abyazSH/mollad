import { testOrigin } from './test-origin';
import { test, expect } from '@playwright/test';
test('dashboard, peringatan anggaran, dan ekspor CSV terfilter', async ({
  page,
}) => {
  const headers = { origin: testOrigin };
  expect(
    (
      await page.request.post('/api/auth/register', {
        headers,
        data: {
          name: 'Uji Laporan',
          email: 'report-' + Date.now() + '@example.test',
          password: 'Password-test-123',
        },
      })
    ).status(),
  ).toBe(200);
  const wallet = await (
    await page.request.post('/api/finance/wallets', {
      headers,
      data: { name: 'Tunai', kind: 'CASH', initialBalance: 100000 },
    })
  ).json();
  const categories = await (
    await page.request.get('/api/finance/categories')
  ).json();
  const category = categories.find(
    (c: { name: string }) => c.name === 'Makanan',
  );
  expect(
    (
      await page.request.post('/api/finance/transactions', {
        headers,
        data: {
          walletId: wallet.id,
          categoryId: category.id,
          type: 'EXPENSE',
          date: '2026-10-08',
          amount: 85000,
          merchant: 'Resto Laporan',
        },
      })
    ).status(),
  ).toBe(201);
  await page.goto('/anggaran?month=2026-10');
  await expect(page.locator('#main')).toHaveAttribute('aria-busy', 'false');
  await page
    .getByRole('button', { name: 'Buat anggaran', exact: true })
    .click();
  await page
    .getByRole('combobox', { name: 'Kategori', exact: true })
    .selectOption(category.id);
  await page.getByLabel('Anggaran (Rp)', { exact: true }).fill('100000');
  await page
    .getByRole('button', { name: 'Simpan anggaran', exact: true })
    .click();
  await expect(
    page.getByText('Lebih dari 80% terpakai.', { exact: false }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Ubah anggaran Makanan', exact: true })
    .click();
  await page.getByLabel('Anggaran (Rp)', { exact: true }).fill('80000');
  await page
    .getByRole('button', { name: 'Simpan anggaran', exact: true })
    .click();
  await expect(
    page.getByText('Sudah melewati anggaran.', { exact: false }),
  ).toBeVisible();
  await page.goto('/dashboard?month=2026-10');
  await expect(page.getByText(/^Rp\s*15\.000$/).first()).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Arus keuangan', exact: true }),
  ).toBeVisible();
  const csv = await page.request.get(
    '/api/export?from=2026-10-01&to=2026-10-31&type=EXPENSE',
  );
  expect(csv.headers()['content-type']).toContain('text/csv');
  expect(await csv.text()).toContain('Resto Laporan');
  const empty = await page.request.get(
    '/api/export?from=2026-09-01&to=2026-09-30',
  );
  expect(await empty.text()).not.toContain('Resto Laporan');
});
