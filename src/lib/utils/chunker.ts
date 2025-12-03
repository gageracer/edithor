import type { Chunk, ChunkSettings, ChunkResult, ChunkStats } from "$lib/types";

/**
 * Detects sentence boundaries in text
 * Handles common sentence endings: . ! ?
 * Tries to avoid false positives with common abbreviations
 */
function detectSentences(text: string): string[] {
	if (!text || text.trim().length === 0) {
		return [];
	}

	// Common abbreviations that shouldn't trigger sentence breaks
	const abbreviations = [
		"Dr",
		"Mr",
		"Mrs",
		"Ms",
		"Prof",
		"Sr",
		"Jr",
		"etc",
		"vs",
		"e.g",
		"i.e",
	];

	let processed = text;
	const abbreviationMap = new Map<string, string>();
	const quoteMap = new Map<string, string>();

	// Replace abbreviations temporarily to avoid false sentence breaks
	abbreviations.forEach((abbr, index) => {
		const placeholder = `__ABBR${index}__`;
		const regex = new RegExp(`\\b${abbr}\\.`, "gi");
		processed = processed.replace(regex, (match) => {
			abbreviationMap.set(placeholder, match);
			return placeholder;
		});
	});

	// Protect quoted content from being split (both single and double quotes)
	// This handles cases like: said, "You're not working. Your screen's been..."
	// Only match actual quoted dialogue, not apostrophes in contractions
	let quoteIndex = 0;

	// Match double quotes with content inside
	processed = processed.replace(/"[^"]*"/g, (match) => {
		const placeholder = `__QUOTE${quoteIndex}__`;
		quoteMap.set(placeholder, match);
		quoteIndex++;
		return placeholder;
	});

	// Match single quotes that are dialogue (have spaces or start/end sentence)
	// NOT apostrophes in contractions like "don't", "it's", "I'm"
	// This regex matches: 'quoted text' but not contractions
	processed = processed.replace(/(\s|^)'([^']{2,})'(\s|[.!?,;:]|$)/g, (match, before, content, after) => {
		const placeholder = `__QUOTE${quoteIndex}__`;
		const fullQuote = `'${content}'`;
		quoteMap.set(placeholder, fullQuote);
		quoteIndex++;
		return before + placeholder + after;
	});

	// Split on sentence boundaries: . ! ? at end of text or followed by whitespace
	// Pattern now includes placeholders (letters, numbers, underscores)
	const sentencePattern = /[^.!?]+[.!?]+(?:\s+|$)/g;
	const matches = processed.match(sentencePattern) || [];
	const sentences = matches.map(s => s.trim()).filter(s => s.length > 0);

	// Restore quotes first, then abbreviations
	const restoredSentences = sentences.map((sentence) => {
		let restored = sentence;
		quoteMap.forEach((original, placeholder) => {
			restored = restored.replaceAll(placeholder, original);
		});
		abbreviationMap.forEach((original, placeholder) => {
			restored = restored.replaceAll(placeholder, original);
		});
		return restored.trim();
	});

	// Check for trailing text without proper sentence endings
	const allMatches = processed.match(sentencePattern) || [];
	const matchedLength = allMatches.join('').length;
	const trailingText = processed.slice(matchedLength).trim();

	if (trailingText.length > 0) {
		// Restore quotes and abbreviations in trailing text
		let restoredTrailing = trailingText;
		quoteMap.forEach((original, placeholder) => {
			restoredTrailing = restoredTrailing.replaceAll(placeholder, original);
		});
		abbreviationMap.forEach((original, placeholder) => {
			restoredTrailing = restoredTrailing.replaceAll(placeholder, original);
		});
		restoredSentences.push(restoredTrailing.trim());
	}

	// Handle text without proper sentence endings
	if (restoredSentences.length === 0 && text.trim().length > 0) {
		return [text.trim()];
	}

	return restoredSentences.filter((s) => s.length > 0);
}

/**
 * Creates a Chunk object from text content
 */
function createChunk(id: number, content: string): Chunk {
	const sentences = detectSentences(content);
	return {
		id,
		content: content.trim(),
		characterCount: content.trim().length,
		sentenceCount: sentences.length,
	};
}

/**
 * Calculates statistics for an array of chunks
 */
function calculateStats(chunks: Chunk[]): ChunkStats {
	if (chunks.length === 0) {
		return {
			totalChunks: 0,
			totalCharacters: 0,
			averageChunkSize: 0,
			largestChunk: 0,
			smallestChunk: 0,
		};
	}

	const totalCharacters = chunks.reduce(
		(sum, chunk) => sum + chunk.characterCount,
		0,
	);
	const chunkSizes = chunks.map((c) => c.characterCount);

	return {
		totalChunks: chunks.length,
		totalCharacters,
		averageChunkSize:
			totalCharacters > 0 ? Math.round(totalCharacters / chunks.length) : 0,
		largestChunk: chunkSizes.length > 0 ? Math.max(...chunkSizes) : 0,
		smallestChunk: chunkSizes.length > 0 ? Math.min(...chunkSizes) : 0,
	};
}

/**
 * Splits continuous text that exceeds the limit by forcing character-based splits
 * HARD LIMIT: Never exceeds maxCharacters, cuts at word boundary or mid-word if necessary
 */
function forceSplitContinuousText(text: string, maxCharacters: number): string[] {
	const parts: string[] = [];
	let remaining = text;

	while (remaining.length > maxCharacters) {
		// Try to split at a word boundary near the limit
		let splitPoint = maxCharacters;
		const substring = remaining.substring(0, maxCharacters);
		const lastSpace = substring.lastIndexOf(' ');

		// If we found a space in the last 20% of the substring, use it
		if (lastSpace > maxCharacters * 0.8) {
			splitPoint = lastSpace;
		}
		// Otherwise, HARD CUT at maxCharacters (mid-word if necessary)

		parts.push(remaining.substring(0, splitPoint).trim());
		remaining = remaining.substring(splitPoint).trim();
	}

	if (remaining.length > 0) {
		parts.push(remaining);
	}

	return parts;
}

/**
 * Main chunking function
 * Splits text into chunks while preserving sentence boundaries
 *
 * @param text - The text to chunk
 * @param settings - Chunking configuration
 * @returns ChunkResult with chunks and statistics
 */
export function chunkText(text: string, settings: ChunkSettings): ChunkResult {
	const { maxCharacters, fallbackSplit = false } = settings;

	// Handle empty or invalid input
	if (!text || text.trim().length === 0) {
		return {
			chunks: [],
			stats: calculateStats([]),
		};
	}

	// Handle invalid maxCharacters
	if (maxCharacters <= 0) {
		throw new Error("maxCharacters must be greater than 0");
	}

	const sentences = detectSentences(text);
	const chunks: Chunk[] = [];
	let currentChunk = "";
	let chunkId = 1;

	for (const sentence of sentences) {
		const trimmedSentence = sentence.trim();

		// Skip empty sentences
		if (trimmedSentence.length === 0) {
			continue;
		}

		// If a single sentence exceeds the limit
		if (trimmedSentence.length > maxCharacters) {
			// If the sentence doesn't end with proper punctuation, it's continuous text without boundaries
			if (!/[.!?]$/.test(trimmedSentence)) {
				if (fallbackSplit) {
					// Use fallback split to break continuous text
					// Save current chunk first
					if (currentChunk.trim().length > 0) {
						chunks.push(createChunk(chunkId++, currentChunk));
						currentChunk = "";
					}
					// Split the continuous text and add as separate chunks
					const forcedParts = forceSplitContinuousText(trimmedSentence, maxCharacters);
					for (const part of forcedParts) {
						chunks.push(createChunk(chunkId++, part));
					}
					continue;
				} else {
					const preview = trimmedSentence.length > 200
						? `${trimmedSentence.slice(0, 100)}...${trimmedSentence.slice(-100)}`
						: trimmedSentence;
					throw new Error(
						`Text contains continuous content (${trimmedSentence.length} characters) without sentence boundaries that exceeds the limit of ${maxCharacters} characters. Please add punctuation or increase the character limit.\n\nContent: "${preview}"`
					);
				}
			}

			// It's a properly punctuated sentence, but still too long
			if (fallbackSplit) {
				// Use fallback split even for long sentences when enabled
				// Save current chunk first
				if (currentChunk.trim().length > 0) {
					chunks.push(createChunk(chunkId++, currentChunk));
					currentChunk = "";
				}
				// Split the long sentence and add as separate chunks
				const forcedParts = forceSplitContinuousText(trimmedSentence, maxCharacters);
				for (const part of forcedParts) {
					chunks.push(createChunk(chunkId++, part));
				}
				continue;
			} else {
				// HARD LIMIT: Never allow chunks over maxCharacters
				// Force split the long sentence
				if (currentChunk.trim().length > 0) {
					chunks.push(createChunk(chunkId++, currentChunk));
					currentChunk = "";
				}
				// Split the long sentence and add as separate chunks
				const forcedParts = forceSplitContinuousText(trimmedSentence, maxCharacters);
				for (const part of forcedParts) {
					chunks.push(createChunk(chunkId++, part));
				}
				continue;
			}
		}

		// Try adding the sentence to the current chunk
		const potentialChunk =
			currentChunk.length > 0
				? currentChunk + " " + trimmedSentence
				: trimmedSentence;

		if (potentialChunk.length <= maxCharacters) {
			// Sentence fits, add it to current chunk
			currentChunk = potentialChunk;
		} else {
			// Current chunk is full, save it and start a new one
			if (currentChunk.trim().length > 0) {
				chunks.push(createChunk(chunkId++, currentChunk));
			}
			currentChunk = trimmedSentence;
		}
	}

	// Add the final chunk if there's remaining content
	if (currentChunk.trim().length > 0) {
		chunks.push(createChunk(chunkId, currentChunk));
	}

	// FINAL SAFETY CHECK: Enforce hard limit on ALL chunks
	// If any chunk exceeds limit, force split it
	const finalChunks: Chunk[] = [];
	let finalChunkId = 1;

	for (const chunk of chunks) {
		if (chunk.characterCount <= maxCharacters) {
			// Chunk is within limit, keep it
			finalChunks.push({
				...chunk,
				id: finalChunkId++
			});
		} else {
			// Chunk exceeds limit, force split it
			const parts = forceSplitContinuousText(chunk.content, maxCharacters);
			for (const part of parts) {
				finalChunks.push(createChunk(finalChunkId++, part));
			}
		}
	}

	return {
		chunks: finalChunks,
		stats: calculateStats(finalChunks),
	};
}

/**
 * Exports chunks as a single text file without chunk headers
 * Format: "[text]\n\n[text]\n\n[text]..."
 * Ensures each chunk starts on a new line if it doesn't already
 */
export function exportAsSingleFile(chunks: Chunk[]): string {
	return chunks
		.map((chunk) => chunk.content)
		.join("\n\n");
}

/**
 * Prepares chunks as individual files for ZIP export
 * Returns an array of {filename, content} objects
 */
export function prepareMultipleFiles(
	chunks: Chunk[],
): Array<{ filename: string; content: string }> {
	return chunks.map((chunk) => ({
		filename: `chunk-${chunk.id}.txt`,
		content: chunk.content,
	}));
}
