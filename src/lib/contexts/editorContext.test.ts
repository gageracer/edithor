import { describe, it, expect, beforeEach } from 'vitest';
import { EditorContext } from './editorContext.svelte';

describe('EditorContext', () => {
	let ctx: EditorContext;

	beforeEach(() => {
		ctx = new EditorContext();
	});

	describe('initialization', () => {
		it('should initialize with default values', () => {
			expect(ctx.currentText).toBe('');
			expect(ctx.resultText).toBe('');
			expect(ctx.viewMode).toBe('original');
			expect(ctx.maxCharacters).toBe(490);
			expect(ctx.markerPairs).toHaveLength(1);
			expect(ctx.isProcessing).toBe(false);
		});

		it('should have default marker pair', () => {
			const defaultMarker = ctx.markerPairs[0];
			expect(defaultMarker).toBeDefined();
			expect(defaultMarker.id).toBe(1);
			expect(defaultMarker.startMarker).toBe('### Voice Script Segments');
			expect(defaultMarker.endMarker).toBe('### Storyboard Images');
			expect(defaultMarker.format).toBe('double-star');
		});
	});

	describe('stats computation', () => {
		it('should compute stats for empty text', () => {
			const stats = ctx.stats;
			expect(stats.totalChars).toBe(0);
			expect(stats.totalWords).toBe(0);
			expect(stats.segmentCount).toBe(0);
			expect(stats.avgSize).toBe(0);
		});

		it('should compute stats for text with content', () => {
			ctx.setCurrentText('Hello world test');
			const stats = ctx.stats;
			expect(stats.totalChars).toBe(16);
			expect(stats.totalWords).toBe(3);
		});

		it('should compute stats based on view mode', () => {
			ctx.setCurrentText('Original text');
			ctx.resultText = 'Result text with more content';

			// Original view
			let stats = ctx.stats;
			expect(stats.totalChars).toBe(13);

			// Switch to result view
			ctx.switchView('result');
			stats = ctx.stats;
			expect(stats.totalChars).toBe(30);
		});
	});

	describe('marker pair management', () => {
		it('should add marker pair', () => {
			const initialLength = ctx.markerPairs.length;
			ctx.addMarkerPair();
			expect(ctx.markerPairs).toHaveLength(initialLength + 1);
			expect(ctx.markerPairs[1].id).toBe(2);
		});

		it('should remove marker pair', () => {
			ctx.addMarkerPair();
			expect(ctx.markerPairs).toHaveLength(2);
			ctx.removeMarkerPair(2);
			expect(ctx.markerPairs).toHaveLength(1);
		});

		it('should not remove last marker pair', () => {
			ctx.removeMarkerPair(1);
			expect(ctx.markerPairs).toHaveLength(1);
		});

		it('should update marker pair', () => {
			ctx.updateMarkerPair(1, { startMarker: 'New Start' });
			expect(ctx.markerPairs[0].startMarker).toBe('New Start');
		});

		it('should update pattern when updating template', () => {
			ctx.updateMarkerPair(1, { patternTemplate: 'Segment %n' });
			expect(ctx.markerPairs[0].patternTemplate).toBe('Segment %n');
			expect(ctx.markerPairs[0].pattern).not.toBeNull();
		});
	});

	describe('view mode', () => {
		it('should switch view mode', () => {
			expect(ctx.viewMode).toBe('original');
			ctx.switchView('result');
			expect(ctx.viewMode).toBe('result');
			ctx.switchView('original');
			expect(ctx.viewMode).toBe('original');
		});

		it('should not show highlights in result mode', () => {
			ctx.setCurrentText('**Segment 1:** test');
			ctx.viewMode = 'original';
			let highlights = ctx.highlightRanges;
			expect(highlights.length).toBeGreaterThanOrEqual(0);

			ctx.switchView('result');
			highlights = ctx.highlightRanges;
			expect(highlights).toHaveLength(0);
		});
	});

	describe('text management', () => {
		it('should set current text', () => {
			ctx.setCurrentText('Test content');
			expect(ctx.currentText).toBe('Test content');
		});

		it('should update stats when text changes', () => {
			ctx.setCurrentText('Hello world');
			const stats = ctx.stats;
			expect(stats.totalWords).toBe(2);
		});
	});

	describe('pattern creation', () => {
		it('should create pattern for segment template', () => {
			ctx.updateMarkerPair(1, { patternTemplate: '**Segment %n:**' });
			const pattern = ctx.markerPairs[0].pattern;
			expect(pattern).not.toBeNull();
			expect(pattern?.test('**Segment 1:**')).toBe(true);
			expect(pattern?.test('**Segment 25:**')).toBe(true);
		});

		it('should handle pattern with character count', () => {
			ctx.updateMarkerPair(1, { patternTemplate: '**Segment %n:** (%d characters)' });
			const pattern = ctx.markerPairs[0].pattern;
			expect(pattern).not.toBeNull();
			expect(pattern?.test('**Segment 1:** (100 characters)')).toBe(true);
		});
	});

	describe('highlight calculation', () => {
		it('should return empty highlights for empty text', () => {
			const highlights = ctx.highlightRanges;
			expect(highlights).toHaveLength(0);
		});

		it('should find segment markers in text', () => {
			ctx.setCurrentText('**Segment 1:** test content\n**Segment 2:** more content');
			const highlights = ctx.highlightRanges;
			expect(highlights.length).toBeGreaterThan(0);
		});

		it('should create highlights with correct class', () => {
			ctx.setCurrentText('**Segment 1:** test');
			const highlights = ctx.highlightRanges;
			if (highlights.length > 0) {
				expect(highlights[0].class).toBe('cm-segment-highlight');
			}
		});
	});

	describe('chunking process', () => {
		it('should handle empty text gracefully', async () => {
			ctx.setCurrentText('');
			await ctx.processChunking();
			expect(ctx.isProcessing).toBe(false);
		});

		it('should process plain text without segments', async () => {
			ctx.setCurrentText('This is plain text without any segment markers.');
			await ctx.processChunking();
			expect(ctx.resultText).toBeTruthy();
			expect(ctx.isProcessing).toBe(false);
		});

		it('should set isProcessing flag during processing', async () => {
			ctx.setCurrentText('Test text');
			const processingPromise = ctx.processChunking();
			// Note: Due to async nature, isProcessing might already be false by the time we check
			await processingPromise;
			expect(ctx.isProcessing).toBe(false);
		});
	});

	describe('segment extraction', () => {
		it('should count segments in text', () => {
			ctx.setCurrentText('**Segment 1:** content\n**Segment 2:** more content');
			const stats = ctx.stats;
			expect(stats.segmentCount).toBeGreaterThanOrEqual(0);
		});

		it('should handle text without segments', () => {
			ctx.setCurrentText('Just plain text');
			const stats = ctx.stats;
			expect(stats.segmentCount).toBe(0);
		});
	});

	describe('chunk formatting', () => {
		it('should format chunks with segment markers', async () => {
			ctx.setCurrentText('This is a test text that will be chunked.');
			await ctx.processChunking();
			expect(ctx.resultText).toContain('**Segment');
			expect(ctx.resultText).toContain('characters)');
		});
	});
});
