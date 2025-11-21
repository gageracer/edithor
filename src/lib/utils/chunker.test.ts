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
	it("should format chunks with numbered headers", () => {
		const text = "First sentence. Second sentence. Third sentence.";
		const settings: ChunkSettings = { maxCharacters: 20 };
		const result = chunkText(text, settings);

		const exported = exportAsSingleFile(result.chunks);

		expect(exported).toContain("Chunk 1");
		expect(exported).toContain("Chunk 2");
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

	it("should preserve original content in export", () => {
		const text = "Test sentence with special chars: @#$%!";
		const settings: ChunkSettings = { maxCharacters: 500 };
		const result = chunkText(text, settings);

		const exported = exportAsSingleFile(result.chunks);

		expect(exported).toContain(text);
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
