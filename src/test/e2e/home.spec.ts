import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Home Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for DuckDB to initialize
    await page.waitForSelector('text=Search OpenGeoMetadata', { timeout: 30000 });
  });

  test('should display home page with search inputs', async ({ page }) => {
    await expect(page.locator('h1')).toHaveText('Search OpenGeoMetadata');
    await expect(page.locator('input[placeholder*="Location filter"]')).toBeVisible();
    await expect(page.locator('input[placeholder*="Search for maps"]')).toBeVisible();
  });

  test('should display resource class grid', async ({ page }) => {
    await expect(page.locator('text=Browse by Resource Class')).toBeVisible();
    await expect(page.locator('text=Browse All Resources')).toBeVisible();

    // Wait for resource classes to load
    await page.waitForSelector('text=Maps', { timeout: 15000 });
  });

  test('should navigate to search page when clicking Browse All', async ({ page }) => {
    await page.click('text=Browse All Resources');
    await expect(page).toHaveURL(/#\/search/);
  });

  test('should navigate to search page when submitting text search', async ({ page }) => {
    await page.fill('input[placeholder*="Search for maps"]', 'San Francisco');
    await page.click('button:has-text("Search")');
    // Accept both + and %20 for space encoding
    await expect(page).toHaveURL(/#\/search\?q=(San\+Francisco|San%20Francisco)/);
  });

  test('should navigate to filtered search when clicking resource class', async ({ page }) => {
    // Wait for resource classes to load
    await page.waitForSelector('button[aria-label*="Browse Maps"]', { timeout: 15000 });
    await page.click('button[aria-label*="Browse Maps"]');
    await expect(page).toHaveURL(/resource_class=Maps/);
  });

  test('should pass accessibility audit', async ({ page }) => {
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
