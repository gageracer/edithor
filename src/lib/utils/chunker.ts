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

	// Replace abbreviations temporarily to avoid false sentence breaks
	let processed = text;
	const abbreviationMap = new Map<string, string>();

	abbreviations.forEach((abbr, index) => {
		const placeholder = `__ABBR${index}__`;
		const regex = new RegExp(`\\b${abbr}\\.`, "gi");
		processed = processed.replace(regex, (match) => {
			abbreviationMap.set(placeholder, match);
			return placeholder;
		});
	});

	// Split on sentence boundaries: . ! ? followed by space/newline or end of string
	// This regex captures the punctuation with the sentence
	const sentencePattern = /[^.!?]+[.!?]+/g;
	const sentences = processed.match(sentencePattern) || [];

	// Restore abbreviations
	const restoredSentences = sentences.map((sentence) => {
		let restored = sentence;
		abbreviationMap.forEach((original, placeholder) => {
			restored = restored.replace(placeholder, original);
		});
		return restored.trim();
	});

	// Check for trailing text without proper sentence endings
	const allMatches = processed.match(sentencePattern) || [];
	const matchedLength = allMatches.join('').length;
	const trailingText = processed.slice(matchedLength).trim();

	if (trailingText.length > 0) {
		// Restore abbreviations in trailing text
		let restoredTrailing = trailingText;
		abbreviationMap.forEach((original, placeholder) => {
			restoredTrailing = restoredTrailing.replace(placeholder, original);
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
 * Main chunking function
 * Splits text into chunks while preserving sentence boundaries
 *
 * @param text - The text to chunk
 * @param settings - Chunking configuration
 * @returns ChunkResult with chunks and statistics
 */
export function chunkText(text: string, settings: ChunkSettings): ChunkResult {
	const { maxCharacters } = settings;

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

		// If a single sentence exceeds the limit, check if it's continuous text without punctuation
		if (trimmedSentence.length > maxCharacters) {
			// If the sentence doesn't end with proper punctuation, it's continuous text
			if (!/[.!?]$/.test(trimmedSentence)) {
				throw new Error(
					`Text contains continuous content (${trimmedSentence.length} characters) without sentence boundaries that exceeds the limit of ${maxCharacters} characters. Please add punctuation or increase the character limit.`
				);
			}
			// Save current chunk if it has content
			if (currentChunk.trim().length > 0) {
				chunks.push(createChunk(chunkId++, currentChunk));
				currentChunk = "";
			}
			// Add the long sentence as its own chunk
			chunks.push(createChunk(chunkId++, trimmedSentence));
			continue;
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

	return {
		chunks,
		stats: calculateStats(chunks),
	};
}

/**
 * Exports chunks as a single text file with chunk headers
 * Format: "Chunk 1\n[text]\n\nChunk 2\n[text]..."
 */
export function exportAsSingleFile(chunks: Chunk[]): string {
	return chunks
		.map((chunk) => `Chunk ${chunk.id}\n${chunk.content}`)
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
