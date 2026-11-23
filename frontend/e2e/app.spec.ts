import { expect, test } from '@playwright/test';

test('shows the Ionic login page when signed out', async ({ page }) => {
  await page.route('http://localhost:8000/api/auth/me', (route) =>
    route.fulfill({
      status: 401,
      headers: {
        'Access-Control-Allow-Origin': 'http://localhost:4200',
        'Access-Control-Allow-Credentials': 'true',
      },
      json: { detail: 'Sign in required.' },
    }),
  );
  const sessionRequest = page.waitForRequest('http://localhost:8000/api/auth/me');
  await page.goto('/');
  await sessionRequest;
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('heading', { name: 'Log In' })).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Email' })).toBeVisible();
});
