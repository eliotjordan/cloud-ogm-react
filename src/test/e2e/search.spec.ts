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
    // Wait for facet panels to load
    await page.waitForSelector('input[type="checkbox"]', { timeout: 10000 });

    // Click first visible checkbox
    const firstCheckbox = page.locator('input[type="checkbox"]').first();
    await firstCheckbox.waitFor({ state: 'visible', timeout: 5000 });
    await firstCheckbox.check();

    // Wait for URL to update
    await page.waitForTimeout(1000);

    // Check that the URL contains a filter parameter
    const url = page.url();
    expect(url).toMatch(/(provider|location|resource_class|access_rights|theme)=/);
  });

  test('should navigate to item detail when clicking result', async ({ page }) => {
    // Wait for results to load - look for result cards
    await page.waitForSelector('.card', { timeout: 10000 });

    // Click first result card
    const firstResult = page.locator('.card').first();
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
