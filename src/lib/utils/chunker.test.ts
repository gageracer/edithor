import { describe, it, expect } from "vitest";
import { chunkText, exportAsSingleFile, prepareMultipleFiles } from "./chunker";
import type { ChunkSettings } from "$lib/types";

describe("chunkText", () => {
	describe("basic functionality", () => {
		it("should split text into chunks respecting sentence boundaries", () => {
			const text =
				"This is sentence one. This is sentence two. This is sentence three.";
			const settings: ChunkSettings = { maxCharacters: 30 };

			const result = chunkText(text, settings);

			expect(result.chunks.length).toBeGreaterThan(1);
			result.chunks.forEach((chunk) => {
				expect(chunk.characterCount).toBeLessThanOrEqual(30);
			});
		});

		it("should create a single chunk when text is under limit", () => {
			const text = "Short text.";
			const settings: ChunkSettings = { maxCharacters: 500 };

			const result = chunkText(text, settings);

			expect(result.chunks).toHaveLength(1);
			expect(result.chunks[0].content).toBe("Short text.");
		});

		it("should assign sequential IDs to chunks", () => {
			const text =
				"First sentence. Second sentence. Third sentence. Fourth sentence. Fifth sentence.";
			const settings: ChunkSettings = { maxCharacters: 30 };

			const result = chunkText(text, settings);

			result.chunks.forEach((chunk, index) => {
				expect(chunk.id).toBe(index + 1);
			});
		});

		it("should not break sentences mid-way", () => {
			const text =
				"This is a very long sentence that exceeds the limit. Short one.";
			const settings: ChunkSettings = { maxCharacters: 30 };

			const result = chunkText(text, settings);

			result.chunks.forEach((chunk) => {
				// Each chunk should end with proper punctuation
				expect(chunk.content).toMatch(/[.!?]$/);
			});
		});
	});

	describe("sentence detection", () => {
		it("should detect sentences ending with period", () => {
			const text = "First. Second. Third.";
			const settings: ChunkSettings = { maxCharacters: 10 };

			const result = chunkText(text, settings);

			expect(result.chunks.length).toBe(3);
		});

		it("should detect sentences ending with exclamation mark", () => {
			const text = "Wow! Amazing! Great!";
			const settings: ChunkSettings = { maxCharacters: 10 };

			const result = chunkText(text, settings);

			expect(result.chunks.length).toBe(3);
		});

		it("should detect sentences ending with question mark", () => {
			const text = "What? Why? How?";
			const settings: ChunkSettings = { maxCharacters: 10 };

			const result = chunkText(text, settings);

			// Should detect question marks as sentence endings
			expect(result.chunks.length).toBeGreaterThan(0);
			result.chunks.forEach((chunk) => {
				expect(chunk.content).toContain("?");
			});
		});

		it("should handle multiple punctuation marks", () => {
			const text = "Really!!! What??? Yes...";
			const settings: ChunkSettings = { maxCharacters: 15 };

			const result = chunkText(text, settings);

			expect(result.chunks.length).toBeGreaterThan(0);
			result.chunks.forEach((chunk) => {
				expect(chunk.content.length).toBeGreaterThan(0);
			});
		});

		it("should handle ellipsis correctly without splitting dots", () => {
			const text = "This is sentence one... This is sentence two.";
			const settings: ChunkSettings = { maxCharacters: 30 };

			const result = chunkText(text, settings);

			// Should split into 2 chunks, keeping ellipsis with first sentence
			expect(result.chunks.length).toBe(2);
			expect(result.chunks[0].content).toContain("one...");
			expect(result.chunks[1].content).toContain("This is sentence two.");
			// Make sure the second sentence doesn't start with dots
			expect(result.chunks[1].content).not.toMatch(/^\.\./);
		});

		it("should handle abbreviations correctly", () => {
			const text = "Dr. Smith went to Mrs. Jones. They discussed etc.";
			const settings: ChunkSettings = { maxCharacters: 100 };

			const result = chunkText(text, settings);

			// Should recognize abbreviations and not split incorrectly
			expect(result.chunks.length).toBeGreaterThan(0);
			expect(result.chunks[0].content).toContain("Dr.");
			expect(result.chunks[0].content).toContain("Mrs.");
		});

		it("should handle quoted dialogue with internal punctuation", () => {
			const text = `After twenty minutes, she walked over and said, "You're not actually working. Your screen's been on the same page this whole time."`;
			const settings: ChunkSettings = { maxCharacters: 500 };

			const result = chunkText(text, settings);

			// Should treat the entire quoted sentence as one unit, not split on internal punctuation
			expect(result.chunks).toHaveLength(1);
			expect(result.chunks[0].content).toBe(text);
			expect(result.chunks[0].sentenceCount).toBe(1);
			// Should not have a floating quote mark
			expect(result.chunks[0].content).not.toMatch(/^\s*["']/);
		});

		it("should handle multiple quoted sentences in sequence", () => {
			const text = `I laughed, caught. "Guilty. I'm Tom." "Sarah," she said, extending her hand.`;
			const settings: ChunkSettings = { maxCharacters: 500 };

			const result = chunkText(text, settings);

			// Should recognize sentence boundaries correctly
			expect(result.chunks).toHaveLength(1);
			expect(result.chunks[0].content).toContain("Guilty");
			expect(result.chunks[0].content).toContain("Tom");
			expect(result.chunks[0].content).toContain("Sarah");
		});
	});

	describe("edge cases", () => {
		it("should handle empty string", () => {
			const text = "";
			const settings: ChunkSettings = { maxCharacters: 500 };

			const result = chunkText(text, settings);

			expect(result.chunks).toHaveLength(0);
			expect(result.stats.totalChunks).toBe(0);
		});

		it("should handle whitespace-only string", () => {
			const text = "   \n\t  ";
			const settings: ChunkSettings = { maxCharacters: 500 };

			const result = chunkText(text, settings);

			expect(result.chunks).toHaveLength(0);
		});

		it("should handle text without punctuation", () => {
			const text = "This text has no ending punctuation";
			const settings: ChunkSettings = { maxCharacters: 500 };

			const result = chunkText(text, settings);

			expect(result.chunks).toHaveLength(1);
			expect(result.chunks[0].content).toBe(text);
		});

		it("should handle sentence longer than max characters", () => {
			const text =
				"This is an extremely long sentence that exceeds the maximum character limit.";
			const settings: ChunkSettings = { maxCharacters: 20 };

			const result = chunkText(text, settings);

			// Long sentence should be its own chunk, even if it exceeds limit
			expect(result.chunks).toHaveLength(1);
			expect(result.chunks[0].characterCount).toBeGreaterThan(20);
		});

		it("should handle multiple long sentences", () => {
			const text =
				"This is a very long first sentence that exceeds the limit. This is another very long second sentence that also exceeds the limit.";
			const settings: ChunkSettings = { maxCharacters: 30 };

			const result = chunkText(text, settings);

			// Each long sentence should be its own chunk
			expect(result.chunks).toHaveLength(2);
		});

		it("should throw error for invalid maxCharacters", () => {
			const text = "Some text.";
			const settings: ChunkSettings = { maxCharacters: 0 };

			expect(() => chunkText(text, settings)).toThrow(
				"maxCharacters must be greater than 0",
			);
		});

		it("should throw error for negative maxCharacters", () => {
			const text = "Some text.";
			const settings: ChunkSettings = { maxCharacters: -100 };

			expect(() => chunkText(text, settings)).toThrow(
				"maxCharacters must be greater than 0",
			);
		});

		it("should throw error for continuous text without punctuation exceeding limit", () => {
			// Create 600 characters of continuous text without sentence boundaries
			const text = "a".repeat(600);
			const settings: ChunkSettings = { maxCharacters: 500 };

			expect(() => chunkText(text, settings)).toThrow(
				/continuous content.*without sentence boundaries.*exceeds the limit/i
			);
		});

		it("should throw error for long text without proper sentence endings", () => {
			const text = "This is a very long piece of text that just keeps going and going without any proper punctuation marks at all and it exceeds the character limit by quite a bit but there are no periods or exclamation marks or question marks to break it up into manageable chunks";
			const settings: ChunkSettings = { maxCharacters: 50 };

			expect(() => chunkText(text, settings)).toThrow(
				/continuous content.*without sentence boundaries.*exceeds the limit/i
			);
		});

		it("should throw error for mixed content with trailing continuous text exceeding limit", () => {
			// First part is short with punctuation, second part is continuous and exceeds limit (550+ chars)
			const text = "Short sentence. " + "a".repeat(550);
			const settings: ChunkSettings = { maxCharacters: 500 };

			expect(() => chunkText(text, settings)).toThrow(
				/continuous content.*without sentence boundaries.*exceeds the limit/i
			);
		});
	});

	describe("fallback split", () => {
		it("should preserve quotes when force splitting text", () => {
			// This is the exact scenario from writing1.md that was failing
			const text = 'She read mystery novels obsessively—the darker, the better. "I like figuring out the twist before the author reveals it," she told me once. I joked that she was too smart for her own good. She didn\'t laugh at that.';
			const settings: ChunkSettings = { maxCharacters: 100, fallbackSplit: true };

			const result = chunkText(text, settings);

			// Should be split into multiple chunks due to length
			expect(result.chunks.length).toBeGreaterThan(1);

			// Combine all chunks back together
			const combined = result.chunks.map(c => c.content).join(' ');

			// Should NOT contain any __QUOTE placeholders
			expect(combined).not.toContain('__QUOTE');

			// Should contain the actual quote
			expect(combined).toContain('"I like figuring out the twist before the author reveals it,"');
		});

		it("should force split continuous text when fallbackSplit is enabled", () => {
			// Create 800 characters of continuous text without sentence boundaries
			const text = "a".repeat(800);
			const settings: ChunkSettings = { maxCharacters: 500, fallbackSplit: true };

			const result = chunkText(text, settings);

			// Should be split into 2 chunks
			expect(result.chunks.length).toBe(2);
			// All chunks should respect the limit
			result.chunks.forEach(chunk => {
				expect(chunk.characterCount).toBeLessThanOrEqual(500);
			});
		});

		it("should force split long sentences when fallbackSplit is enabled", () => {
			// Create a long sentence that exceeds the limit
			const text = "This is a very long sentence that continues on and on and on and on and on and on and on and on and on and on and on and on and on and on and on and on and on and on and on and on and on and on and on and on and on and on and on and on and on and on and on and on and on and on and on and on and on and on and on and on and on and on and on and on and on and on and on and on and on and on and on and on and on and on and on and on and on and on and on.";
			const settings: ChunkSettings = { maxCharacters: 200, fallbackSplit: true };

			const result = chunkText(text, settings);

			// Should be split into multiple chunks
			expect(result.chunks.length).toBeGreaterThan(1);
			// All chunks should respect the limit
			result.chunks.forEach(chunk => {
				expect(chunk.characterCount).toBeLessThanOrEqual(200);
			});
		});

		it("should split at word boundaries when possible with fallbackSplit", () => {
			// Create text that can be split at word boundaries
			const text = "word ".repeat(200); // 1000 characters
			const settings: ChunkSettings = { maxCharacters: 300, fallbackSplit: true };

			const result = chunkText(text, settings);

			// Check that splits happen at word boundaries (no broken words)
			result.chunks.forEach(chunk => {
				const content = chunk.content.trim();
				// Should not start or end with partial words
				expect(content).toMatch(/^\w+/);
				expect(content).toMatch(/\w+$/);
			});
		});

		it("should preserve normal sentence chunking when fallbackSplit is enabled but not needed", () => {
			const text = "First sentence. Second sentence. Third sentence.";
			const settings: ChunkSettings = { maxCharacters: 500, fallbackSplit: true };

			const result = chunkText(text, settings);

			// Should be combined into one chunk since it fits
			expect(result.chunks.length).toBe(1);
			expect(result.chunks[0].content).toBe(text);
		});

		it("should handle mixed normal and oversized content with fallbackSplit", () => {
			const normalText = "Short sentence. ";
			const longText = "a".repeat(600);
			const text = normalText + longText;
			const settings: ChunkSettings = { maxCharacters: 500, fallbackSplit: true };

			const result = chunkText(text, settings);

			// Should split the continuous text
			expect(result.chunks.length).toBeGreaterThan(1);
			// All chunks should respect the limit
			result.chunks.forEach(chunk => {
				expect(chunk.characterCount).toBeLessThanOrEqual(500);
			});
		});
	});

	describe("chunk metadata", () => {
		it("should correctly count characters in each chunk", () => {
			const text = "First sentence. Second sentence.";
			const settings: ChunkSettings = { maxCharacters: 20 };

			const result = chunkText(text, settings);

			result.chunks.forEach((chunk) => {
				expect(chunk.characterCount).toBe(chunk.content.length);
			});
		});

		it("should correctly count sentences in each chunk", () => {
			const text = "One. Two. Three. Four.";
			const settings: ChunkSettings = { maxCharacters: 15 };

			const result = chunkText(text, settings);

			result.chunks.forEach((chunk) => {
				expect(chunk.sentenceCount).toBeGreaterThan(0);
			});
		});
	});

	describe("statistics", () => {
		it("should calculate correct total chunks", () => {
			const text = "First. Second. Third.";
			const settings: ChunkSettings = { maxCharacters: 10 };

			const result = chunkText(text, settings);

			expect(result.stats.totalChunks).toBe(result.chunks.length);
		});

		it("should calculate correct total characters", () => {
			const text = "First sentence. Second sentence.";
			const settings: ChunkSettings = { maxCharacters: 500 };

			const result = chunkText(text, settings);

			const expectedTotal = result.chunks.reduce(
				(sum, chunk) => sum + chunk.characterCount,
				0,
			);
			expect(result.stats.totalCharacters).toBe(expectedTotal);
		});

		it("should calculate correct average chunk size", () => {
			const text = "One. Two. Three.";
			const settings: ChunkSettings = { maxCharacters: 10 };

			const result = chunkText(text, settings);

			const calculatedAvg = Math.round(
				result.stats.totalCharacters / result.stats.totalChunks,
			);
			expect(result.stats.averageChunkSize).toBe(calculatedAvg);
		});

		it("should identify largest chunk", () => {
			const text = "Short. This is a much longer sentence. Tiny.";
			const settings: ChunkSettings = { maxCharacters: 100 };

			const result = chunkText(text, settings);

			const maxSize = Math.max(...result.chunks.map((c) => c.characterCount));
			expect(result.stats.largestChunk).toBe(maxSize);
		});

		it("should identify smallest chunk", () => {
			const text = "Short. This is a much longer sentence. Tiny.";
			const settings: ChunkSettings = { maxCharacters: 100 };

			const result = chunkText(text, settings);

			const minSize = Math.min(...result.chunks.map((c) => c.characterCount));
			expect(result.stats.smallestChunk).toBe(minSize);
		});

		it("should return zero stats for empty text", () => {
			const text = "";
			const settings: ChunkSettings = { maxCharacters: 500 };

			const result = chunkText(text, settings);

			expect(result.stats.totalChunks).toBe(0);
			expect(result.stats.totalCharacters).toBe(0);
			expect(result.stats.averageChunkSize).toBe(0);
			expect(result.stats.largestChunk).toBe(0);
			expect(result.stats.smallestChunk).toBe(0);
		});
	});

	describe("realistic scenarios", () => {
		it("should handle default 500 character limit appropriately", () => {
			const text =
				"This is a realistic voiceover script. It contains multiple sentences that need to be chunked. " +
				"The chunking algorithm should preserve sentence boundaries. Each chunk should be consumable by AI tools. " +
				"This ensures that the voiceover remains coherent and natural. No sentence should be cut in the middle. " +
				"The maximum character limit helps maintain optimal processing size.";
			const settings: ChunkSettings = { maxCharacters: 500 };

			const result = chunkText(text, settings);

			expect(result.chunks.length).toBeGreaterThan(0);
			result.chunks.forEach((chunk) => {
				expect(chunk.characterCount).toBeLessThanOrEqual(500);
			});
		});

		it("should handle paragraphs with newlines", () => {
			const text = "First paragraph sentence.\n\nSecond paragraph sentence.";
			const settings: ChunkSettings = { maxCharacters: 500 };

			const result = chunkText(text, settings);

			expect(result.chunks.length).toBeGreaterThan(0);
		});
	});
});

describe("exportAsSingleFile", () => {
	it("should export chunks without numbered headers", () => {
		const text = "First sentence. Second sentence. Third sentence.";
		const settings: ChunkSettings = { maxCharacters: 20 };
		const result = chunkText(text, settings);

		const exported = exportAsSingleFile(result.chunks);

		// Should not contain "Chunk" labels
		expect(exported).not.toContain("Chunk 1");
		expect(exported).not.toContain("Chunk 2");
		// Should contain the actual content
		expect(exported).toContain("First sentence.");
		expect(exported).toContain("Second sentence.");
	});

	it("should separate chunks with double newlines", () => {
		const text = "First. Second.";
		const settings: ChunkSettings = { maxCharacters: 10 };
		const result = chunkText(text, settings);

		const exported = exportAsSingleFile(result.chunks);

		expect(exported).toContain("\n\n");
	});

	it("should handle empty chunks array", () => {
		const exported = exportAsSingleFile([]);

		expect(exported).toBe("");
	});

	it('should preserve original content in export', () => {
		const text = 'Test sentence with special chars: @#$%!';
		const settings: ChunkSettings = { maxCharacters: 500 };
		const result = chunkText(text, settings);

		const exported = exportAsSingleFile(result.chunks);

		expect(exported).toContain(text);
	});

	it('should join chunks with double newlines', () => {
		const text = 'First sentence. Second sentence. Third sentence.';
		const settings: ChunkSettings = { maxCharacters: 20 };
		const result = chunkText(text, settings);

		const exported = exportAsSingleFile(result.chunks);

		// Should have double newlines between chunks
		expect(exported).toContain('\n\n');
		// Should contain all content
		expect(exported).toContain('First sentence.');
		expect(exported).toContain('Second sentence.');
	});

	it('should preserve content exactly as is without adding newlines', () => {
		const chunks: Chunk[] = [
			{ id: 1, content: 'First chunk', characterCount: 11, sentenceCount: 1 },
			{ id: 2, content: 'Second chunk', characterCount: 12, sentenceCount: 1 }
		];

		const exported = exportAsSingleFile(chunks);

		// Should not add newlines to content
		expect(exported).toBe('First chunk\n\nSecond chunk');
	});
});

describe("prepareMultipleFiles", () => {
	it("should create files with correct naming pattern", () => {
		const text = "First. Second. Third.";
		const settings: ChunkSettings = { maxCharacters: 10 };
		const result = chunkText(text, settings);

		const files = prepareMultipleFiles(result.chunks);

		expect(files[0].filename).toBe("chunk-1.txt");
		expect(files[1].filename).toBe("chunk-2.txt");
	});

	it("should include chunk content in each file", () => {
		const text = "First sentence. Second sentence.";
		const settings: ChunkSettings = { maxCharacters: 20 };
		const result = chunkText(text, settings);

		const files = prepareMultipleFiles(result.chunks);

		files.forEach((file, index) => {
			expect(file.content).toBe(result.chunks[index].content);
		});
	});

	it("should return correct number of files", () => {
		const text = "One. Two. Three. Four.";
		const settings: ChunkSettings = { maxCharacters: 10 };
		const result = chunkText(text, settings);

		const files = prepareMultipleFiles(result.chunks);

		expect(files.length).toBe(result.chunks.length);
	});

	it("should handle empty chunks array", () => {
		const files = prepareMultipleFiles([]);

		expect(files).toHaveLength(0);
	});

	it("should handle single chunk", () => {
		const text = "Single short sentence.";
		const settings: ChunkSettings = { maxCharacters: 500 };
		const result = chunkText(text, settings);

		const files = prepareMultipleFiles(result.chunks);

		expect(files).toHaveLength(1);
		expect(files[0].filename).toBe("chunk-1.txt");
		expect(files[0].content).toBe(text);
	});
});
