import { test, expect } from '@playwright/test';

test('smoke test - loads home page', async ({ page }) => {
  const response = await page.goto('/');
  expect(response?.status()).toBe(200);
});
