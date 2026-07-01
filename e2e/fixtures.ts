import { Page } from '@playwright/test';

const API_BASE = '/api/v0/auth';
const TEST_PASSWORD = 'TestPassword123!';

export interface TestUser {
  email: string;
  password: string;
  access_token?: string;
}

export async function createUser(page: Page): Promise<TestUser> {
  const email = `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@test.com`;

  const res = await page.request.post(`${API_BASE}/register`, {
    data: { email, password: TEST_PASSWORD, confirm_password: TEST_PASSWORD },
  });

  if (!res.ok()) {
    const body = await res.text();
    throw new Error(`Failed to create user ${email}: ${res.status()} ${body}`);
  }

  return { email, password: TEST_PASSWORD };
}

export async function loginAsUser(page: Page, user: TestUser): Promise<void> {
  const res = await page.request.post(`${API_BASE}/login`, {
    data: { email: user.email, password: user.password },
  });

  if (!res.ok()) {
    const body = await res.text();
    throw new Error(`Login failed for ${user.email}: ${res.status()} ${body}`);
  }

  const data = await res.json();
  const token = data.access_token;

  await page.goto('/');
  await page.evaluate((t) => localStorage.setItem('authToken', t), token);
  await page.reload();
}
