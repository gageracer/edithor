<script lang="ts">
	import {
		Card,
		CardContent,
		CardDescription,
		CardFooter,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import TextInput from '$lib/components/TextInput.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';
	import { Input } from '$lib/components/ui/input';
	import { chunkText } from '$lib/utils/chunker';
	import type { Chunk, ChunkStats } from '$lib/types';

	let inputText = $state('');
	let startMarker = $state('**Segment 1:**');
	let endMarker = $state('---');
	let targetCharLimit = $state(500);
	let segments = $state<Chunk[]>([]);
	let stats = $state<ChunkStats | undefined>(undefined);
	let hasProcessed = $state(false);
	let beforeContent = $state('');
	let afterContent = $state('');

	function escapeRegex(str: string): string {
		return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	}

	function extractSegmentedSection(text: string): {
		before: string;
		segmented: string;
		after: string;
	} {
		// Find the start marker
		const startPattern = escapeRegex(startMarker);
		const startMatch = text.match(new RegExp(startPattern, 'i'));

		if (!startMatch) {
			return { before: text, segmented: '', after: '' };
		}

		const startIndex = startMatch.index!;

		// Find the end marker
		const endPattern = escapeRegex(endMarker);
		const endMatch = text.substring(startIndex).match(new RegExp(endPattern, 'i'));

		if (!endMatch) {
			// No end marker found, take everything after start
			return {
				before: text.substring(0, startIndex),
				segmented: text.substring(startIndex),
				after: ''
			};
		}

		const endIndex = startIndex + endMatch.index!;

		return {
			before: text.substring(0, startIndex),
			segmented: text.substring(startIndex, endIndex),
			after: text.substring(endIndex)
		};
	}

	function extractSegmentContent(segmentedSection: string): string[] {
		// Pattern: **Segment N:** (XXX characters)
		// Captures the segment marker and splits content
		const segmentPattern = /\*\*Segment\s+\d+:\*\*\s*\(\d+\s*characters\)\s*/gi;

		// Split by segment markers
		const parts = segmentedSection.split(segmentPattern);

		// Remove empty first part if text starts with marker
		if (parts[0].trim() === '') {
			parts.shift();
		}

		// Clean up each segment - remove leading/trailing whitespace
		return parts.map((part) => part.trim()).filter((part) => part.length > 0);
	}

	function refactorSegments() {
		if (!inputText.trim()) {
			alert('Please enter segmented text to refactor.');
			return;
		}

		if (!startMarker.trim()) {
			alert('Please specify a start marker.');
			return;
		}

		try {
			// Extract the section between start and end markers
			const { before, segmented, after } = extractSegmentedSection(inputText);

			if (!segmented) {
				alert('Could not find the start marker in the text.');
				return;
			}

			beforeContent = before;
			afterContent = after;

			// Extract individual segment contents
			const segmentContents = extractSegmentContent(segmented);

			if (segmentContents.length === 0) {
				alert('No segments found. Check your start marker format.');
				return;
			}

			// Combine all segment content into one continuous text
			// This prevents tiny fragments when individual segments are re-chunked separately
			const combinedContent = segmentContents.join(' ');

			// Re-chunk the entire combined content using the main chunking algorithm
			const result = chunkText(combinedContent, { maxCharacters: targetCharLimit });

			// Create segments with sequential numbering
			segments = result.chunks.map((chunk, index) => ({
				id: index + 1,
				content: chunk.content,
				characterCount: chunk.characterCount,
				sentenceCount: chunk.sentenceCount
			}));

			// Calculate stats
			const totalChars = segments.reduce((sum, chunk) => sum + chunk.characterCount, 0);
			const avgSize = Math.round(totalChars / segments.length);
			const sizes = segments.map((c) => c.characterCount);

			stats = {
				totalChunks: segments.length,
				totalCharacters: totalChars,
				averageChunkSize: avgSize,
				largestChunk: Math.max(...sizes),
				smallestChunk: Math.min(...sizes)
			};

			hasProcessed = true;

			// Scroll to preview
			setTimeout(() => {
				document.getElementById('refactor-preview-section')?.scrollIntoView({
					behavior: 'smooth',
					block: 'start'
				});
			}, 100);
		} catch (error) {
			console.error('Error refactoring segments:', error);
			alert('Failed to refactor segments. Please check your input format and markers.');
		}
	}

	function handleTextChange(text: string) {
		inputText = text;
		if (hasProcessed) {
			hasProcessed = false;
			segments = [];
			stats = undefined;
			beforeContent = '';
			afterContent = '';
		}
	}

	function exportAsText(): string {
		let output = beforeContent;

		segments.forEach((segment) => {
			output += `**Segment ${segment.id}:** (${segment.characterCount} characters)\n`;
			output += segment.content + '\n\n';
		});

		output += afterContent;

		return output;
	}

	function downloadRefactored() {
		const content = exportAsText();
		const blob = new Blob([content], { type: 'text/plain' });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = 'refactored-segments.txt';
		link.click();
		URL.revokeObjectURL(url);
	}

	function copyToClipboard() {
		const content = exportAsText();
		navigator.clipboard
			.writeText(content)
			.then(() => {
				alert('Copied to clipboard!');
			})
			.catch((err) => {
				console.error('Failed to copy:', err);
				alert('Failed to copy to clipboard');
			});
	}

	let canProcess = $derived(inputText.trim().length > 0 && startMarker.trim().length > 0);
</script>

<div class="space-y-8">
	<!-- Input Card -->
	<Card>
		<CardHeader>
			<CardTitle>Input Segmented Text</CardTitle>
			<CardDescription>
				Paste your full document with segments marked like "**Segment 1:** (487 characters)"
			</CardDescription>
		</CardHeader>
		<CardContent>
			<TextInput bind:value={inputText} onTextChange={handleTextChange} />
		</CardContent>
	</Card>

	<!-- Settings Card -->
	<Card>
		<CardHeader>
			<CardTitle>Refactoring Settings</CardTitle>
			<CardDescription>Define where segmentation starts and ends in your document</CardDescription>
		</CardHeader>
		<CardContent class="space-y-6">
			<!-- Marker Configuration -->
			<div class="space-y-4">
				<div class="space-y-2">
					<Label for="start-marker">Start Marker</Label>
					<Input
						id="start-marker"
						type="text"
						bind:value={startMarker}
						placeholder="**Segment 1:**"
					/>
					<p class="text-xs text-muted-foreground">
						Text before this marker will be preserved as-is (e.g., story title, metadata)
					</p>
				</div>

				<div class="space-y-2">
					<Label for="end-marker">End Marker</Label>
					<Input id="end-marker" type="text" bind:value={endMarker} placeholder="---" />
					<p class="text-xs text-muted-foreground">
						Text after this marker will be preserved as-is (e.g., storyboard, metadata). Leave empty
						to process until end of file.
					</p>
				</div>
			</div>

			<!-- Character Limit -->
			<div class="space-y-2">
				<div class="flex items-center justify-between">
					<Label for="char-limit">Target Character Limit per Segment</Label>
					<span class="text-sm font-medium">{targetCharLimit}</span>
				</div>
				<input
					id="char-limit"
					type="range"
					min="50"
					max="2000"
					step="10"
					bind:value={targetCharLimit}
					class="w-full"
				/>
				<p class="text-xs text-muted-foreground">
					Segments will be adjusted to match this limit while preserving sentence boundaries
				</p>
			</div>

			<!-- Process Button -->
			<div class="flex justify-center">
				<Button onclick={refactorSegments} variant="outline" disabled={!canProcess}>
					✨ Refactor Segments
				</Button>
			</div>
		</CardContent>
	</Card>

	<!-- Preview Card -->
	{#if hasProcessed || segments.length > 0}
		<div id="refactor-preview-section">
			<Card>
				<CardHeader>
					<CardTitle>Refactored Segments</CardTitle>
					<CardDescription>
						{#if segments.length > 0}
							Your text has been refactored into {segments.length}
							{segments.length === 1 ? 'segment' : 'segments'}
						{:else}
							Your refactored segments will appear here
						{/if}
					</CardDescription>
				</CardHeader>
				<CardContent>
					{#if stats}
						<!-- Statistics -->
						<div class="mb-6 grid grid-cols-5 gap-4">
							<div class="rounded-lg border bg-card p-4 text-center">
								<div class="text-2xl font-bold">{stats.totalChunks}</div>
								<div class="text-xs text-muted-foreground">Total Segments</div>
							</div>
							<div class="rounded-lg border bg-card p-4 text-center">
								<div class="text-2xl font-bold">{stats.averageChunkSize}</div>
								<div class="text-xs text-muted-foreground">Avg Characters</div>
							</div>
							<div class="rounded-lg border bg-card p-4 text-center">
								<div class="text-2xl font-bold">{stats.largestChunk}</div>
								<div class="text-xs text-muted-foreground">Largest</div>
							</div>
							<div class="rounded-lg border bg-card p-4 text-center">
								<div class="text-2xl font-bold">{stats.smallestChunk}</div>
								<div class="text-xs text-muted-foreground">Smallest</div>
							</div>
							<div class="rounded-lg border bg-card p-4 text-center">
								<div class="text-2xl font-bold">{stats.totalCharacters.toLocaleString()}</div>
								<div class="text-xs text-muted-foreground">Total Chars</div>
							</div>
						</div>
					{/if}

					<!-- Segments Preview -->
					<div class="space-y-4 max-h-[600px] overflow-y-auto">
						{#each segments as segment}
							<div class="rounded-lg border bg-card p-4">
								<div class="mb-2 flex items-center justify-between">
									<div class="font-semibold">Segment {segment.id}</div>
									<div class="flex gap-4 text-xs text-muted-foreground">
										<span>{segment.characterCount} characters</span>
										<span
											>{segment.sentenceCount}
											{segment.sentenceCount === 1 ? 'sentence' : 'sentences'}</span
										>
										<span
											class={segment.characterCount <= targetCharLimit
												? 'text-green-500 font-medium'
												: 'text-orange-500 font-medium'}
										>
											{segment.characterCount <= targetCharLimit ? 'Within limit' : 'Over limit'}
										</span>
									</div>
								</div>
								<p class="text-sm whitespace-pre-wrap">{segment.content}</p>
							</div>
						{/each}
					</div>
				</CardContent>
				<CardFooter class="flex gap-4">
					<Button onclick={downloadRefactored} disabled={segments.length === 0}>
						Download Refactored Text
					</Button>
					<Button onclick={copyToClipboard} variant="outline" disabled={segments.length === 0}>
						Copy to Clipboard
					</Button>
				</CardFooter>
			</Card>
		</div>
	{/if}

	<!-- Instructions (shown when no text) -->
	{#if !hasProcessed && segments.length === 0}
		<Card>
			<CardHeader>
				<CardTitle>How Refactoring Works</CardTitle>
			</CardHeader>
			<CardContent>
				<div class="space-y-4 text-sm text-muted-foreground">
					<div class="flex gap-3">
						<div
							class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold"
						>
							1
						</div>
						<div>
							<p class="font-medium text-foreground mb-1">Paste Your Full Document</p>
							<p>
								Include everything: story title, metadata, segments, and storyboards. The tool will
								only process the segmented section.
							</p>
						</div>
					</div>
					<div class="flex gap-3">
						<div
							class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold"
						>
							2
						</div>
						<div>
							<p class="font-medium text-foreground mb-1">Set Start and End Markers</p>
							<p>
								Define where segmentation begins (e.g., "**Segment 1:**") and ends (e.g., "---").
								Content outside these markers is preserved.
							</p>
						</div>
					</div>
					<div class="flex gap-3">
						<div
							class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold"
						>
							3
						</div>
						<div>
							<p class="font-medium text-foreground mb-1">Process & Download</p>
							<p>
								Review the refactored segments with corrected character counts, then download or
								copy the complete document.
							</p>
						</div>
					</div>
					<div class="mt-6 rounded-lg bg-muted p-4">
						<p class="font-medium text-foreground mb-2">Example Input:</p>
						<pre class="text-xs overflow-x-auto whitespace-pre-wrap">## Story 1: "The Title"

**Segment 1:** (487 characters)
Text here with incorrect count...

**Segment 2:** (512 characters)
More text...

---

### Storyboard Images
(This section won't be re-segmented)</pre>
					</div>
					<div class="rounded-lg bg-blue-500/10 border border-blue-500/20 p-4">
						<p class="font-medium text-foreground mb-2">💡 Pro Tip:</p>
						<p class="text-xs">
							The tool uses the same smart chunking algorithm as the main mode, so sentences are
							never broken mid-way. No tolerance setting is needed!
						</p>
					</div>
				</div>
			</CardContent>
		</Card>
	{/if}
</div>
