import { test, expect } from '@playwright/test';

test('login page has a title and a login form', async ({ page }) => {
  await page.goto('http://localhost:5173/login');

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/Login/);

  // Expect the page to have a form with username and password fields
  await expect(page.getByLabel('Username')).toBeVisible();
  await expect(page.getByLabel('Password')).toBeVisible();
  await expect(page.getByRole('button', { name: /login/i })).toBeVisible();
});
