import { test, expect } from '@playwright/test';
import { readFileSync } from 'fs';

test.describe('Sentence Integrity - No Butchered Sentences', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/chunking');
	});

	test('should not split sentences mid-way when processing writing1.md content', async ({ page }) => {
		// Read the actual writing1.md file
		const fileContent = readFileSync('./example/writing1.md', 'utf-8');

		// Load the file content into the editor
		await page.evaluate((content) => {
			const textarea = document.querySelector('textarea');
			if (textarea) {
				textarea.value = content;
				textarea.dispatchEvent(new Event('input', { bubbles: true }));
			}
		}, fileContent);

		// Set the parameters
		await page.fill('input[placeholder*="Start marker"]', '### Voice Script Segments');
		await page.fill('input[placeholder*="End marker"]', '### Storyboard Images');
		await page.fill('input[placeholder*="Pattern"]', '%o{**}Segment %n:%o{**} (%d characters)');

		// Set max characters to 490
		const limitInput = page.locator('input[type="number"]').first();
		await limitInput.fill('490');

		// Click process button
		await page.click('button:has-text("Process")');

		// Wait for processing to complete
		await page.waitForSelector('text=**Segment 1:**', { timeout: 10000 });

		// Get all the processed segments from result view
		const resultText = await page.locator('[data-testid="result-editor"]').textContent();

		// Check for butchered sentences - common patterns
		const segments = resultText?.match(/\*\*Segment \d+:\*\* \(\d+ characters\)\n\n([^*]+)/g) || [];

		let foundIssues = false;
		const issues: string[] = [];

		for (let i = 0; i < segments.length - 1; i++) {
			const currentSegment = segments[i];
			const nextSegment = segments[i + 1];

			// Extract content after the marker
			const currentContent = currentSegment.replace(/\*\*Segment \d+:\*\* \(\d+ characters\)\n\n/, '').trim();
			const nextContent = nextSegment.replace(/\*\*Segment \d+:\*\* \(\d+ characters\)\n\n/, '').trim();

			// Check if current segment ends without punctuation (excluding quotes)
			const endsWithoutPunctuation = !/[.!?]["']?\s*$/.test(currentContent);

			// Check if next segment starts with lowercase (likely continuation)
			const startsWithLowercase = /^[a-z]/.test(nextContent);

			// Check if next segment is very small (< 150 chars)
			const nextIsSmall = nextContent.length < 150;

			if (endsWithoutPunctuation && (startsWithLowercase || nextIsSmall)) {
				foundIssues = true;
				const segmentNum = i + 1;
				issues.push(`Segment ${segmentNum} -> ${segmentNum + 1}:`);
				issues.push(`  Ends: "...${currentContent.slice(-60)}"`);
				issues.push(`  Next starts: "${nextContent.slice(0, 60)}..."`);
				issues.push(`  Next length: ${nextContent.length} chars\n`);
			}

			// Check the specific case from the bug report
			if (currentContent.includes('pressing on me.') && !currentContent.includes('Trying to make me stop too')) {
				const nextHasContinuation = nextContent.toLowerCase().includes('trying to make me stop');
				if (nextHasContinuation) {
					foundIssues = true;
					issues.push(`KNOWN BUG: "pressing on me. Trying to make me stop too." was split!`);
				}
			}
		}

		// Fail if issues found
		if (foundIssues) {
			console.log('\n❌ Found butchered sentences:');
			console.log(issues.join('\n'));
		}

		expect(foundIssues).toBe(false);
	});

	test('should keep short sentences with previous sentence when under limit', async ({ page }) => {
		// Test case: sentence that ends with period followed by short sentence
		const testContent = `### Voice Script Segments

Segment 1: (500 characters) This is a long sentence that talks about many things and goes on for quite a while to reach near the character limit. It continues with more details and information. Every step felt heavier. Like the stopped time was pressing on me. Trying to make me stop too.

### Storyboard Images`;

		await page.evaluate((content) => {
			const textarea = document.querySelector('textarea');
			if (textarea) {
				textarea.value = content;
				textarea.dispatchEvent(new Event('input', { bubbles: true }));
			}
		}, testContent);

		await page.fill('input[placeholder*="Start marker"]', '### Voice Script Segments');
		await page.fill('input[placeholder*="End marker"]', '### Storyboard Images');
		await page.fill('input[placeholder*="Pattern"]', '%o{**}Segment %n:%o{**} (%d characters)');

		const limitInput = page.locator('input[type="number"]').first();
		await limitInput.fill('490');

		await page.click('button:has-text("Process")');
		await page.waitForSelector('text=**Segment 1:**', { timeout: 5000 });

		const resultText = await page.locator('[data-testid="result-editor"]').textContent();

		// The sentences "Like the stopped time..." and "Trying to make me stop too."
		// should stay together, not be split
		expect(resultText).toContain('pressing on me. Trying to make me stop too.');

		// Should NOT have "pressing on me." at the end of one segment
		// followed by "Trying to make me stop too." starting the next
		const hasButcheredSentence = /pressing on me\.\s*\*\*Segment/.test(resultText || '');
		expect(hasButcheredSentence).toBe(false);
	});

	test('should merge tiny fragments with previous chunk when possible', async ({ page }) => {
		const testContent = `### Voice Script Segments

Segment 1: (200 characters) First long sentence here with lots of content to fill up space and make it substantial enough for testing purposes.

Segment 2: (30 characters) A tiny fragment here.

### Storyboard Images`;

		await page.evaluate((content) => {
			const textarea = document.querySelector('textarea');
			if (textarea) {
				textarea.value = content;
				textarea.dispatchEvent(new Event('input', { bubbles: true }));
			}
		}, testContent);

		await page.fill('input[placeholder*="Start marker"]', '### Voice Script Segments');
		await page.fill('input[placeholder*="End marker"]', '### Storyboard Images');
		await page.fill('input[placeholder*="Pattern"]', '%o{**}Segment %n:%o{**} (%d characters)');

		const limitInput = page.locator('input[type="number"]').first();
		await limitInput.fill('490');

		await page.click('button:has-text("Process")');
		await page.waitForSelector('text=**Segment 1:**', { timeout: 5000 });

		const resultText = await page.locator('[data-testid="result-editor"]').textContent();

		// Count how many segments were created
		const segmentCount = (resultText?.match(/\*\*Segment \d+:\*\*/g) || []).length;

		// Should merge into 1 segment since both fit easily under 490
		expect(segmentCount).toBe(1);
	});

	test('should not exceed character limit in any segment', async ({ page }) => {
		const fileContent = readFileSync('./example/writing1.md', 'utf-8');

		await page.evaluate((content) => {
			const textarea = document.querySelector('textarea');
			if (textarea) {
				textarea.value = content;
				textarea.dispatchEvent(new Event('input', { bubbles: true }));
			}
		}, fileContent);

		await page.fill('input[placeholder*="Start marker"]', '### Voice Script Segments');
		await page.fill('input[placeholder*="End marker"]', '### Storyboard Images');
		await page.fill('input[placeholder*="Pattern"]', '%o{**}Segment %n:%o{**} (%d characters)');

		const limitInput = page.locator('input[type="number"]').first();
		await limitInput.fill('490');

		await page.click('button:has-text("Process")');
		await page.waitForSelector('text=**Segment 1:**', { timeout: 10000 });

		const resultText = await page.locator('[data-testid="result-editor"]').textContent();

		// Extract all character counts from segment markers
		const matches = resultText?.matchAll(/\*\*Segment \d+:\*\* \((\d+) characters\)/g);

		if (matches) {
			for (const match of matches) {
				const charCount = parseInt(match[1], 10);
				expect(charCount).toBeLessThanOrEqual(490);
			}
		}
	});

	test('should prefer sentence boundaries over mid-sentence splits', async ({ page }) => {
		// Create content where forcing a split mid-sentence would be tempting
		const testContent = `### Voice Script Segments

Segment 1: (600 characters) This is the first part. Then comes a very long sentence that definitely exceeds the character limit and would normally cause the chunker to split it somewhere in the middle if it was not respecting sentence boundaries properly but we want to make sure it splits at the sentence boundary instead of cutting this sentence in half because that would be a bad user experience. This is the second part that comes after.

### Storyboard Images`;

		await page.evaluate((content) => {
			const textarea = document.querySelector('textarea');
			if (textarea) {
				textarea.value = content;
				textarea.dispatchEvent(new Event('input', { bubbles: true }));
			}
		}, testContent);

		await page.fill('input[placeholder*="Start marker"]', '### Voice Script Segments');
		await page.fill('input[placeholder*="End marker"]', '### Storyboard Images');
		await page.fill('input[placeholder*="Pattern"]', '%o{**}Segment %n:%o{**} (%d characters)');

		const limitInput = page.locator('input[type="number"]').first();
		await limitInput.fill('490');

		await page.click('button:has-text("Process")');
		await page.waitForSelector('text=**Segment 1:**', { timeout: 5000 });

		const resultText = await page.locator('[data-testid="result-editor"]').textContent();
		const segments = resultText?.match(/\*\*Segment \d+:\*\* \(\d+ characters\)\n\n([^*]+)/g) || [];

		// Each segment should end with proper punctuation (or be the last segment)
		for (let i = 0; i < segments.length - 1; i++) {
			const content = segments[i].replace(/\*\*Segment \d+:\*\* \(\d+ characters\)\n\n/, '').trim();
			const endsWithPunctuation = /[.!?]["']?\s*$/.test(content);

			expect(endsWithPunctuation).toBe(true);
		}
	});
});
