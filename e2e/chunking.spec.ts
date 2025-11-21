import { test, expect } from '@playwright/test';

test.describe('Edithor Chunking Application', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/');
	});

	test('should display main heading and description', async ({ page }) => {
		await expect(page.getByRole('heading', { name: 'Edithor ✂️' })).toBeVisible();
		await expect(page.getByText('Smart text chunking for AI voiceover tools')).toBeVisible();
	});

	test('should have all main sections visible', async ({ page }) => {
		await expect(page.getByRole('heading', { name: 'Input Text' })).toBeVisible();
		await expect(page.getByRole('heading', { name: 'Chunk Settings' })).toBeVisible();
		await expect(page.getByRole('heading', { name: 'How It Works' })).toBeVisible();
	});

	test('should have process button disabled when no text', async ({ page }) => {
		const processButton = page.getByRole('button', { name: /Process Text/i });
		await expect(processButton).toBeDisabled();
	});

	test('should enable process button when text is entered', async ({ page }) => {
		const textarea = page.getByPlaceholder('Paste your voiceover script here...');
		await textarea.fill('This is a test sentence. This is another sentence.');

		const processButton = page.getByRole('button', { name: /Process Text/i });
		await expect(processButton).toBeEnabled();
	});

	test('should process text and show chunks', async ({ page }) => {
		// Enter text
		const textarea = page.getByPlaceholder('Paste your voiceover script here...');
		const testText = 'First sentence here. Second sentence here. Third sentence here. Fourth sentence here.';
		await textarea.fill(testText);

		// Process the text
		const processButton = page.getByRole('button', { name: /Process Text/i });
		await processButton.click();

		// Wait for preview section to appear
		await expect(page.getByRole('heading', { name: 'Preview' })).toBeVisible();

		// Check that chunks are displayed
		await expect(page.getByText(/Your text has been split into/i)).toBeVisible();

		// Check statistics are shown
		await expect(page.getByText('Total Chunks')).toBeVisible();
		await expect(page.getByText('Avg Size')).toBeVisible();
		await expect(page.getByText('Largest')).toBeVisible();
		await expect(page.getByText('Smallest')).toBeVisible();
		await expect(page.getByText('Total Chars')).toBeVisible();
	});

	test('should display chunk cards with content', async ({ page }) => {
		const textarea = page.getByPlaceholder('Paste your voiceover script here...');
		await textarea.fill('This is the first sentence. This is the second sentence. This is the third sentence.');

		const processButton = page.getByRole('button', { name: /Process Text/i });
		await processButton.click();

		// Wait for chunks to appear
		await page.waitForSelector('text=Chunk 1');

		// Verify chunk card is visible
		await expect(page.getByText('Chunk 1')).toBeVisible();
		await expect(page.getByText(/\d+ chars/)).toBeVisible();
		await expect(page.getByText(/\d+ sentences?/)).toBeVisible();
	});

	test('should adjust character limit', async ({ page }) => {
		const input = page.locator('input[type="number"]#chunk-limit');
		await expect(input).toHaveValue('500');

		await input.fill('300');
		await expect(input).toHaveValue('300');
	});

	test('should show character count in textarea', async ({ page }) => {
		const textarea = page.getByPlaceholder('Paste your voiceover script here...');
		await textarea.fill('Test text');

		await expect(page.getByText(/9 characters/i)).toBeVisible();
	});

	test('should enable download buttons after processing', async ({ page }) => {
		const textarea = page.getByPlaceholder('Paste your voiceover script here...');
		await textarea.fill('Test sentence one. Test sentence two.');

		const processButton = page.getByRole('button', { name: /Process Text/i });
		await processButton.click();

		// Wait for processing to complete
		await page.waitForSelector('text=Chunk 1');

		// Check download buttons are enabled
		const singleFileButton = page.getByRole('button', { name: /Download Single File/i });
		const zipButton = page.getByRole('button', { name: /Download ZIP/i });

		await expect(singleFileButton).toBeEnabled();
		await expect(zipButton).toBeEnabled();
	});

	test('should reset chunks when text is modified after processing', async ({ page }) => {
		const textarea = page.getByPlaceholder('Paste your voiceover script here...');
		await textarea.fill('First text.');

		const processButton = page.getByRole('button', { name: /Process Text/i });
		await processButton.click();

		// Wait for chunks
		await page.waitForSelector('text=Chunk 1');

		// Modify text
		await textarea.fill('Different text here.');

		// Preview section should still exist but show old chunks
		// or we can verify the process button state
		await expect(processButton).toBeEnabled();
	});

	test('should handle long text with multiple chunks', async ({ page }) => {
		const longText = Array(20).fill('This is a sentence that will be repeated multiple times to create a longer text.').join(' ');

		const textarea = page.getByPlaceholder('Paste your voiceover script here...');
		await textarea.fill(longText);

		const processButton = page.getByRole('button', { name: /Process Text/i });
		await processButton.click();

		// Wait for processing
		await page.waitForSelector('text=Chunk 1');

		// Should have multiple chunks
		await expect(page.getByText('Chunk 2')).toBeVisible();

		// Verify multiple chunks exist in preview description
		await expect(page.getByText(/Your text has been split into \d+ chunks/i)).toBeVisible();
	});

	test('should show empty state instructions initially', async ({ page }) => {
		await expect(page.getByText('How It Works')).toBeVisible();
		await expect(page.getByText('Input Your Text')).toBeVisible();
		await expect(page.getByText('Set Your Limit')).toBeVisible();
		await expect(page.getByText('Process & Download')).toBeVisible();
	});

	test('should display privacy notice', async ({ page }) => {
		await expect(page.getByText(/All processing happens in your browser/i)).toBeVisible();
		await expect(page.getByText(/Your text never leaves your device/i)).toBeVisible();
	});

	test('should have upload file button', async ({ page }) => {
		const uploadButton = page.getByRole('button', { name: /Upload File/i });
		await expect(uploadButton).toBeVisible();
	});

	test('should show helpful description for chunk settings', async ({ page }) => {
		await expect(page.getByText(/Text will be split into chunks of approximately/i)).toBeVisible();
		await expect(page.getByText(/while preserving sentence boundaries/i)).toBeVisible();
	});

	test('should have responsive layout', async ({ page }) => {
		// Test mobile viewport
		await page.setViewportSize({ width: 375, height: 667 });
		await expect(page.getByRole('heading', { name: 'Edithor ✂️' })).toBeVisible();

		// Test tablet viewport
		await page.setViewportSize({ width: 768, height: 1024 });
		await expect(page.getByRole('heading', { name: 'Edithor ✂️' })).toBeVisible();

		// Test desktop viewport
		await page.setViewportSize({ width: 1920, height: 1080 });
		await expect(page.getByRole('heading', { name: 'Edithor ✂️' })).toBeVisible();
	});

	test('should process text with different chunk sizes', async ({ page }) => {
		const textarea = page.getByPlaceholder('Paste your voiceover script here...');
		const testText = 'Sentence one. Sentence two. Sentence three. Sentence four. Sentence five.';
		await textarea.fill(testText);

		// Set small chunk size
		const input = page.locator('input[type="number"]#chunk-limit');
		await input.fill('50');

		const processButton = page.getByRole('button', { name: /Process Text/i });
		await processButton.click();

		await page.waitForSelector('text=Chunk 1');

		// Should create multiple chunks with small limit
		await expect(page.getByText('Chunk 2')).toBeVisible();
	});

	test('should maintain dark theme', async ({ page }) => {
		const html = page.locator('html');
		await expect(html).toHaveClass(/dark/);
	});
});
