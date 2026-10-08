import { test, expect } from '@playwright/test';

test.describe('FX Components', () => {
  test('Canvas particle field is rendered by default', async ({ page }) => {
    await page.goto('/en');
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });

  test('Canvas particle field is NOT rendered when reduced-motion is emulated', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/en');
    const canvas = page.locator('canvas');
    await expect(canvas).toHaveCount(0);
  });
});

