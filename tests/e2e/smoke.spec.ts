import { test, expect } from '@playwright/test';

test('loads localized home page and toggles language', async ({ page }) => {
  await page.goto('/');
  
  // Verify redirect to /en
  expect(page.url()).toMatch(/\/en$/);
  
  // Verify English text exists
  await expect(page.getByText('Strive for Excellence')).toBeVisible();

  // Click Language Switcher
  await page.getByRole('link', { name: 'বাংলা' }).click();

  // Verify URL is /bn
  await page.waitForURL(/\/bn$/);

  // Verify Bangla text
  await expect(page.getByText('উৎকর্ষ সাধনে অদম্য')).toBeVisible();
});

test('toggles theme', async ({ page }) => {
  await page.goto('/en');
  
  // The html element should have 'dark' class if toggled, or 'light'
  // But wait, the system defaults to 'system', so we just click the toggle.
  const html = page.locator('html');
  const toggleBtn = page.getByRole('button', { name: /Toggle theme/i });
  
  const initialClass = await html.getAttribute('class');
  await toggleBtn.click();
  
  const newClass = await html.getAttribute('class');
  expect(initialClass).not.toBe(newClass);
});
