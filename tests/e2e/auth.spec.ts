import { test, expect } from '@playwright/test';

test.describe('Auth Flow', () => {
  const uniqueEmail = `testuser_${Date.now()}@test.com`;

  test('signup, login and logout flow', async ({ page }) => {
    // 1. Go to signup
    await page.goto('/en/signup');
    await page.fill('input[name="fullName"]', 'E2E User');
    await page.fill('input[name="email"]', uniqueEmail);
    await page.fill('input[name="password"]', 'Password123');
    await page.fill('input[name="confirmPassword"]', 'Password123');
    await page.click('button[type="submit"]');

    // Wait for redirect to home
    await page.waitForURL('/en');
    
    // Check if auth menu shows name
    const authButton = page.locator('button:has-text("E2E User")');
    await expect(authButton).toBeVisible();

    // 2. Logout
    await authButton.hover();
    await page.click('text=Log out');
    
    // Ensure we are logged out
    await expect(page.locator('text=Log in')).toBeVisible();

    // 3. Login
    await page.goto('/en/login');
    await page.fill('input[name="email"]', uniqueEmail);
    await page.fill('input[name="password"]', 'Password123');
    await page.click('button[type="submit"]');

    await page.waitForURL('/en');
    await expect(authButton).toBeVisible();
  });
});

