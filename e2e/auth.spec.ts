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
  await expect(page).toHaveURL('/dashboard');
  for (const path of ['/', '/login', '/register', '/daftar']) {
    await page.goto(path);
    await expect(page).toHaveURL('/dashboard');
  }
  await expect(
    page.getByRole('navigation', { name: 'Navigasi utama', exact: true }),
  ).toBeVisible();
  await page.goto('/profil');
  await expect(page.getByRole('main')).toHaveAttribute('aria-busy', 'false');
  await page
    .getByRole('button', { name: 'Keluar', exact: true })
    .filter({ visible: true })
    .click();
  await expect(page).toHaveURL('/');
  await page
    .getByRole('navigation', { name: 'Navigasi publik', exact: true })
    .getByRole('link', { name: 'Masuk', exact: true })
    .click();
  await page.getByLabel('Email', { exact: true }).fill(email);
  await page
    .getByLabel('Kata sandi', { exact: true })
    .fill('Password-test-123');
  await page.getByRole('button', { name: 'Masuk', exact: true }).click();
  await expect(page).toHaveURL('/dashboard');
});
