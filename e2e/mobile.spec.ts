import { test, expect } from '@playwright/test';

// Public pages only; blocked requests never reach authentication or the database.
for (const width of [320, 390, 430]) {
  test(`autentikasi pada HP ${width}px tanpa menulis database`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 844 });
    for (const route of ['/login', '/register', '/daftar']) {
      await page.goto(route);
      const submit = page.getByRole('button', {
        name: route === '/login' ? 'Masuk' : 'Buat akun',
        exact: true,
      });
      await expect(submit).toBeEnabled();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      expect(
        await page
          .getByLabel('Email', { exact: true })
          .evaluate((input) => getComputedStyle(input).fontSize),
      ).toBe('16px');
      expect((await submit.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    }
    await page.route('**/api/auth/register', (route) => route.abort('failed'));
    await page.getByLabel('Nama', { exact: true }).fill('Uji tampilan');
    await page.getByLabel('Email', { exact: true }).fill('mobile@example.test');
    await page
      .getByLabel('Kata sandi', { exact: true })
      .fill('TestPassword123');
    await page.getByRole('button', { name: 'Buat akun', exact: true }).click();
    await expect(page.locator('form').getByRole('alert')).toContainText(
      'Tidak dapat menghubungi mollad',
    );
    await expect(
      page.getByRole('button', { name: 'Buat akun', exact: true }),
    ).toBeEnabled();
  });
}
