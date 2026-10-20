import { testOrigin } from './test-origin';
import { test, expect } from '@playwright/test';
import sharp from 'sharp';
import { readdir } from 'node:fs/promises';
test('foto nyata → OCR → review → simpan, duplikat, dan fallback manual', async ({
  page,
  browser,
}) => {
  test.setTimeout(240000);
  const headers = { origin: testOrigin };
  const beforeFiles = await readdir('uploads');
  expect(
    (
      await page.request.post('/api/auth/register', {
        headers,
        data: {
          name: 'Uji Struk',
          email: 'scan-' + Date.now() + '@example.test',
          password: 'Password-test-123',
        },
      })
    ).status(),
  ).toBe(200);
  expect(
    (
      await page.request.post('/api/finance/wallets', {
        headers,
        data: { name: 'Tunai scan', kind: 'CASH', initialBalance: 100000 },
      })
    ).status(),
  ).toBe(201);
  const lines = [
    'KOPI PAGI',
    '12/10/2026',
    'Kopi 1 x 25.000',
    'SUBTOTAL 25.000',
    'TOTAL 25.000',
    'QRIS',
  ];
  const svg =
    '<svg width="900" height="650"><rect width="900" height="650" fill="white"/>' +
    lines
      .map(
        (line, i) =>
          '<text x="60" y="' +
          (80 + i * 80) +
          '" fill="black" font-size="38" font-family="Arial">' +
          line +
          '</text>',
      )
      .join('') +
    '</svg>';
  const buffer = await sharp(Buffer.from(svg)).png().toBuffer();
  async function upload() {
    await page.goto('/transaksi');
    await expect(page.locator('#main')).toHaveAttribute('aria-busy', 'false');
    await page
      .getByRole('button', { name: 'Catat transaksi', exact: true })
      .first()
      .click();
    await page.getByRole('button', { name: 'Scan struk', exact: true }).click();
    await page
      .getByLabel('Unggah foto struk', { exact: true })
      .setInputFiles({ name: 'struk.png', mimeType: 'image/png', buffer });
    const responsePromise = page.waitForResponse(
      (r) =>
        r.url().endsWith('/api/receipts') && r.request().method() === 'POST',
      { timeout: 180000 },
    );
    await page.getByRole('button', { name: 'Baca struk', exact: true }).click();
    const response = await responsePromise;
    expect(response.status()).toBe(201);
    return response.json();
  }
  const first = await upload();
  expect(first.manual).toBe(false);
  expect(first.data.total).toBe(25000);
  expect(first.data.tanggal).toBe('2026-10-12');
  expect(
    (await (await page.request.get('/api/finance/transactions')).json()).count,
  ).toBe(0);
  await expect(
    page.getByRole('heading', { name: 'Hasil pembacaan', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('spinbutton', { name: 'Nominal (Rp)', exact: true }),
  ).toHaveValue('25000');
  await expect(
    page.getByRole('img', { name: 'Foto struk untuk diperiksa' }),
  ).toHaveAttribute('src', /^blob:/);
  await page
    .getByRole('button', { name: 'Simpan transaksi', exact: true })
    .click();
  await expect(page).toHaveURL('/transaksi');
  expect(
    (await (await page.request.get('/api/finance/transactions')).json()).count,
  ).toBe(1);
  expect((await page.request.get('/api/receipts/' + first.id)).status()).toBe(
    404,
  );
  const anonymous = await browser.newContext();
  expect(
    (
      await anonymous.request.get(testOrigin + '/api/receipts/' + first.id)
    ).status(),
  ).toBe(401);
  expect(
    (
      await anonymous.request.post(testOrigin + '/api/auth/register', {
        headers,
        data: {
          name: 'Akun Lain',
          email: 'scan-other-' + Date.now() + '@example.test',
          password: 'Password-test-123',
        },
      })
    ).status(),
  ).toBe(200);
  expect(
    (
      await anonymous.request.get(testOrigin + '/api/receipts/' + first.id)
    ).status(),
  ).toBe(404);
  await anonymous.close();
  await expect(
    page.getByRole('link', { name: 'Lihat struk', exact: true }),
  ).toHaveCount(0);
  const second = await upload();
  expect(second.duplicate).toBe(true);
  await page
    .getByRole('button', { name: 'Simpan transaksi', exact: true })
    .click();
  await expect(
    page.getByText('Transaksi serupa sudah ada.', { exact: false }),
  ).toBeVisible();
  expect(
    (await (await page.request.get('/api/finance/transactions')).json()).count,
  ).toBe(1);
  await page.getByRole('checkbox', { name: /Saya sudah memeriksa/ }).check();
  await page
    .getByRole('button', { name: 'Simpan transaksi', exact: true })
    .click();
  await expect(page).toHaveURL('/transaksi');
  const blank = await sharp({
    create: { width: 300, height: 300, channels: 3, background: '#fff' },
  })
    .png()
    .toBuffer();
  const fallback = await page.request.post('/api/receipts', {
    headers,
    multipart: {
      file: { name: 'blank.png', mimeType: 'image/png', buffer: blank },
    },
    timeout: 180000,
  });
  expect(fallback.status()).toBe(201);
  const manual = await fallback.json();
  expect(manual.manual).toBe(true);
  expect((await page.request.get('/api/receipts/' + manual.id)).status()).toBe(
    404,
  );
  const fake = await page.request.post('/api/receipts', {
    headers,
    multipart: {
      file: {
        name: 'fake.png',
        mimeType: 'image/png',
        buffer: Buffer.from('<svg/>'),
      },
    },
  });
  expect(fake.status()).toBe(400);
  expect(await readdir('uploads')).toEqual(beforeFiles);
});
