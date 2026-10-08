import { test, expect } from '@playwright/test';

test.describe('Fest Directory', () => {
  test('should display fests and events on English page', async ({ page }) => {
    await page.goto('/en/fests');
    
    // Check page title
    await expect(page.locator('h1')).toContainText('Fests & Events');
    
    // Should have featured fests
    const featuredFestsHeading = page.locator('h2', { hasText: 'Featured Fests' });
    await expect(featuredFestsHeading).toBeVisible();
    
    // Should have search input
    const searchInput = page.getByPlaceholder('Search events by title or description...');
    await expect(searchInput).toBeVisible();
    
    // Wait for network requests or client rendering
    await page.waitForLoadState('networkidle');
    
    // There should be some event cards if seeded
    // Let's type something and wait for debounce
    await searchInput.fill('Programming');
    await page.waitForTimeout(1000); // Wait for debounce
  });

  test('should display fests and events on Bangla page', async ({ page }) => {
    await page.goto('/bn/fests');
    
    // Check page title
    await expect(page.locator('h1')).toContainText('ফেস্ট এবং ইভেন্ট');
    
    // Should have search input (Bangla)
    const searchInput = page.getByPlaceholder('শিরোনাম বা বিবরণ দিয়ে ইভেন্ট খুঁজুন...');
    await expect(searchInput).toBeVisible();
  });
});

