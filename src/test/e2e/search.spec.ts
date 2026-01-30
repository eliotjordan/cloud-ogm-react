import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Search Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/search');
    // Wait for DuckDB to initialize and search to complete
    await page.waitForSelector('text=Showing', { timeout: 30000 });
  });

  test('should display search results', async ({ page }) => {
    await expect(page.locator('text=Showing')).toBeVisible();
    await expect(page.locator('text=results')).toBeVisible();
  });

  test('should display facet panels', async ({ page }) => {
    await expect(page.locator('text=Place')).toBeVisible();
    await expect(page.locator('text=Provider')).toBeVisible();
    await expect(page.locator('text=Resource Class')).toBeVisible();
  });

  test('should display map', async ({ page }) => {
    await expect(page.locator('.leaflet-container')).toBeVisible();
  });

  test('should filter results when selecting facet', async ({ page }) => {
    // Expand Provider facet if not already expanded
    const providerHeading = page.locator('text=Provider');
    await providerHeading.click();

    // Wait for facet values to appear
    await page.waitForSelector('input[type="checkbox"]', { timeout: 5000 });

    // Click first checkbox
    const firstCheckbox = page.locator('input[type="checkbox"]').first();
    await firstCheckbox.check();

    // Wait for URL to update
    await page.waitForTimeout(500);

    // Check that active filter chip appears
    await expect(page.locator('text=Active Filters')).toBeVisible();
  });

  test('should navigate to item detail when clicking result', async ({ page }) => {
    // Wait for results to load
    await page.waitForSelector('button:has-text("View details")', { timeout: 10000 });

    // Click first result
    const firstResult = page.locator('button').filter({ hasText: /View details/ }).first();
    await firstResult.click();

    // Should navigate to item page
    await expect(page).toHaveURL(/#\/item\//);
    await expect(page.locator('text=Back to Search')).toBeVisible();
  });

  test('should pass accessibility audit', async ({ page }) => {
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
