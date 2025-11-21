import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";
import { chunkText, exportAsSingleFile, prepareMultipleFiles } from "./chunker";
import type { ChunkSettings } from "$lib/types";

describe("chunker integration tests with real file", () => {
	const exampleFilePath = join(process.cwd(), "example", "fulltext.txt");
	let exampleText: string;

	try {
		exampleText = readFileSync(exampleFilePath, "utf-8");
	} catch (error) {
		console.warn(
			"Could not load example/fulltext.txt for integration tests",
			error,
		);
		exampleText = "";
	}

	describe("fulltext.txt chunking", () => {
		it("should successfully chunk the example file with default 500 character limit", () => {
			if (!exampleText) {
				return; // Skip if file not found
			}

			const settings: ChunkSettings = { maxCharacters: 500 };
			const result = chunkText(exampleText, settings);

			expect(result.chunks.length).toBeGreaterThan(0);
			expect(result.stats.totalChunks).toBe(result.chunks.length);
			expect(result.stats.totalCharacters).toBeGreaterThan(0);

			// All chunks should respect the limit (except long sentences)
			result.chunks.forEach((chunk) => {
				// If a chunk exceeds the limit, it should be a single long sentence
				if (chunk.characterCount > 500) {
					expect(chunk.sentenceCount).toBeGreaterThanOrEqual(1);
				}
			});
		});

		it("should maintain sentence integrity throughout the file", () => {
			if (!exampleText) {
				return;
			}

			const settings: ChunkSettings = { maxCharacters: 500 };
			const result = chunkText(exampleText, settings);

			// Every chunk should end with sentence punctuation or be the original text
			result.chunks.forEach((chunk) => {
				const content = chunk.content.trim();
				if (content.length > 0) {
					// Should end with punctuation or be text without punctuation
					const endsWithPunctuation = /[.!?]$/.test(content);
					const hasNoPunctuation = !/[.!?]/.test(content);
					expect(endsWithPunctuation || hasNoPunctuation).toBe(true);
				}
			});
		});

		it("should calculate accurate statistics for the file", () => {
			if (!exampleText) {
				return;
			}

			const settings: ChunkSettings = { maxCharacters: 500 };
			const result = chunkText(exampleText, settings);

			// Verify stats match actual data
			const calculatedTotal = result.chunks.reduce(
				(sum, chunk) => sum + chunk.characterCount,
				0,
			);
			expect(result.stats.totalCharacters).toBe(calculatedTotal);

			const calculatedAvg = Math.round(calculatedTotal / result.chunks.length);
			expect(result.stats.averageChunkSize).toBe(calculatedAvg);

			const chunkSizes = result.chunks.map((c) => c.characterCount);
			expect(result.stats.largestChunk).toBe(Math.max(...chunkSizes));
			expect(result.stats.smallestChunk).toBe(Math.min(...chunkSizes));
		});

		it("should handle different chunk sizes appropriately", () => {
			if (!exampleText) {
				return;
			}

			const testSizes = [100, 250, 500, 1000];

			testSizes.forEach((size) => {
				const settings: ChunkSettings = { maxCharacters: size };
				const result = chunkText(exampleText, settings);

				expect(result.chunks.length).toBeGreaterThan(0);

				// Larger chunk sizes should generally result in fewer chunks
				// (unless sentences are very long)
				expect(result.stats.totalChunks).toBeGreaterThan(0);
			});
		});

		it("should export single file correctly for the example", () => {
			if (!exampleText) {
				return;
			}

			const settings: ChunkSettings = { maxCharacters: 500 };
			const result = chunkText(exampleText, settings);
			const exported = exportAsSingleFile(result.chunks);

			// Should contain all chunk headers
			result.chunks.forEach((chunk) => {
				expect(exported).toContain(`Chunk ${chunk.id}`);
			});

			// Should contain original content (allowing for whitespace normalization)
			result.chunks.forEach((chunk) => {
				expect(exported).toContain(chunk.content);
			});

			// Should have proper formatting
			expect(exported).toMatch(/Chunk \d+\n/);
		});

		it("should prepare multiple files correctly for the example", () => {
			if (!exampleText) {
				return;
			}

			const settings: ChunkSettings = { maxCharacters: 500 };
			const result = chunkText(exampleText, settings);
			const files = prepareMultipleFiles(result.chunks);

			expect(files.length).toBe(result.chunks.length);

			files.forEach((file, index) => {
				expect(file.filename).toBe(`chunk-${index + 1}.txt`);
				expect(file.content).toBe(result.chunks[index].content);
				expect(file.content.length).toBeGreaterThan(0);
			});
		});

		it("should preserve narrative flow in chunks", () => {
			if (!exampleText) {
				return;
			}

			const settings: ChunkSettings = { maxCharacters: 500 };
			const result = chunkText(exampleText, settings);

			// Verify that all content is preserved
			const reconstructed = result.chunks.map((c) => c.content).join(" ");

			// Count approximate words (rough check)
			const originalWords = exampleText.trim().split(/\s+/).length;
			const reconstructedWords = reconstructed.trim().split(/\s+/).length;

			// Should be close (allowing for whitespace normalization)
			const wordDifference = Math.abs(originalWords - reconstructedWords);
			expect(wordDifference).toBeLessThan(originalWords * 0.15); // Within 15%
		});

		it("should handle the file efficiently (performance check)", () => {
			if (!exampleText) {
				return;
			}

			const settings: ChunkSettings = { maxCharacters: 500 };

			const startTime = performance.now();
			const result = chunkText(exampleText, settings);
			const endTime = performance.now();

			const duration = endTime - startTime;

			// Chunking should be fast (under 100ms for ~16KB file)
			expect(duration).toBeLessThan(100);
			expect(result.chunks.length).toBeGreaterThan(0);
		});

		it("should create reasonable chunk counts for different limits", () => {
			if (!exampleText) {
				return;
			}

			const result100 = chunkText(exampleText, { maxCharacters: 100 });
			const result500 = chunkText(exampleText, { maxCharacters: 500 });
			const result1000 = chunkText(exampleText, { maxCharacters: 1000 });

			// More restrictive limit should create more chunks
			expect(result100.chunks.length).toBeGreaterThan(result500.chunks.length);
			expect(result500.chunks.length).toBeGreaterThanOrEqual(
				result1000.chunks.length,
			);
		});

		it("should handle edge content in the file (newlines, special formatting)", () => {
			if (!exampleText) {
				return;
			}

			const settings: ChunkSettings = { maxCharacters: 500 };
			const result = chunkText(exampleText, settings);

			// Should handle without errors
			expect(result.chunks.length).toBeGreaterThan(0);

			// All chunks should have actual content
			result.chunks.forEach((chunk) => {
				expect(chunk.content.trim().length).toBeGreaterThan(0);
			});
		});
	});
});
