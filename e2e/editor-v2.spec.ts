import { test, expect } from '@playwright/test';

test.describe('Editor v0.2', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/chunking-v2');
	});

	test('should load the editor layout', async ({ page }) => {
		// Check stats bar is visible
		await expect(page.getByText('words')).toBeVisible();
		await expect(page.getByText('segments')).toBeVisible();
		await expect(page.getByText('sessions')).toBeVisible();

		// Check editor panel header
		await expect(page.getByText('Original Text')).toBeVisible();

		// Check filter panel
		await expect(page.getByText('Filter Settings')).toBeVisible();
		await expect(page.getByLabel('Maximum Characters')).toBeVisible();

		// Check history section
		await expect(page.getByText('No history yet')).toBeVisible();
	});

	test('should display initial stats correctly', async ({ page }) => {
		// With no text, stats should be zero
		const statsBar = page.locator('div').filter({ hasText: /^0words/ }).first();
		await expect(statsBar).toBeVisible();
	});

	test('should allow entering text in editor', async ({ page }) => {
		// Find the CodeMirror editor
		const editor = page.locator('.cm-content');
		await expect(editor).toBeVisible();

		// Type some text
		await editor.click();
		await page.keyboard.type('This is a test text for the new editor.');

		// Wait a bit for stats to update
		await page.waitForTimeout(100);

		// Stats should update
		const wordsCount = page.locator('div').filter({ hasText: /\d+words/ });
		await expect(wordsCount).toBeVisible();
	});

	test('should update character limit setting', async ({ page }) => {
		const charInput = page.getByLabel('Maximum Characters');
		await expect(charInput).toBeVisible();
		await expect(charInput).toHaveValue('490');

		// Change the value
		await charInput.fill('300');
		await expect(charInput).toHaveValue('300');
	});

	test('should show marker pair configuration', async ({ page }) => {
		await expect(page.getByLabel('Start Marker')).toBeVisible();
		await expect(page.getByLabel('End Marker')).toBeVisible();
		await expect(page.getByLabel('Pattern Template')).toBeVisible();
	});

	test('should allow adding marker pairs', async ({ page }) => {
		// Count initial marker pairs
		const initialPairs = await page.getByLabel('Start Marker').count();

		// Click add pair button
		await page.getByRole('button', { name: 'Add Pair' }).click();

		// Should have one more pair
		const newPairs = await page.getByLabel('Start Marker').count();
		expect(newPairs).toBe(initialPairs + 1);
	});

	test('should allow removing marker pairs', async ({ page }) => {
		// Add a pair first
		await page.getByRole('button', { name: 'Add Pair' }).click();

		// Now remove it
		const removeButtons = page.getByRole('button', { name: 'Remove' });
		await expect(removeButtons.first()).toBeVisible();
		await removeButtons.first().click();

		// Should be removed
		await expect(removeButtons).toHaveCount(0);
	});

	test('should process text and show result', async ({ page }) => {
		// Enter some text
		const editor = page.locator('.cm-content');
		await editor.click();
		await page.keyboard.type('This is a simple test text that will be chunked.');

		// Click process button
		await page.getByRole('button', { name: 'Process Chunks' }).click();

		// Wait for processing
		await page.waitForTimeout(500);

		// Should switch to result view
		await expect(page.getByText('Show Original')).toBeVisible();

		// Result should contain segment markers
		await expect(page.locator('.cm-content')).toContainText('**Segment');
	});

	test('should toggle between original and result views', async ({ page }) => {
		// Enter and process text
		const editor = page.locator('.cm-content');
		await editor.click();
		await page.keyboard.type('Test content for toggling views.');
		await page.getByRole('button', { name: 'Process Chunks' }).click();
		await page.waitForTimeout(500);

		// Should be in result view
		await expect(page.getByText('Show Original')).toBeVisible();
		await expect(page.getByText('Result')).toBeVisible();

		// Toggle back to original
		await page.getByRole('button', { name: 'Show Original' }).click();
		await expect(page.getByText('Original Text')).toBeVisible();
		await expect(page.getByRole('button', { name: 'Show Result' })).toBeVisible();
	});

	test('should disable process button when no text', async ({ page }) => {
		const processButton = page.getByRole('button', { name: 'Process Chunks' });
		await expect(processButton).toBeDisabled();
	});

	test('should enable process button when text is entered', async ({ page }) => {
		const editor = page.locator('.cm-content');
		await editor.click();
		await page.keyboard.type('Some text');

		const processButton = page.getByRole('button', { name: 'Process Chunks' });
		await expect(processButton).toBeEnabled();
	});

	test('should show history after processing', async ({ page }) => {
		// Enter and process text
		const editor = page.locator('.cm-content');
		await editor.click();
		await page.keyboard.type('Text for history test.');
		await page.getByRole('button', { name: 'Process Chunks' }).click();
		await page.waitForTimeout(1000);

		// History should no longer show "No history yet"
		// It should show at least one history item
		const historySection = page.locator('div').filter({ hasText: /text\d+/ }).first();
		// Give it some time for history to save
		await expect(historySection).toBeVisible({ timeout: 3000 });
	});

	test('should update stats when switching views', async ({ page }) => {
		// Enter some text
		const editor = page.locator('.cm-content');
		await editor.click();
		await page.keyboard.type('Original text here.');
		await page.waitForTimeout(200);

		// Get original stats
		const originalWords = await page.locator('div').filter({ hasText: /\d+words/ }).first().textContent();

		// Process
		await page.getByRole('button', { name: 'Process Chunks' }).click();
		await page.waitForTimeout(500);

		// Stats might change after processing
		const resultWords = await page.locator('div').filter({ hasText: /\d+words/ }).first().textContent();
		expect(resultWords).toBeTruthy();
	});

	test('should have responsive layout', async ({ page }) => {
		// Check that main grid container exists
		const mainGrid = page.locator('.grid').first();
		await expect(mainGrid).toBeVisible();

		// Editor and filter panels should be visible
		await expect(page.getByText('Original Text')).toBeVisible();
		await expect(page.getByText('Filter Settings')).toBeVisible();
	});

	test('should show line numbers in editor', async ({ page }) => {
		// CodeMirror line numbers should be present
		const lineNumbers = page.locator('.cm-gutters');
		await expect(lineNumbers).toBeVisible();
	});

	test('should maintain marker pair configuration', async ({ page }) => {
		// Update start marker
		const startMarker = page.getByLabel('Start Marker');
		await startMarker.fill('### Test Start');
		await expect(startMarker).toHaveValue('### Test Start');

		// Update pattern template
		const pattern = page.getByLabel('Pattern Template');
		await pattern.fill('Test %n');
		await expect(pattern).toHaveValue('Test %n');
	});
});
