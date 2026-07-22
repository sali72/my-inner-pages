import { test, expect } from '@playwright/test';
import { createUser, loginAsUser } from './fixtures';

test.describe('Auth flow', () => {
  test('registers a new user and shows success screen', async ({ page }) => {
    await page.goto('/');

    // Landing page is shown
    await expect(page.getByText('Meet Yourself on the Page')).toBeVisible();

    // Click "Start Writing" -> auth screen
    await page.getByText('Start Writing').first().click();
    await expect(page.getByText('Welcome Back')).toBeVisible();

    // Navigate to register
    await page.getByText('Create one').click();
    await expect(page.getByRole('heading', { name: 'Create Account' })).toBeVisible();

    // Fill registration form
    const email = `e2e-${Date.now()}@test.com`;
    await page.fill('#email', email);
    await page.fill('#password', 'TestPassword123!');
    await page.fill('#confirmPassword', 'TestPassword123!');
    await page.getByRole('button', { name: /create account/i }).click();

    // Success screen shown
    await expect(page.getByText('Account Created!')).toBeVisible();
    await expect(page.getByText(email)).toBeVisible();
  });

  test('logs in with registered credentials and can navigate', async ({ page }) => {
    // Create a real user via API (fast setup)
    const user = await createUser(page);

    await page.goto('/');
    await page.getByText('Start Writing').first().click();
    await expect(page.getByText('Welcome Back')).toBeVisible();

    // Fill login form
    await page.fill('#email', user.email);
    await page.fill('#password', user.password);
    await page.getByRole('button', { name: /sign in/i }).click();

    // Journal view loads
    await expect(page.getByRole('heading', { name: 'Your Journal', exact: true })).toBeVisible({ timeout: 10000 });

    // Navigate to Settings via sidebar
    await page.locator('header button').first().click();
    await page.getByRole('button', { name: 'Settings', exact: true }).click();
    await expect(page.getByText('Appearance Mode')).toBeVisible();
  });

  test('logs out and returns to landing page', async ({ page }) => {
    // Set up authenticated session via API
    const user = await createUser(page);
    await loginAsUser(page, user);

    // Navigate to settings
    await expect(page.getByRole('heading', { name: 'Your Journal', exact: true })).toBeVisible({ timeout: 10000 });
    await page.locator('header button').first().click();
    await page.getByRole('button', { name: 'Settings', exact: true }).click();
    await expect(page.getByText('Appearance Mode')).toBeVisible();

    // Click Logout and confirm
    await page.getByText('Logout').click();
    await page.getByRole('dialog', { name: 'Logout' }).getByRole('button', { name: 'Logout', exact: true }).click();

    // Back on landing page
    await expect(page.getByText('Meet Yourself on the Page')).toBeVisible();
  });
});
