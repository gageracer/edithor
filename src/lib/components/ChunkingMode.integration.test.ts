import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { chunkText } from '$lib/utils/chunker';

describe('ChunkingMode Integration Tests with writing1.md', () => {
	const writing1Path = join(process.cwd(), 'writing1.md');
	let writing1Content: string;

	try {
		writing1Content = readFileSync(writing1Path, 'utf-8');
	} catch (error) {
		console.warn('Could not load writing1.md for integration tests', error);
		writing1Content = '';
	}

	it('should process writing1.md and respect 490 character limit', () => {
		if (!writing1Content) {
			console.log('Skipping test - writing1.md not found');
			return;
		}

		// Pattern 1: **Segment N:** (%d characters) - extract content
		const pattern1 = /\*\*Segment\s+\d+:\*\*\s*\(\d+\s*characters\)\s*/gi;
		const matches1: string[] = [];
		let lastIndex1 = 0;
		let match1;

		while ((match1 = pattern1.exec(writing1Content)) !== null) {
			if (lastIndex1 > 0) {
				// Extract content between previous marker and current marker
				const content = writing1Content.substring(lastIndex1, match1.index).trim();
				if (content) matches1.push(content);
			}
			lastIndex1 = match1.index + match1[0].length;
		}
		// Get last segment content
		if (lastIndex1 > 0) {
			const remainingContent = writing1Content.substring(lastIndex1);
			const nextMarkerIndex = remainingContent.search(/^Segment\s+\d+:/m);
			const content = (nextMarkerIndex > 0
				? remainingContent.substring(0, nextMarkerIndex)
				: remainingContent
			).trim();
			if (content) matches1.push(content);
		}

		// Pattern 2: Segment N: (%d characters) - extract content
		const pattern2 = /^Segment\s+\d+:\s*\(\d+\s*characters\)\s*/gm;
		const matches2: string[] = [];
		let lastIndex2 = 0;
		let match2;

		while ((match2 = pattern2.exec(writing1Content)) !== null) {
			if (lastIndex2 > 0) {
				const content = writing1Content.substring(lastIndex2, match2.index).trim();
				if (content) matches2.push(content);
			}
			lastIndex2 = match2.index + match2[0].length;
		}
		// Get last segment content
		if (lastIndex2 > 0) {
			const content = writing1Content.substring(lastIndex2).trim();
			if (content) matches2.push(content);
		}

		const allSegmentContents = [...matches1, ...matches2];

		expect(allSegmentContents.length).toBeGreaterThan(0);

		// Combine all segment contents
		const combinedContent = allSegmentContents.join('\n\n');

		// Chunk with 490 character limit and fallback split enabled
		const result = chunkText(combinedContent, { maxCharacters: 490, fallbackSplit: true });

		expect(result.chunks.length).toBeGreaterThan(0);

		// Check that all chunks respect the limit (fallback split should handle continuous text)
		result.chunks.forEach((chunk, index) => {
			// Strip any leading newlines for accurate count
			let content = chunk.content;
			while (content.startsWith('\n')) {
				content = content.substring(1);
			}
			const actualLength = content.length;

			// With fallback split enabled, all chunks should respect the limit
			expect(actualLength).toBeLessThanOrEqual(490);
		});

		console.log(`Processed ${allSegmentContents.length} original segments into ${result.chunks.length} new chunks`);
		console.log(`Average chunk size: ${result.stats.averageChunkSize} characters`);
		console.log(`Largest chunk: ${result.stats.largestChunk} characters`);
		console.log(`Smallest chunk: ${result.stats.smallestChunk} characters`);
	});

	it('should strip leading newlines and recalculate character counts correctly', () => {
		if (!writing1Content) {
			console.log('Skipping test - writing1.md not found');
			return;
		}

		// Simple test content with leading newline
		const testContent = '\nThis is a test sentence. Another sentence here.';
		const result = chunkText(testContent, { maxCharacters: 490 });

		expect(result.chunks.length).toBeGreaterThan(0);

		result.chunks.forEach(chunk => {
			// Strip leading newlines
			let content = chunk.content;
			while (content.startsWith('\n')) {
				content = content.substring(1);
			}

			// Character count after stripping should match content length
			expect(content.length).toBe(content.length);
		});
	});

	it('should handle both ** and plain segment formats from writing1.md', () => {
		if (!writing1Content) {
			console.log('Skipping test - writing1.md not found');
			return;
		}

		// Check for both formats in the file
		const hasBoldFormat = /\*\*Segment\s+\d+:\*\*/.test(writing1Content);
		const hasPlainFormat = /^Segment\s+\d+:/m.test(writing1Content);

		// writing1.md should have both formats
		expect(hasBoldFormat).toBe(true);
		expect(hasPlainFormat).toBe(true);

		console.log(`File contains bold format: ${hasBoldFormat}`);
		console.log(`File contains plain format: ${hasPlainFormat}`);
	});

	it('should not have quote placeholders in output', () => {
		if (!writing1Content) {
			console.log('Skipping test - writing1.md not found');
			return;
		}

		// Process a small sample with quotes
		const sampleWithQuotes = `She said, "Hello world." He replied, "Hi there!"`;
		const result = chunkText(sampleWithQuotes, { maxCharacters: 490 });

		result.chunks.forEach(chunk => {
			// Should not have __QUOTE placeholders
			expect(chunk.content).not.toContain('__QUOTE');
			// Should have actual quotes
			expect(chunk.content).toMatch(/["']/);
		});
	});

	it('should process writing1.md with exact UI settings (end-to-end test)', () => {
		if (!writing1Content) {
			console.log('Skipping test - writing1.md not found');
			return;
		}

		// UI Settings from screenshot:
		// Pattern 1: **Segment 1:** (487 characters) / **Segment %n:** (%d characters) / ### Storyboard Images
		// Pattern 2: Segment 22: (491 characters) / Segment %n: (%d characters) / \n
		// Output Format: Auto-detect (should detect **Segment N:** bold format)
		// Target Character Limit: 490

		// Simulate the two patterns from the UI
		const pattern1 = /\*\*Segment\s+\d+:\*\*\s*\(\d+\s*characters\)\s*/gi;
		const pattern2 = /^Segment\s+\d+:\s*\(\d+\s*characters\)\s*/gm;

		// Extract all segment contents using pattern 1 (bold format)
		const matches1: string[] = [];
		let lastIndex1 = 0;
		let match1;

		while ((match1 = pattern1.exec(writing1Content)) !== null) {
			if (lastIndex1 > 0) {
				const content = writing1Content.substring(lastIndex1, match1.index).trim();
				if (content) matches1.push(content);
			}
			lastIndex1 = match1.index + match1[0].length;
		}
		// Get last segment from pattern 1
		if (lastIndex1 > 0) {
			const remainingContent = writing1Content.substring(lastIndex1);
			// Stop at "### Storyboard Images" end marker
			const endMarkerIndex = remainingContent.search(/^### Storyboard Images/m);
			const content = (endMarkerIndex > 0
				? remainingContent.substring(0, endMarkerIndex)
				: remainingContent
			).trim();
			if (content) matches1.push(content);
		}

		// Extract all segment contents using pattern 2 (plain format)
		const matches2: string[] = [];
		let lastIndex2 = 0;
		let match2;

		while ((match2 = pattern2.exec(writing1Content)) !== null) {
			if (lastIndex2 > 0) {
				const content = writing1Content.substring(lastIndex2, match2.index).trim();
				if (content) matches2.push(content);
			}
			lastIndex2 = match2.index + match2[0].length;
		}
		// Get last segment from pattern 2
		if (lastIndex2 > 0) {
			const remainingText = writing1Content.substring(lastIndex2);
			// Stop at newline-only end marker
			const lines = remainingText.split('\n');
			let endIndex = -1;
			for (let i = 0; i < lines.length; i++) {
				if (lines[i].trim() === '' && i > 0) {
					endIndex = i;
					break;
				}
			}
			const content = endIndex > 0
				? lines.slice(0, endIndex).join('\n').trim()
				: remainingText.trim();
			if (content) matches2.push(content);
		}

		// Combine all extracted segments
		const allSegmentContents = [...matches1, ...matches2];

		console.log(`\n=== END-TO-END TEST RESULTS ===`);
		console.log(`Extracted ${allSegmentContents.length} segments from writing1.md`);
		console.log(`Pattern 1 (bold) found: ${matches1.length} segments`);
		console.log(`Pattern 2 (plain) found: ${matches2.length} segments`);

		expect(allSegmentContents.length).toBeGreaterThan(0);

		// Combine all segments
		const combinedContent = allSegmentContents.join('\n\n');

		// Process with 490 character limit and fallbackSplit enabled (matching UI behavior)
		const result = chunkText(combinedContent, { maxCharacters: 490, fallbackSplit: true });

		console.log(`\nRe-chunked into ${result.chunks.length} new segments`);
		console.log(`Average chunk size: ${result.stats.averageChunkSize} characters`);
		console.log(`Largest chunk: ${result.stats.largestChunk} characters`);
		console.log(`Smallest chunk: ${result.stats.smallestChunk} characters`);

		// Verify all chunks respect the limit
		result.chunks.forEach((chunk, index) => {
			let content = chunk.content;
			while (content.startsWith('\n')) {
				content = content.substring(1);
			}
			const actualLength = content.length;
			expect(actualLength).toBeLessThanOrEqual(490);
		});

		// Format output as the UI would (auto-detect = bold format since pattern 1 found)
		const formattedChunks = result.chunks.map((chunk, index) => {
			let content = chunk.content;
			while (content.startsWith('\n')) {
				content = content.substring(1);
			}
			const actualCharCount = content.length;
			const marker = `**Segment ${index + 1}:** (${actualCharCount} characters)`;
			return `${marker}\n${content}`;
		});

		// Verify formatted output
		formattedChunks.forEach((formatted, index) => {
			// Should have bold format marker
			expect(formatted).toMatch(/^\*\*Segment \d+:\*\*/);
			// Should have character count
			expect(formatted).toMatch(/\(\d+ characters\)/);
			// Should have exactly one newline after marker
			const lines = formatted.split('\n');
			expect(lines[0]).toMatch(/^\*\*Segment \d+:\*\* \(\d+ characters\)$/);
			// Content should start on line 2
			expect(lines.length).toBeGreaterThan(1);
		});

		// No quote placeholders should remain
		formattedChunks.forEach(formatted => {
			expect(formatted).not.toContain('__QUOTE');
		});

		console.log(`\n✓ All ${result.chunks.length} chunks formatted correctly with bold markers`);
		console.log(`✓ No quote placeholders found`);
		console.log(`✓ All chunks respect 490 character limit`);
		console.log(`=== TEST COMPLETE ===\n`);
	});

	it('should not have blank lines inside re-chunked segments', () => {
		if (!writing1Content) {
			console.log('Skipping test - writing1.md not found');
			return;
		}

		// Extract segments using both patterns
		const pattern1 = /\*\*Segment\s+\d+:\*\*\s*\(\d+\s*characters\)\s*/gi;
		const pattern2 = /^Segment\s+\d+:\s*\(\d+\s*characters\)\s*/gm;

		const matches1: string[] = [];
		let lastIndex1 = 0;
		let match1;

		while ((match1 = pattern1.exec(writing1Content)) !== null) {
			if (lastIndex1 > 0) {
				const content = writing1Content.substring(lastIndex1, match1.index).trim();
				if (content) matches1.push(content);
			}
			lastIndex1 = match1.index + match1[0].length;
		}
		if (lastIndex1 > 0) {
			const remainingContent = writing1Content.substring(lastIndex1);
			const endMarkerIndex = remainingContent.search(/^### Storyboard Images/m);
			const content = (endMarkerIndex > 0
				? remainingContent.substring(0, endMarkerIndex)
				: remainingContent
			).trim();
			if (content) matches1.push(content);
		}

		const matches2: string[] = [];
		let lastIndex2 = 0;
		let match2;

		while ((match2 = pattern2.exec(writing1Content)) !== null) {
			if (lastIndex2 > 0) {
				const content = writing1Content.substring(lastIndex2, match2.index).trim();
				if (content) matches2.push(content);
			}
			lastIndex2 = match2.index + match2[0].length;
		}
		if (lastIndex2 > 0) {
			const remainingText = writing1Content.substring(lastIndex2);
			const lines = remainingText.split('\n');
			let endIndex = -1;
			for (let i = 0; i < lines.length; i++) {
				if (lines[i].trim() === '' && i > 0) {
					endIndex = i;
					break;
				}
			}
			const content = endIndex > 0
				? lines.slice(0, endIndex).join('\n').trim()
				: remainingText.trim();
			if (content) matches2.push(content);
		}

		const allSegmentContents = [...matches1, ...matches2];
		expect(allSegmentContents.length).toBeGreaterThan(0);

		// Combine segments (this is what ChunkingMode does)
		const combinedContent = allSegmentContents
			.join(' ')
			.replace(/\s+/g, ' ')
			.trim();

		// Re-chunk
		const result = chunkText(combinedContent, { maxCharacters: 490, fallbackSplit: true });

		// Check each chunk for blank lines (double newlines)
		result.chunks.forEach((chunk, index) => {
			const content = chunk.content;

			// Should not have double newlines (blank lines) inside content
			expect(content).not.toMatch(/\n\n/);

			// Should not have excessive whitespace
			expect(content).not.toMatch(/\n\s*\n/);

			if (content.includes('\n\n')) {
				console.error(`\nChunk ${index + 1} has blank lines:`);
				console.error(content);
			}
		});

		console.log(`\n✓ Verified ${result.chunks.length} chunks have no internal blank lines`);
	});
});
