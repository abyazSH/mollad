import { test, expect } from '@playwright/test';
test('daftar, akses ruang pribadi, keluar, dan masuk kembali', async ({
  page,
}) => {
  const email = 'm-' + Date.now() + '@example.test';
  await page.goto('/daftar');
  await page.getByLabel('Nama', { exact: true }).fill('Teman mollad');
  await page.getByLabel('Email', { exact: true }).fill(email);
  await page
    .getByLabel('Kata sandi', { exact: true })
    .fill('Password-test-123');
  await page.getByRole('button', { name: 'Buat akun', exact: true }).click();
  await expect(page).toHaveURL('/');
  await expect(
    page.getByRole('navigation', { name: 'Navigasi utama', exact: true }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Keluar', exact: true })
    .filter({ visible: true })
    .click();
  await expect(page).toHaveURL('/login');
  await page.getByLabel('Email', { exact: true }).fill(email);
  await page
    .getByLabel('Kata sandi', { exact: true })
    .fill('Password-test-123');
  await page.getByRole('button', { name: 'Masuk', exact: true }).click();
  await expect(page).toHaveURL('/');
});
