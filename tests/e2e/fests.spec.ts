import { test, expect } from '@playwright/test';

test.describe('Fests and Events flow', () => {
  test('Navigate from Directory to Fest to Event', async ({ page }) => {
    // Navigate to Directory
    await page.goto('/en/fests');
    await expect(page.locator('h1').filter({ hasText: 'Fests & Events' })).toBeVisible();

    // Click on the first Fest card
    const firstFestLink = page.locator('a[href^="/en/fests/"]').first();
    const festUrl = await firstFestLink.getAttribute('href');
    await firstFestLink.click();
    await page.waitForURL(festUrl!);

    // Check Fest page loaded
    await expect(page.locator('h2').filter({ hasText: 'Events in this fest' })).toBeVisible();

    // Click on the first Event card
    const firstEventLink = page.locator('a[href*="/events/"]').first();
    const eventUrl = await firstEventLink.getAttribute('href');
    await firstEventLink.click();
    await page.waitForURL(eventUrl!);

    // Check Event page loaded with correct sections
    await expect(page.locator('h2').filter({ hasText: 'Event description' })).toBeVisible();
    await expect(page.locator('h2').filter({ hasText: 'Date & time' })).toBeVisible();
    await expect(page.locator('h2').filter({ hasText: 'Venue' })).toBeVisible();
    await expect(page.locator('h3').filter({ hasText: 'Registration information' })).toBeVisible();

    // Verify availability text exists
    await expect(page.locator('text=left').or(page.locator('text=Capacity reached'))).toBeVisible();
  });
});

