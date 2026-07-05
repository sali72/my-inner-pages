import { test, expect, Page } from '@playwright/test';

async function createEntry(page: Page, title: string, content: string) {
  // Wait for the journal page to finish loading
  await page.waitForTimeout(1500);

  // If the new-entry form is not shown, click the "New Entry" FAB
  if (!(await page.locator('input[placeholder="Title..."]').isVisible({ timeout: 3000 }).catch(() => false))) {
    await page.getByRole('button', { name: 'New Entry' }).click();
  }

  await page.fill('input[placeholder="Title..."]', title);
  await page.getByPlaceholder('Begin writing your story...').fill(content);
  await page.getByTitle('Save Entry').click();
  await expect(page.locator('h2').filter({ hasText: title })).toBeVisible({ timeout: 5000 });
}

test.describe('Journal CRUD', () => {
  let accessToken: string;

  test.beforeAll(async ({ request }) => {
    const email = `e2e-journal-${Date.now()}@test.com`;
    await request.post('/api/v0/auth/register', {
      data: { email, password: 'TestPassword123!', confirm_password: 'TestPassword123!' },
    });
    const res = await request.post('/api/v0/auth/login', {
      data: { email, password: 'TestPassword123!' },
    });
    const data = await res.json();
    accessToken = data.access_token;
  });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate((t) => localStorage.setItem('authToken', t), accessToken);
    await page.reload();
    await expect(page.getByText('Your Journal')).toBeVisible({ timeout: 10000 });
  });

  test('creates a new journal entry', async ({ page }) => {
    await createEntry(page, 'E2E Test Entry', 'Created by e2e test.');
  });

  test('edits an existing journal entry', async ({ page }) => {
    await createEntry(page, 'Entry to Edit', 'Original content.');

    // Open entry menu and click Edit
    await page.getByRole('button', { name: 'Entry options' }).click();
    await page.getByRole('button', { name: 'Edit', exact: true }).click();

    // Modify content in edit mode
    await page.locator('textarea').first().fill('Updated content after editing.');

    // Click Save (the button with the Save icon, not the "New Entry" FAB)
    await page.locator('button.btn-primary:has(.lucide-save)').click();

    await expect(page.locator('span').filter({ hasText: 'Updated content after editing.' })).toBeVisible();
  });

  test('deletes a journal entry', async ({ page }) => {
    await createEntry(page, 'Entry to Delete', 'This will be deleted.');

    // Open entry menu and delete
    await page.getByRole('button', { name: 'Entry options' }).click();
    page.once('dialog', (dialog) => dialog.accept());
    await page.getByRole('button', { name: 'Delete', exact: true }).click();

    // After deletion, back to new-entry page
    await expect(page.getByText('New Entry')).toBeVisible();
    await expect(page.locator('h2').filter({ hasText: 'Entry to Delete' })).not.toBeVisible();
  });
});
