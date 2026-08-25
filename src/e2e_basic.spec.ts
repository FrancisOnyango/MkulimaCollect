import { test, expect } from '@playwright/test';

test('app loads index', async ({ page }) => {
  await page.goto(process.env.E2E_BASE_URL || 'http://localhost:5173');
  await expect(page).toHaveTitle(/Figma Make App|/);
});
