/**
 * Represents a single chunk of text
 */
export interface Chunk {
	/** Unique identifier for the chunk */
	id: number;
	/** The text content of the chunk */
	content: string;
	/** Number of characters in the chunk */
	characterCount: number;
	/** Number of sentences in the chunk */
	sentenceCount: number;
}

/**
 * Configuration settings for text chunking
 */
export interface ChunkSettings {
	/** Maximum number of characters per chunk */
	maxCharacters: number;
	/** Whether to preserve paragraph breaks when chunking */
	preserveParagraphs?: boolean;
	/** Custom delimiters for sentence detection (optional) */
	customDelimiters?: string[];
}

/**
 * Statistics about the chunked text
 */
export interface ChunkStats {
	/** Total number of chunks created */
	totalChunks: number;
	/** Total number of characters across all chunks */
	totalCharacters: number;
	/** Average chunk size in characters */
	averageChunkSize: number;
	/** Size of the largest chunk in characters */
	largestChunk: number;
	/** Size of the smallest chunk in characters */
	smallestChunk: number;
}

/**
 * Result of chunking operation
 */
export interface ChunkResult {
	/** Array of chunks */
	chunks: Chunk[];
	/** Statistics about the chunking */
	stats: ChunkStats;
}
