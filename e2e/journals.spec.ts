import { test, expect, Page } from '@playwright/test';

async function createEntry(page: Page, title: string, content: string) {
  // Wait for the journal page to finish loading
  await page.waitForTimeout(1500);

  // If the new-entry form is not shown, click the "New Entry" FAB
  if (!(await page.locator('input[placeholder="Title..."]').isVisible({ timeout: 3000 }).catch(() => false))) {
    await page.getByRole('button', { name: 'New Entry' }).click();
  }

  await page.fill('input[placeholder="Title..."]', title);
  await page.locator('.ProseMirror').fill(content);
  await page.getByLabel('Back to journal').click();
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

    // Click on the entry card to view/edit it
    await page.locator('h2').filter({ hasText: 'Entry to Edit' }).click();

    // Modify content in the Tiptap editor
    await page.locator('.ProseMirror').fill('Updated content after editing.');

    // Save and go back
    await page.getByLabel('Back to journal').click();

    await expect(page.locator('span').filter({ hasText: 'Updated content after editing.' })).toBeVisible();
  });

  test('deletes a journal entry', async ({ page }) => {
    await createEntry(page, 'Entry to Delete', 'This will be deleted.');

    // Click on the entry card to view/edit it
    await page.locator('h2').filter({ hasText: 'Entry to Delete' }).click();

    // Open options menu and click delete
    await page.getByRole('button', { name: 'Entry options' }).click();
    await page.getByRole('button', { name: 'Delete', exact: true }).click();
    
    // Accept confirm modal
    await page.getByRole('button', { name: 'Delete', exact: true }).click();

    // After deletion, we should be back on the timeline view
    await expect(page.getByText('Your Journal')).toBeVisible();
    await expect(page.locator('h2').filter({ hasText: 'Entry to Delete' })).not.toBeVisible();
  });
});
