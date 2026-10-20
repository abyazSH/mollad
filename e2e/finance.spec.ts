import { testOrigin } from './test-origin';
import { test, expect } from '@playwright/test';
test('CRUD, transfer, saldo, dan isolasi data pengguna', async ({
  page,
  browser,
}) => {
  const headers = { origin: testOrigin };
  const registered = await page.request.post('/api/auth/register', {
    headers,
    data: {
      name: 'Uji Keuangan',
      email: 'finance-' + Date.now() + '@example.test',
      password: 'Password-test-123',
    },
  });
  expect(registered.status()).toBe(200);
  await page.goto('/dompet');
  await expect(page.locator('#main')).toHaveAttribute('aria-busy', 'false');
  await page
    .getByRole('button', { name: 'Tambah dompet', exact: true })
    .click();
  await page.getByLabel('Nama dompet', { exact: true }).fill('Tunai uji');
  await page.getByLabel('Saldo awal (Rp)', { exact: true }).fill('1000000');
  await page
    .getByRole('button', { name: 'Simpan dompet', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Tunai uji', exact: true }),
  ).toBeVisible();
  const first = (
    await (await page.request.get('/api/finance/wallets')).json()
  )[0];
  const second = await (
    await page.request.post('/api/finance/wallets', {
      headers,
      data: { name: 'Bank uji', kind: 'BANK', initialBalance: 0 },
    })
  ).json();
  const categories = await (
    await page.request.get('/api/finance/categories')
  ).json();
  const category = categories[0];
  const base = {
    walletId: first.id,
    date: '2026-10-08',
    merchant: 'Toko uji',
    categoryId: category.id,
    type: 'EXPENSE',
    amount: 25000,
  };
  const expense = await (
    await page.request.post('/api/finance/transactions', {
      headers,
      data: base,
    })
  ).json();
  expect(expense.id).toBeTruthy();
  const transfer = await page.request.post('/api/finance/transactions', {
    headers,
    data: {
      ...base,
      type: 'TRANSFER',
      destinationWalletId: second.id,
      amount: 100000,
    },
  });
  expect(transfer.status()).toBe(201);
  let wallets = await (await page.request.get('/api/finance/wallets')).json();
  expect(wallets.find((w: { id: string }) => w.id === first.id).balance).toBe(
    875000,
  );
  expect(wallets.find((w: { id: string }) => w.id === second.id).balance).toBe(
    100000,
  );
  const other = await browser.newContext();
  const registeredOther = await other.request.post(
    testOrigin + '/api/auth/register',
    {
      headers,
      data: {
        name: 'Pengguna Lain',
        email: 'other-' + Date.now() + '@example.test',
        password: 'Password-test-123',
      },
    },
  );
  expect(registeredOther.status()).toBe(200);
  expect(
    (
      await other.request.patch(testOrigin + '/api/finance/transactions', {
        headers,
        data: { ...base, id: expense.id },
      })
    ).status(),
  ).toBe(404);
  expect(
    (
      await other.request.post(testOrigin + '/api/finance/transactions', {
        headers,
        data: base,
      })
    ).status(),
  ).toBe(404);
  expect(
    (
      await other.request.delete(testOrigin + '/api/finance/wallets', {
        headers,
        data: { id: second.id },
      })
    ).status(),
  ).toBe(404);
  await other.close();
  await page.goto('/transaksi?q=Toko');
  await expect(page.locator('#main')).toHaveAttribute('aria-busy', 'false');
  await expect(
    page.getByText('Toko uji', { exact: true }).first(),
  ).toBeVisible();
  expect(
    (
      await page.request.patch('/api/finance/transactions', {
        headers,
        data: { ...base, id: expense.id, amount: 50000 },
      })
    ).status(),
  ).toBe(200);
  expect(
    (
      await page.request.delete('/api/finance/transactions', {
        headers,
        data: { id: expense.id },
      })
    ).status(),
  ).toBe(200);
  wallets = await (await page.request.get('/api/finance/wallets')).json();
  expect(wallets.find((w: { id: string }) => w.id === first.id).balance).toBe(
    900000,
  );
  expect(
    (
      await page.request.delete('/api/finance/wallets', {
        headers,
        data: { id: first.id },
      })
    ).status(),
  ).toBe(409);
  const unused = await (
    await page.request.post('/api/finance/categories', {
      headers,
      data: { name: 'Uji baru', color: '#123456' },
    })
  ).json();
  expect(
    (
      await page.request.patch('/api/finance/categories', {
        headers,
        data: { id: unused.id, name: 'Uji ubah', color: '#654321' },
      })
    ).status(),
  ).toBe(200);
  expect(
    (
      await page.request.delete('/api/finance/categories', {
        headers,
        data: { id: unused.id },
      })
    ).status(),
  ).toBe(200);
});
