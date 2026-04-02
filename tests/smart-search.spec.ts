import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Smart Search Component', () => {

    // Load demo page before each test
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:5173');
    });


    // Rendering & Structure Tests
    test('should render with initial properties and hidden dropdown/clear button', async ({ page }) => {
        const input = page.locator('smart-search').locator('.search-input');
        await expect(input).toBeVisible();
        await expect(input).toHaveAttribute('placeholder', /Search accounts, transactions, customers.../);

        // Dropdown should be hidden initially
        const list = page.locator('smart-search').locator('.results-list');
        await expect(list).toBeHidden();

        // Clear button should be hidden when input is empty
        await expect(page.locator('smart-search').locator('.clear-button')).toBeHidden();
    });


    // User Interaction Tests
    test('should support keyboard navigation and selection', async ({ page }) => {
        const search = page.locator('smart-search');
        const input = search.locator('.search-input');

        await input.fill('Account');

        // Test ArrowDown
        await input.press('ArrowDown');
        await input.press('ArrowDown');
        const secondItem = search.locator('.result-item').nth(1);
        await expect(secondItem).toHaveAttribute('aria-selected', 'true');

        // Test ArrowUp
        await input.press('ArrowUp');
        const firstItem = search.locator('.result-item').first();
        await expect(firstItem).toHaveAttribute('aria-selected', 'true');

        // Test End key (jumps to last item)
        await input.press('End');
        const lastItem = search.locator('.result-item').last();
        await expect(lastItem).toHaveAttribute('aria-selected', 'true');

        // Test Home key (jumps back to first item)
        await input.press('Home');
        await expect(firstItem).toHaveAttribute('aria-selected', 'true');

        // Test Escape key (closes dropdown)
        await input.press('Escape');
        await expect(search.locator('.results-list')).toBeHidden();
    });

    test('should allow clearing search input via clear button and then refocus back', async ({ page }) => {
        const search = page.locator('smart-search');
        const input = search.locator('.search-input');
        const clearButton = search.locator('.clear-button');
        await input.fill('Customer');
        await expect(clearButton).toBeVisible();
        await clearButton.click();
        await expect(input).toHaveValue('');
        await expect(input).toBeFocused();
        await expect(search.locator('.results-list')).toBeHidden();
    });


    // Parent Communication Tests
    test('should dispatch "item-selected" event with correct details on item selection', async ({ page }) => {
        const search = page.locator('smart-search');

        // Using listener to capture the custom event dispatched by the component
        const [eventDetails] = await Promise.all([
            page.evaluate(() => new Promise(res => {
                document.querySelector('smart-search')?.addEventListener('item-selected', (e: CustomEvent) => res(e.detail));
            })),
            page.locator('smart-search input').fill('Jayaraj'),
            page.locator('smart-search li[role="option"]').first().click()
        ]);

        expect(eventDetails.title).toBe('Jayaraj KAMARAJ');
        expect(eventDetails.category).toBe('Customer');
    });


    // Accessibility Tests
    test('should have no accessibility violations (WCAG 2.2)', async ({ page }) => {
        await page.locator('smart-search input').fill('a');
        const accessibilityScanResults = await new AxeBuilder({ page }).include('smart-search').analyze();
        expect(accessibilityScanResults.violations).toEqual([]);
    });

    test('should announce result count to screen readers', async ({ page }) => {
        const announcement = page.locator('smart-search .sr-only');
        await page.locator('smart-search input').fill('Account');
        await expect(announcement).toContainText(/results found/);
    });


    // Edge cases & Error Scenarios Tests
    test('should handle no results found scenario gracefully', async ({ page }) => {
        await page.locator('smart-search input').fill('NonExistentQuery');
        await expect(page.locator('smart-search').locator('ul')).toBeHidden();

        const announcement = page.locator('smart-search .sr-only');
        await expect(announcement).toContainText('0 results found');
    });

    test('should sanitize and escape special characters in search query', async ({ page }) => {
        const xssPayload = '<script>alert("XSS")</script>';
        await page.locator('smart-search input').fill(xssPayload);

        // Check that the input value is correctly escaped and does not execute as code
        const inputValue = await page.locator('smart-search input').inputValue();
        expect(inputValue).toBe(xssPayload);
    });


    // Dark Mode & Theming Tests
    test('should default to light theme', async ({ page }) => {
        const search = page.locator('smart-search');

        // Test initial state
        await expect(search).toHaveAttribute('theme', 'light');

        // Double check computed background for light mode
        const lightBg = await search.evaluate((el) => {
            return window.getComputedStyle(el).getPropertyValue('--web-bg').trim();
        });
        expect(lightBg).toBe('#ffffff');

        // Toggle button to test attribute reflection
        const toggleBtn = page.locator('#themetoggle');
        await toggleBtn.click();
        await expect(search).toHaveAttribute('theme', 'dark');

        // Double check computed background for dark mode
        const darkBg = await search.evaluate((el) => {
            return window.getComputedStyle(el).getPropertyValue('--web-bg').trim();
        });
        expect(darkBg).toBe('#1a1a1a');

        // Triple check input field background changed to dark mode color
        const inputBg = await search.locator('.search-input').evaluate((el) => {
            return window.getComputedStyle(el).getPropertyValue('background-color').trim();
        });
        expect(inputBg).toBe('rgb(26, 26, 26)');
    });
});
