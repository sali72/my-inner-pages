import { test, expect, Page } from '@playwright/test';

async function createEntry(page: Page, title: string, content: string) {
  await page.waitForTimeout(1500);

  if (!(await page.locator('input[placeholder="Title..."]').isVisible({ timeout: 3000 }).catch(() => false))) {
    await page.getByRole('button', { name: 'New Entry' }).click();
  }

  await page.fill('input[placeholder="Title..."]', title);
  await page.locator('.ProseMirror').fill(content);
  await page.getByLabel('Back to journal').click();
  await expect(page.locator('h2').filter({ hasText: title })).toBeVisible({ timeout: 5000 });
}

test.describe('Local-first editor regressions', () => {
  let accessToken: string;

  test.beforeAll(async ({ request }) => {
    const email = `e2e-lf-${Date.now()}@test.com`;
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

  test('does not create duplicate entries from rapid save', async ({ page }) => {
    // Regression: the old autosave architecture could create duplicate
    // journal entries (one without title, one with) due to race conditions
    // between debounced saves. The local-first architecture must prevent this.
    await createEntry(page, 'First Entry Regr', 'Content of the first entry.');

    await page.getByRole('button', { name: 'New Entry' }).click();
    await createEntry(page, 'Second Entry Regr', 'Content of the second entry.');

    const firstEntry = page.locator('h2').filter({ hasText: 'First Entry Regr' });
    const secondEntry = page.locator('h2').filter({ hasText: 'Second Entry Regr' });

    await expect(firstEntry).toBeVisible();
    await expect(secondEntry).toBeVisible();
    await expect(firstEntry).toHaveCount(1);
    await expect(secondEntry).toHaveCount(1);
  });

  test('persists content in IndexedDB across full page navigation', async ({ page }) => {
    // Regression: keystrokes must survive page unload/reload even when
    // no API save has occurred. Y.Doc + y-indexeddb should persist the
    // content locally, and the editor should restore it from IndexedDB
    // on remount — not from the stale backend response.
    const title = 'IDB Persist Content';
    await createEntry(page, title, 'Original content for IDB test.');

    // Re-open the entry and modify content without saving to backend
    await page.locator('h2').filter({ hasText: title }).click();
    await page.waitForTimeout(1500);

    const modifiedTitle = 'IDB Persist Modified Title';
    const modifiedContent = 'This content was typed locally and must survive page reload.';
    await page.fill('input[placeholder="Title..."]', modifiedTitle);
    await page.locator('.ProseMirror').fill(modifiedContent);

    // Allow y-indexeddb to flush pending writes to IndexedDB
    await page.waitForTimeout(2000);

    // Navigate away (full page unload — React tree destroyed, Y.Doc destroyed)
    await page.goto('/?view=settings');
    await expect(page.getByText('Settings')).toBeVisible({ timeout: 10000 });

    // Navigate back (full page load — new React tree, new Y.Doc)
    await page.goto('/');
    await expect(page.getByText('Your Journal')).toBeVisible({ timeout: 10000 });

    // Open the entry again (card shows original title from backend API)
    await page.locator('h2').filter({ hasText: title }).click();
    await page.waitForTimeout(2000);

    // Editor should restore the modified content from IndexedDB
    await expect(page.locator('.ProseMirror')).toContainText(modifiedContent);

    // Title input should show the modified title from Y.Doc's Y.Text
    const titleInput = page.locator('input[placeholder="Title..."]');
    await expect(titleInput).toHaveValue(modifiedTitle);
  });

  test('persists title edit in Y.Doc across page reload', async ({ page }) => {
    // Regression: title changes are stored in Y.Text and must survive
    // full page navigation independently of backend state.
    const title = 'IDB Persist Title';
    await createEntry(page, title, 'Testing title persistence.');

    // Re-open and change the title
    await page.locator('h2').filter({ hasText: title }).click();
    await page.waitForTimeout(1500);

    const newTitle = 'IDB PERSIST TITLE CHANGED';
    await page.fill('input[placeholder="Title..."]', newTitle);
    await page.waitForTimeout(2000);

    // Navigate away and back
    await page.goto('/?view=settings');
    await expect(page.getByText('Settings')).toBeVisible({ timeout: 10000 });
    await page.goto('/');
    await expect(page.getByText('Your Journal')).toBeVisible({ timeout: 10000 });

    // Open the entry
    await page.locator('h2').filter({ hasText: title }).click();
    await page.waitForTimeout(2000);

    // Title must show the updated value from Y.Doc, not the backend value
    const titleInput = page.locator('input[placeholder="Title..."]');
    await expect(titleInput).toHaveValue(newTitle);
  });
});
