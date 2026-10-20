import { test, expect } from '@playwright/test';
import sharp from 'sharp';

// Optional existing session: these checks never create accounts or write finance data.
test.skip(
  !process.env.E2E_SESSION_TOKEN,
  'Requires a read-only authenticated test session.',
);
test.beforeEach(async ({ context, baseURL }) => {
  await context.addCookies([
    {
      name: 'm-session',
      value: process.env.E2E_SESSION_TOKEN!,
      url: baseURL!,
      httpOnly: true,
      sameSite: 'Lax',
    },
  ]);
});

test('dompet dan kategori satu halaman, lima menu, tanpa header atas', async ({
  page,
}) => {
  for (const width of [320, 390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/dompet');
    await expect(page.locator('#main')).toHaveAttribute('aria-busy', 'false');
    await expect(
      page.getByRole('heading', { name: 'Dompetmu.', exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Kategori.', exact: true }),
    ).toBeVisible();
    await expect(page.locator('header')).toHaveCount(0);
    const nav = page.getByRole('navigation', {
      name: width < 1024 ? 'Navigasi seluler' : 'Navigasi utama',
      exact: true,
    });
    await expect(nav.getByRole('link')).toHaveCount(5);
    for (const item of await nav.getByRole('link').all()) {
      const box = await item.boundingBox();
      expect(box!.height).toBeGreaterThanOrEqual(44);
      expect(box!.width).toBeGreaterThanOrEqual(44);
    }
    await expect(
      nav.getByRole('link', { name: 'Profil', exact: true }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  await page.goto('/kategori');
  await expect(page).toHaveURL('/dompet#kategori');
});

test('catat transaksi menampung scan, review wajib, foto dilepas setelah simpan', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  let saves = 0;
  await page.route('**/api/finance/transactions', async (route) => {
    if (route.request().method() !== 'POST') return route.continue();
    saves++;
    expect(route.request().postDataJSON().receiptId).toBe(
      'receipt-review-test',
    );
    await route.fulfill({
      status: 201,
      json: { id: 'test-only-no-database-write' },
    });
  });
  await page.route('**/api/receipts', (route) =>
    route.fulfill({
      status: 201,
      json: {
        id: 'receipt-review-test',
        manual: false,
        duplicate: false,
        lowConfidence: ['total'],
        data: {
          merchant: 'TOKO UJI',
          tanggal: '2026-10-20',
          total: 25000,
          pajak: 0,
          diskon: 0,
          metode_bayar: 'QRIS',
          items: [],
          kategori_saran: 'Makanan',
          confidence: 0.8,
        },
      },
    }),
  );
  await page.goto('/transaksi');
  await expect(page.locator('#main')).toHaveAttribute('aria-busy', 'false');
  await expect(
    page.getByRole('link', { name: 'Ekspor CSV', exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole('link', { name: 'Scan struk', exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole('button', { name: 'Catat transaksi', exact: true })
    .first()
    .click();
  const dialog = page.getByRole('dialog', {
    name: 'Catat transaksi',
    exact: true,
  });
  await dialog.getByRole('button', { name: 'Scan struk', exact: true }).click();
  const buffer = await sharp({
    create: { width: 200, height: 300, channels: 3, background: '#fff' },
  })
    .png()
    .toBuffer();
  await dialog
    .getByLabel('Unggah foto struk', { exact: true })
    .setInputFiles({ name: 'test.png', mimeType: 'image/png', buffer });
  await dialog.getByRole('button', { name: 'Baca struk', exact: true }).click();
  await expect(
    dialog.getByRole('heading', { name: 'Hasil pembacaan', exact: true }),
  ).toBeVisible();
  expect(saves).toBe(0);
  await expect(
    dialog.getByRole('img', { name: 'Foto struk untuk diperiksa' }),
  ).toHaveAttribute('src', /^blob:/);
  await dialog.locator('select[name=categoryId]').selectOption({ index: 1 });
  await expect(dialog.getByLabel('Nominal (Rp)', { exact: false })).toHaveValue(
    '25000',
  );
  expect(await dialog.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(
    true,
  );
  await dialog
    .getByRole('button', { name: 'Simpan transaksi', exact: true })
    .click();
  await expect(dialog).toHaveCount(0);
  expect(saves).toBe(1);
  await expect(
    page.getByRole('img', { name: 'Foto struk untuk diperiksa' }),
  ).toHaveCount(0);
  await page.goto('/scan');
  await expect(page).toHaveURL('/transaksi?catat=scan');
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button', { name: 'Tutup', exact: true }).click();
  await expect(page).toHaveURL('/transaksi');
});

test('profil: bahasa dan tema persisten, ekspor terfilter, logout', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 844 });
  await page.goto('/profil');
  await expect(page.locator('#main')).toHaveAttribute('aria-busy', 'false');
  await page.getByLabel('Bahasa', { exact: true }).selectOption('en');
  await expect(
    page.getByRole('heading', { name: 'Profile', exact: true }),
  ).toBeVisible();
  await page.getByLabel('Appearance', { exact: true }).selectOption('dark');
  await expect(page.locator('html')).toHaveClass(/dark/);
  await page.reload();
  await expect(
    page.getByRole('heading', { name: 'Profile', exact: true }),
  ).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('html')).toHaveClass(/dark/);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.route('**/api/export?**', async (route) => {
    const url = new URL(route.request().url());
    expect(url.searchParams.get('from')).toBe('2026-10-01');
    expect(url.searchParams.get('to')).toBe('2026-10-20');
    expect(url.searchParams.get('type')).toBe('EXPENSE');
    await route.fulfill({
      status: 200,
      contentType: 'text/csv',
      body: 'Tanggal,Nominal\n2026-10-20,25000',
    });
  });
  await page.getByLabel('From date', { exact: true }).fill('2026-10-01');
  await page.getByLabel('To date', { exact: true }).fill('2026-10-20');
  await page
    .getByLabel('Transaction type', { exact: true })
    .selectOption('EXPENSE');
  const download = page.waitForEvent('download');
  await page
    .getByRole('button', { name: 'Download transactions', exact: true })
    .click();
  expect((await download).suggestedFilename()).toBe('mollad-transaksi.csv');
  await expect(page).toHaveURL('/profil');
  await page.getByLabel('Language', { exact: true }).selectOption('id');
  await page.getByLabel('Tampilan', { exact: true }).selectOption('light');
  await page.getByRole('button', { name: 'Keluar', exact: true }).click();
  await expect(page).toHaveURL('/');
  expect(
    (await page.context().cookies()).some(
      (c) => c.name === 'm-session' && c.value,
    ),
  ).toBe(false);
});
