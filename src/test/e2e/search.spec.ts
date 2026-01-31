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
    // Expand first facet panel by clicking on its heading
    await page.getByRole('button', { name: 'Place' }).click();

    // Wait for checkboxes to appear
    await page.waitForSelector('input[type="checkbox"]', { timeout: 10000 });

    // Click first visible label (which contains the checkbox)
    const firstLabel = page.locator('label').first();
    await firstLabel.click();

    // Wait for URL to update
    await page.waitForTimeout(1000);

    // Check that the URL contains a filter parameter
    const url = page.url();
    expect(url).toMatch(/(provider|location|resource_class|access_rights|theme)=/);
  });

  test('should navigate to item detail when clicking result', async ({ page }) => {
    // Wait for results to load - look for result card buttons with aria-label
    const firstResult = page.getByRole('button', { name: /^View details for/ }).first();
    await firstResult.waitFor({ state: 'visible', timeout: 10000 });

    // Click first result card
    await firstResult.click();

    // Should navigate to item page
    await expect(page).toHaveURL(/#\/item\//, { timeout: 10000 });

    // Wait for item detail content to load (no longer showing "Loading...")
    await page.waitForSelector('h1', { timeout: 30000 });
    await expect(page.locator('text=Back to Search')).toBeVisible();
  });

  test('should pass accessibility audit', async ({ page }) => {
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
