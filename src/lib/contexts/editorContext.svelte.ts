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
			patternTemplate: '**Segment %n:** (%d characters)',
			pattern: null,
			format: 'double-star'
		}
	]);
	maxCharacters = $state<number>(490);

	// History management
	historyStates = $state<ChunkingState[]>([]);
	currentHistoryId = $state<number | null>(null);
	isProcessing = $state<boolean>(false);

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
			// Extract segments and process each one
			const segments = this.extractSegments(this.currentText);

			if (segments.length === 0) {
				// No segments found, treat as plain text
				const result = chunkText(this.currentText, {
					maxCharacters: this.maxCharacters,
					fallbackSplit: true
				});
				this.resultText = this.formatChunks(result.chunks);
			} else {
				// Process each segment individually
				const allChunks: Chunk[] = [];

				for (const segment of segments) {
					const result = chunkText(segment.content, {
						maxCharacters: this.maxCharacters,
						fallbackSplit: true
					});

					// Add chunks from this segment
					allChunks.push(...result.chunks);
				}

				this.resultText = this.formatChunks(allChunks);
			}

			await this.saveToHistory('Processed');
		} catch (error) {
			console.error('Processing failed:', error);
		} finally {
			this.isProcessing = false;
		}
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

	private extractSegments(text: string): Array<{ content: string; start: number; end: number }> {
		const segments: Array<{ content: string; start: number; end: number; marker: string }> = [];

		// Find all segment markers
		for (const mp of this.markerPairs) {
			if (!mp.pattern) continue;

			const matches = [...text.matchAll(mp.pattern)];
			for (const match of matches) {
				if (match.index !== undefined) {
					segments.push({
						content: '',
						start: match.index,
						end: match.index + match[0].length,
						marker: match[0]
					});
				}
			}
		}

		// Sort by position
		segments.sort((a, b) => a.start - b.start);

		// Extract content between markers
		const results: Array<{ content: string; start: number; end: number }> = [];
		for (let i = 0; i < segments.length; i++) {
			const currentMarker = segments[i];
			const nextMarker = segments[i + 1];

			const contentStart = currentMarker.end;
			const contentEnd = nextMarker ? nextMarker.start : text.length;

			const content = text.slice(contentStart, contentEnd).trim();

			if (content) {
				results.push({
					content,
					start: contentStart,
					end: contentEnd
				});
			}
		}

		return results;
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
			let pattern = this.escapeRegex(template);

			// Check if this has character count placeholder
			const hasCharCount = template.includes('%d');

			// Replace %n with digit matcher and %d with digit matcher
			pattern = pattern.replace(/%n/g, '\\d+');
			pattern = pattern.replace(/%d/g, '\\d+');

			// Check if this is a plain segment pattern (no bold markers)
			const isPlainSegmentPattern = template.includes('Segment') && !template.includes('**');

			if (isPlainSegmentPattern) {
				// Use negative lookbehind to avoid matching **Segment when looking for plain Segment
				pattern = '(?<!\\*\\*)' + pattern;
			}

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
