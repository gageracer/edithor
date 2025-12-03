import { setContext, getContext } from 'svelte';
import type { Chunk } from '$lib/types';
import {
	type MarkerPair,
	type ChunkingState,
	saveState,
	loadState,
	getAllStates
} from '$lib/db/storage';
import { chunkText } from '$lib/utils/chunker';

const EDITOR_CONTEXT_KEY = Symbol('editorContext');

export interface HighlightRange {
	from: number;
	to: number;
	class: string;
}

export interface EditorStats {
	totalChars: number;
	totalWords: number;
	segmentCount: number;
	avgSize: number;
	sessionCount: number;
}

export class EditorContext {
	// Core reactive state
	currentText = $state<string>('');
	resultText = $state<string>('');
	viewMode = $state<'original' | 'result'>('original');

	// Chunking configuration
	markerPairs = $state<MarkerPair[]>([
		{
			id: 1,
			startMarker: '### Voice Script Segments',
			endMarker: '### Storyboard Images',
			patternTemplate: '%o{**}Segment %n:%o{**} (%d characters)',
			pattern: null,
			format: 'double-star'
		}
	]);
	maxCharacters = $state<number>(490);

	// History management
	historyStates = $state<ChunkingState[]>([]);
	currentHistoryId = $state<number | null>(null);
	isProcessing = $state<boolean>(false);

	constructor() {
		// Initialize patterns for marker pairs
		this.markerPairs = this.markerPairs.map(mp => ({
			...mp,
			pattern: this.createPattern(mp.patternTemplate)
		}));
	}

	// Computed values (derived state)
	stats = $derived.by((): EditorStats => {
		const text = this.viewMode === 'original' ? this.currentText : this.resultText;
		const chars = text.length;
		const words = text.split(/\s+/).filter((w) => w.length > 0).length;
		const segments = this.extractSegmentCount(text);
		const avgSize = segments > 0 ? Math.round(chars / segments) : 0;

		return {
			totalChars: chars,
			totalWords: words,
			segmentCount: segments,
			avgSize,
			sessionCount: this.historyStates.length
		};
	});

	highlightRanges = $derived.by((): HighlightRange[] => {
		if (this.viewMode !== 'original') return [];
		return this.calculateHighlights(this.currentText, this.markerPairs);
	});

	// Methods
	async loadHistory() {
		try {
			this.historyStates = await getAllStates();
		} catch (error) {
			console.error('Failed to load history:', error);
			this.historyStates = [];
		}
	}

	async loadHistoryItem(id: number) {
		try {
			const state = await loadState(id);
			if (state) {
				this.currentText = state.inputText;
				this.resultText = '';
				this.maxCharacters = state.maxCharacters;
				this.markerPairs = state.markerPairs.map((mp) => ({
					...mp,
					pattern: this.createPattern(mp.patternTemplate)
				}));
				this.currentHistoryId = id;
				this.viewMode = 'original';
			}
		} catch (error) {
			console.error('Failed to load history item:', error);
		}
	}

	async saveToHistory(name?: string) {
		try {
			const id = await saveState(this.currentText, this.maxCharacters, this.markerPairs, name);
			await this.loadHistory();
			this.currentHistoryId = id;
			return id;
		} catch (error) {
			console.error('Failed to save to history:', error);
			return null;
		}
	}

	async processChunking() {
		this.isProcessing = true;
		try {
			// Ensure patterns are initialized
			this.markerPairs = this.markerPairs.map(mp => ({
				...mp,
				pattern: mp.pattern || this.createPattern(mp.patternTemplate)
			}));

			// Process document preserving structure
			this.resultText = this.processDocumentWithStructure(this.currentText);
			await this.saveToHistory('Processed');
		} catch (error) {
			console.error('Processing failed:', error);
		} finally {
			this.isProcessing = false;
		}
	}

	private processDocumentWithStructure(text: string): string {
		// Find sections bounded by start/end markers
		const sections = this.findSections(text);

		if (sections.length === 0) {
			// No sections found, fallback to chunking entire text
			const result = chunkText(text, {
				maxCharacters: this.maxCharacters,
				fallbackSplit: true
			});
			return this.formatChunks(result.chunks);
		}

		// Rebuild document with processed sections
		let result = '';
		let lastIndex = 0;

		for (const section of sections) {
			// Add everything before this section
			result += text.slice(lastIndex, section.start);

			// Process this section
			result += this.processSectionContent(text.slice(section.start, section.end));

			lastIndex = section.end;
		}

		// Add any remaining content after last section
		result += text.slice(lastIndex);

		return result;
	}

	private findSections(text: string): Array<{ start: number; end: number; markerPair: MarkerPair }> {
		const sections: Array<{ start: number; end: number; markerPair: MarkerPair }> = [];

		for (const mp of this.markerPairs) {
			if (!mp.startMarker || !mp.endMarker) continue;

			let searchPos = 0;
			while (searchPos < text.length) {
				const startIdx = text.indexOf(mp.startMarker, searchPos);
				if (startIdx === -1) break;

				const endIdx = text.indexOf(mp.endMarker, startIdx + mp.startMarker.length);
				if (endIdx === -1) {
					// No end marker, take rest of document
					sections.push({
						start: startIdx,
						end: text.length,
						markerPair: mp
					});
					break;
				}

				sections.push({
					start: startIdx,
					end: endIdx,
					markerPair: mp
				});

				searchPos = endIdx + mp.endMarker.length;
			}
		}

		// Sort sections by start position
		sections.sort((a, b) => a.start - b.start);
		return sections;
	}

	private processSectionContent(sectionText: string): string {
		// Find all segment markers in this section
		const segmentMatches: Array<{ index: number; marker: string; pattern: RegExp }> = [];

		for (const mp of this.markerPairs) {
			if (!mp.pattern) continue;

			const matches = [...sectionText.matchAll(mp.pattern)];
			for (const match of matches) {
				if (match.index !== undefined) {
					segmentMatches.push({
						index: match.index,
						marker: match[0],
						pattern: mp.pattern
					});
				}
			}
		}

		if (segmentMatches.length === 0) {
			// No segments found in this section, return as-is
			return sectionText;
		}

		// Sort by position
		segmentMatches.sort((a, b) => a.index - b.index);

		// Extract content before first segment marker
		const preFirstSegmentContent = sectionText.slice(0, segmentMatches[0].index);

		// Find where segmented content starts (after first marker)
		const firstMarker = segmentMatches[0];
		const segmentedContentStart = firstMarker.index + firstMarker.marker.length;

		// Find where segmented content ends (look for separator or end of section)
		let segmentedContentEnd = sectionText.length;
		const remainingText = sectionText.slice(segmentedContentStart);
		const separatorMatch = remainingText.search(/\n\n---\n|^---\n|^###\s/m);

		if (separatorMatch !== -1) {
			segmentedContentEnd = segmentedContentStart + separatorMatch;
		}

		// Extract ALL content between start and end as ONE text block
		let allSegmentedContent = sectionText.slice(segmentedContentStart, segmentedContentEnd).trim();

		// Remove all old segment markers from the extracted content
		for (const mp of this.markerPairs) {
			if (!mp.pattern) continue;
			allSegmentedContent = allSegmentedContent.replace(mp.pattern, '');
		}

		// Normalize the content:
		// - Keep paragraph breaks (double newlines) as sentence boundaries
		// - Collapse single newlines within paragraphs to spaces
		allSegmentedContent = allSegmentedContent
			.split(/\n\n+/)            // Split on paragraph breaks (2+ newlines)
			.map(para => para
				.replace(/\n/g, ' ')   // Within each paragraph, replace newlines with space
				.replace(/\s+/g, ' ')  // Collapse multiple spaces
				.trim()
			)
			.filter(para => para.length > 0)  // Remove empty paragraphs
			.map(para => {
				// Add period if paragraph doesn't end with sentence punctuation
				if (!/[.!?]$/.test(para)) {
					return para + '.';
				}
				return para;
			})
			.join(' ')                 // Join paragraphs with space (they already have punctuation)
			.trim();

		// Extract content after segmented section (if any)
		// Don't trim to preserve spacing before end marker
		const postSegmentContent = sectionText.slice(segmentedContentEnd);

		// Chunk the entire segmented content as one block
		const chunkResult = chunkText(allSegmentedContent, {
			maxCharacters: this.maxCharacters,
			fallbackSplit: false
		});

		// Rebuild with sequential numbering
		// Always use **Segment N:** format in output (with asterisks)
		let result = preFirstSegmentContent;
		let segmentNumber = 1;

		for (const chunk of chunkResult.chunks) {
			const content = chunk.content.trim();
			// Content is already normalized from Step 4, use chunk.characterCount for accuracy
			result += `**Segment ${segmentNumber}:** (${chunk.characterCount} characters)\n\n`;
			result += content;
			result += '\n\n';
			segmentNumber++;
		}

		// Add any remaining content after all segments (only if there is content)
		if (postSegmentContent && postSegmentContent.trim().length > 0) {
			// Ensure proper spacing before the end marker
			if (!result.endsWith('\n\n')) {
				result += '\n\n';
			}
			result += postSegmentContent.trim();
		}

		return result;
	}

	switchView(mode: 'original' | 'result') {
		this.viewMode = mode;
	}

	updateMarkerPair(id: number, updates: Partial<MarkerPair>) {
		const index = this.markerPairs.findIndex((mp) => mp.id === id);
		if (index >= 0) {
			this.markerPairs[index] = {
				...this.markerPairs[index],
				...updates,
				pattern: updates.patternTemplate
					? this.createPattern(updates.patternTemplate)
					: this.markerPairs[index].pattern
			};
		}
	}

	addMarkerPair() {
		const newId = Math.max(...this.markerPairs.map((mp) => mp.id), 0) + 1;
		this.markerPairs.push({
			id: newId,
			startMarker: '',
			endMarker: '',
			patternTemplate: '**Segment %n:** (%d characters)',
			pattern: null,
			format: 'double-star'
		});
	}

	removeMarkerPair(id: number) {
		if (this.markerPairs.length > 1) {
			this.markerPairs = this.markerPairs.filter((mp) => mp.id !== id);
		}
	}

	setCurrentText(text: string) {
		this.currentText = text;
	}

	// Helper methods
	private extractSegmentCount(text: string): number {
		let count = 0;
		for (const mp of this.markerPairs) {
			if (mp.pattern) {
				const matches = text.match(mp.pattern);
				count += matches?.length || 0;
			}
		}
		return count;
	}



	private calculateHighlights(text: string, markerPairs: MarkerPair[]): HighlightRange[] {
		const ranges: HighlightRange[] = [];

		for (const mp of markerPairs) {
			if (!mp.pattern) continue;

			const matches = [...text.matchAll(mp.pattern)];
			for (const match of matches) {
				if (match.index !== undefined) {
					ranges.push({
						from: match.index,
						to: match.index + match[0].length,
						class: 'cm-segment-highlight'
					});
				}
			}
		}

		return ranges;
	}

	private createPattern(template: string): RegExp | null {
		if (!template || !template.trim()) return null;

		try {
			// First, handle %o{...} optional syntax before escaping
			// Replace %o{content} with a marker, process, then make it optional
			const optionalMarkers: string[] = [];
			let processedTemplate = template;

			// Extract all %o{...} blocks
			const optionalPattern = /%o\{([^}]+)\}/g;
			let match;
			let index = 0;

			while ((match = optionalPattern.exec(template)) !== null) {
				const placeholder = `__OPTIONAL_${index}__`;
				optionalMarkers.push(match[1]); // Store the content inside %o{}
				processedTemplate = processedTemplate.replace(match[0], placeholder);
				index++;
			}

			let pattern = this.escapeRegex(processedTemplate);
			const hasCharCount = template.includes('%d');

			// Replace %n and %d placeholders
			pattern = pattern.replace(/%n/g, '\\d+');
			pattern = pattern.replace(/%d/g, '\\d+');

			// Restore optional blocks and make them optional in regex
			optionalMarkers.forEach((content, idx) => {
				const placeholder = `__OPTIONAL_${idx}__`;
				const escapedContent = this.escapeRegex(content);
				// Make the entire captured content optional with (content)?
				pattern = pattern.replace(placeholder, `(${escapedContent})?`);
			});

			// Make character count part optional with flexible spacing
			if (hasCharCount) {
				pattern = pattern.replace(
					/\\\(\\d\+\\s\*characters\\\)/g,
					'(\\(\\d+\\s*characters\\))?'
				);
			}

			return new RegExp(pattern, 'gi');
		} catch (error) {
			console.error('Failed to create pattern:', error);
			return null;
		}
	}

	private escapeRegex(str: string): string {
		return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	}

	private formatChunks(chunks: Chunk[]): string {
		return chunks
			.map((chunk, i) => {
				const charCount = chunk.content.trim().length;
				return `**Segment ${i + 1}:** (${charCount} characters)\n\n${chunk.content.trim()}`;
			})
			.join('\n\n');
	}
}

// Context helpers
export function setEditorContext() {
	const ctx = new EditorContext();
	setContext(EDITOR_CONTEXT_KEY, ctx);
	return ctx;
}

export function getEditorContext(): EditorContext {
	return getContext(EDITOR_CONTEXT_KEY);
}
