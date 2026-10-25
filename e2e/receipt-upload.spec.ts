import { test, expect } from '@playwright/test';
import sharp from 'sharp';
import { randomBytes } from 'node:crypto';
import { emptyReceipt } from '../src/lib/ocr/schema';
test.skip(
  !process.env.E2E_SESSION_TOKEN,
  'Requires an existing authenticated session.',
);
test('foto besar diperkecil sebelum upload, kegagalan mesin jelas, dan bisa dicoba ulang', async ({
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
  let calls = 0;
  await page.route('**/api/receipts', async (route) => {
    calls++;
    const body = route.request().postDataBuffer()!;
    expect(body.length).toBeLessThan(3_600_000);
    const form = await new Request('http://localhost/upload', {
      method: 'POST',
      headers: { 'Content-Type': route.request().headers()['content-type'] },
      body: new Uint8Array(body),
    }).formData();
    const file = form.get('file') as File;
    expect(file.type).toBe('image/jpeg');
    expect(Buffer.from(await file.arrayBuffer()).subarray(0, 3)).toEqual(
      Buffer.from([255, 216, 255]),
    );
    await route.fulfill({
      status: 201,
      json: {
        id: 'receipt-test',
        rawText: calls > 1 ? 'KOPI UJI\n25/10/2026\nTOTAL 25.000' : '',
        data: {
          ...emptyReceipt,
          ...(calls > 1
            ? {
                merchant: 'KOPI UJI',
                total: 25000,
                tanggal: '2026-10-25',
                confidence: 0.9,
              }
            : {}),
        },
        duplicate: false,
        manual: calls === 1,
        lowConfidence: [],
        ...(calls === 1 ? { ocrError: 'OCR_ENGINE_FAILED' } : {}),
      },
    });
  });
  await page.goto('/transaksi?catat=scan');
  await expect(page.locator('#main')).toHaveAttribute('aria-busy', 'false');
  const image = await sharp(randomBytes(1600 * 1400 * 3), {
    raw: { width: 1600, height: 1400, channels: 3 },
  })
    .png()
    .toBuffer();
  expect(image.length).toBeGreaterThan(4_500_000);
  expect(image.length).toBeLessThan(8 * 1024 * 1024);
  await page
    .getByLabel('Unggah foto struk', { exact: true })
    .setInputFiles({ name: 'large.png', mimeType: 'image/png', buffer: image });
  await page.getByRole('button', { name: 'Baca struk', exact: true }).click();
  await expect(
    page.getByText(/Mesin pembaca struk belum berhasil/),
  ).toBeVisible();
  await expect(
    page.getByRole('img', { name: 'Foto struk untuk diperiksa' }),
  ).toHaveAttribute('src', /^blob:/);
  await page
    .getByRole('button', { name: 'Coba baca lagi', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Hasil pembacaan', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('textbox', { name: 'Merchant', exact: true }),
  ).toHaveValue('KOPI UJI');
  expect(calls).toBe(2);
  await page.getByText('Teks hasil pembacaan', { exact: true }).click();
  await expect(page.locator('pre')).toContainText('TOTAL 25.000');
});
