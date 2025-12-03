<script lang="ts">
	import { resolve } from '$app/paths';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Label } from "$lib/components/ui/label";
	import { Input } from "$lib/components/ui/input";
	import { Button } from "$lib/components/ui/button";
	import TextInput from "$lib/components/TextInput.svelte";
	import ChunkPreview from "$lib/components/ChunkPreview.svelte";
	import ExportOptions from "$lib/components/ExportOptions.svelte";
	import { chunkText } from "$lib/utils/chunker";
	import type { Chunk, ChunkStats } from "$lib/types";
	import { toast } from "svelte-sonner";
	import { saveState, loadLatestState, autoSaveState } from "$lib/db/storage";
	import { onMount } from "svelte";

	interface ExtendedChunk extends Chunk {
		formattedOutput?: string;
	}

	interface MarkerPair {
		id: number;
		startMarker: string;
		endMarker: string;
		patternTemplate: string;
		pattern: RegExp | null;
		format: 'double-star' | 'plain';
	}

	let inputText = $state("");
	let maxCharacters = $state(490);
	let markerPairs = $state<MarkerPair[]>([
		{
			id: 1,
			startMarker: "### Voice Script Segments",
			endMarker: "### Storyboard Images",
			patternTemplate: "**Segment %n:** (%d characters)",
			pattern: null,
			format: 'double-star'
		}
	]);
	let nextMarkerId = $state(2);
	let chunks = $state<ExtendedChunk[]>([]);
	let stats = $state<ChunkStats | undefined>(undefined);
	let hasProcessed = $state(false);
	let beforeContent = $state("");
	let afterContent = $state("");
	let isLoadingState = $state(false);
	let outputFormat = $state<'double-star' | 'plain' | 'auto'>('auto');
	let detectedFormat = $state<'double-star' | 'plain'>('double-star');

	function escapeRegex(str: string): string {
		return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	}

	function addMarkerPair() {
		markerPairs.push({
			id: nextMarkerId++,
			startMarker: "",
			endMarker: "",
			patternTemplate: "**Segment %n:** (%d characters)",
			pattern: null,
			format: 'double-star'
		});
		markerPairs = [...markerPairs];
	}

	function removeMarkerPair(id: number) {
		if (markerPairs.length > 1) {
			markerPairs = markerPairs.filter(p => p.id !== id);
		}
	}

	function templateToRegex(template: string): RegExp | null {
		if (!template || !template.trim()) return null;

		let pattern = escapeRegex(template);

		// Check if the template has a character count placeholder
		const hasCharCount = template.includes('%d');

		// Replace %n with digit matcher and %d with digit matcher
		pattern = pattern.replace(/%n/g, '\\d+');
		pattern = pattern.replace(/%d/g, '\\d+');

		// Check if this is a plain segment pattern (no bold markers)
		// Use negative lookbehind to avoid matching **Segment when looking for plain Segment
		const isPlainSegmentPattern = template.includes('Segment') && !template.includes('**');

		if (isPlainSegmentPattern) {
			pattern = '(?<!\\*\\*)' + pattern;
		}

		// Make character count part optional with flexible spacing
		if (hasCharCount) {
			pattern = pattern.replace(/\\\(\\d\+\\s\*characters\\\)/g, '(\\(\\d+\\s*characters\\))?');
		}

		return new RegExp(pattern, 'gi');
	}

	function updateMarkerPattern(id: number, patternTemplate: string) {
		const pair = markerPairs.find(p => p.id === id);
		if (!pair) return;

		pair.patternTemplate = patternTemplate;

		// Detect format
		if (patternTemplate.includes('**Segment')) {
			pair.format = 'double-star';
		} else if (patternTemplate.match(/Segment\s+%[nd]/)) {
			pair.format = 'plain';
		}

		pair.pattern = templateToRegex(patternTemplate);
	}

	function extractSegmentedSection(
		text: string,
		startMarker: string,
		sectionEndMarker: string
	): { before: string; segmented: string; after: string } {
		if (!startMarker || !startMarker.trim()) {
			return { before: text, segmented: '', after: '' };
		}

		const startPattern = new RegExp(escapeRegex(startMarker), 'i');
		const startMatch = text.match(startPattern);

		if (!startMatch || startMatch.index === undefined) {
			return { before: text, segmented: '', after: '' };
		}

		const startIndex = startMatch.index;

		// Only use section end marker if it's meaningful (not \n)
		if (sectionEndMarker && sectionEndMarker.trim() !== '' && sectionEndMarker !== '\\n' && sectionEndMarker !== '\n') {
			const endPattern = new RegExp(escapeRegex(sectionEndMarker), 'i');
			const textAfterStart = text.substring(startIndex);
			const endMatch = textAfterStart.match(endPattern);

			if (endMatch && endMatch.index !== undefined) {
				const endIndex = startIndex + endMatch.index;
				return {
					before: text.substring(0, startIndex),
					segmented: text.substring(startIndex, endIndex),
					after: text.substring(endIndex)
				};
			}
		}

		return {
			before: text.substring(0, startIndex),
			segmented: text.substring(startIndex),
			after: ''
		};
	}

	function extractSegmentContent(
		segmentedSection: string,
		patterns: RegExp[],
		endMarker: string
	): { segments: string[]; trailingContent: string } {
		const segments: string[] = [];

		// Find all marker matches from ALL patterns
		const markers: Array<{ index: number; match: string }> = [];

		patterns.forEach((pattern) => {
			if (!pattern) return;

			let match;
			const globalPattern = new RegExp(pattern.source, 'gi');

			while ((match = globalPattern.exec(segmentedSection)) !== null) {
				markers.push({
					index: match.index,
					match: match[0]
				});
			}
		});

		if (markers.length === 0) {
			return { segments: [segmentedSection.trim()], trailingContent: '' };
		}

		// Sort by position
		markers.sort((a, b) => a.index - b.index);

		const useEndMarker = endMarker && endMarker.trim() !== '' && endMarker !== '\\n' && endMarker !== '\n';

		// Extract content between markers
		for (let i = 0; i < markers.length; i++) {
			const currentMarker = markers[i];
			const nextMarker = markers[i + 1];
			const contentStart = currentMarker.index + currentMarker.match.length;

			let content: string;

			if (useEndMarker) {
				const endPattern = new RegExp(escapeRegex(endMarker), 'i');
				const remainingText = segmentedSection.substring(contentStart);
				const endMatch = remainingText.match(endPattern);

				if (endMatch && endMatch.index !== undefined) {
					content = remainingText.substring(0, endMatch.index).trim();
				} else {
					const contentEnd = nextMarker ? nextMarker.index : segmentedSection.length;
					content = segmentedSection.substring(contentStart, contentEnd).trim();
				}
			} else {
				const contentEnd = nextMarker ? nextMarker.index : segmentedSection.length;
				content = segmentedSection.substring(contentStart, contentEnd).trim();
			}

			if (content.length > 0) {
				segments.push(content);
			}
		}

		// Extract trailing content
		const lastMarker = markers[markers.length - 1];
		const lastContentStart = lastMarker.index + lastMarker.match.length;

		let lastSegmentEnd = lastContentStart;
		if (useEndMarker) {
			const endPattern = new RegExp(escapeRegex(endMarker), 'i');
			const remainingText = segmentedSection.substring(lastContentStart);
			const endMatch = remainingText.match(endPattern);
			if (endMatch && endMatch.index !== undefined) {
				lastSegmentEnd = lastContentStart + endMatch.index + endMatch[0].length;
			} else {
				lastSegmentEnd = segmentedSection.length;
			}
		} else {
			lastSegmentEnd = segmentedSection.length;
		}

		const trailingContent = segmentedSection.substring(lastSegmentEnd).trim();

		return { segments, trailingContent };
	}

	function handleProcess() {
		if (!inputText.trim()) {
			toast.error("Please enter some text to process.", { duration: 5000 });
			return;
		}

		try {
			// Get valid patterns
			const validPairs = markerPairs.filter(p => p.patternTemplate.trim());

			if (validPairs.length === 0) {
				toast.error("Please configure at least one segment pattern.", { duration: 5000 });
				return;
			}

			// Update patterns
			validPairs.forEach((pair) => {
				if (!pair.pattern) {
					pair.pattern = templateToRegex(pair.patternTemplate);
				}
			});

			// Extract segmented section using start/end markers
			const { before, segmented, after } = extractSegmentedSection(
				inputText,
				validPairs[0].startMarker,
				validPairs[0].endMarker
			);

			if (!segmented.trim()) {
				toast.error("No content found in the specified section.", { duration: 5000 });
				return;
			}

			// Compile all patterns
			const allPatterns = validPairs.map(p => p.pattern!).filter(p => p !== null);

			if (allPatterns.length === 0) {
				toast.error("No valid segment patterns found.", { duration: 5000 });
				return;
			}

			// Get end marker from first valid pair
			const firstPair = validPairs[0];
			const endMarker = firstPair.endMarker || '';

			// Extract segment contents
			const { segments: allSegmentContents, trailingContent } = extractSegmentContent(
				segmented,
				allPatterns,
				endMarker
			);

			if (allSegmentContents.length === 0) {
				toast.error("No segments found matching the pattern.", { duration: 5000 });
				return;
			}

			// Combine all segments and normalize whitespace
			const combinedContent = allSegmentContents
				.join(' ')
				.replace(/\s+/g, ' ')
				.trim();

			// Chunk with fallback split enabled
			const result = chunkText(combinedContent, { maxCharacters, fallbackSplit: true });

			// Detect format from the first valid pattern
			const formatPair = validPairs.find(p => p.patternTemplate.trim());
			detectedFormat = formatPair?.format || 'double-star';

			// Determine which format to use for output
			const useFormat = outputFormat === 'auto' ? detectedFormat : outputFormat;

			// Add segment formatting to chunks
			chunks = result.chunks.map((chunk, index) => {
				// Strip leading newlines
				let content = chunk.content;
				while (content.startsWith('\n')) {
					content = content.substring(1);
				}

				const actualCharCount = content.length;

				let marker = '';
				if (useFormat === 'double-star') {
					marker = `**Segment ${index + 1}:** (${actualCharCount} characters)`;
				} else {
					marker = `Segment ${index + 1}: (${actualCharCount} characters)`;
				}

				return {
					...chunk,
					characterCount: actualCharCount,
					formattedOutput: `${marker}\n${content}`
				};
			});

			stats = result.stats;
			beforeContent = before;
			afterContent = trailingContent + '\n\n' + after;
			hasProcessed = true;

			// Scroll to preview
			setTimeout(() => {
				document.getElementById("preview-section")?.scrollIntoView({
					behavior: "smooth",
					block: "start"
				});
			}, 100);
		} catch (error) {
			console.error("Error processing text:", error);
			const errorMessage = error instanceof Error ? error.message : "Failed to process text. Please try again.";
			toast.error(errorMessage, { duration: 5000 });
		}
	}

	async function handleSave() {
		try {
			const id = await saveState(inputText, markerPairs, maxCharacters);
			toast.success("State saved successfully!", { duration: 3000 });
		} catch (error) {
			console.error("Error saving state:", error);
			toast.error("Failed to save state.", { duration: 5000 });
		}
	}

	async function handleLoad() {
		try {
			isLoadingState = true;
			const state = await loadLatestState();

			if (state) {
				inputText = state.inputText;
				maxCharacters = state.maxCharacters;
				markerPairs = state.markerPairs.map(p => ({
					...p,
					pattern: templateToRegex(p.patternTemplate)
				}));
				toast.success("State loaded successfully!", { duration: 3000 });
			} else {
				toast.info("No saved state found.", { duration: 3000 });
			}
		} catch (error) {
			console.error("Error loading state:", error);
			toast.error("Failed to load state.", { duration: 5000 });
		} finally {
			isLoadingState = false;
		}
	}

	function handleTextChange(text: string) {
		inputText = text;
		if (hasProcessed) {
			hasProcessed = false;
			chunks = [];
			stats = undefined;
		}

		// Auto-save
		autoSaveState(inputText, markerPairs, maxCharacters);
	}

	// Load state on mount
	onMount(async () => {
		try {
			const loadedStateStr = localStorage.getItem('chunking-last-state');
			if (loadedStateStr) {
				const state = JSON.parse(loadedStateStr);
				if (state.inputText) {
					inputText = state.inputText;
					maxCharacters = state.maxCharacters || 490;
					if (state.markerPairs) {
						markerPairs = state.markerPairs.map((p: any) => ({
							...p,
							pattern: templateToRegex(p.patternTemplate)
						}));
					}
					toast.success("Previous session restored!", { duration: 3000 });
				}
			}
		} catch (error) {
			console.error("Error loading previous state:", error);
		}
	});

	// Save to localStorage on changes
	$effect(() => {
		if (inputText || markerPairs.length > 0) {
			const state = {
				inputText,
				maxCharacters,
				markerPairs: markerPairs.map(p => ({
					...p,
					pattern: null // Don't serialize regex
				}))
			};
			localStorage.setItem('chunking-last-state', JSON.stringify(state));
		}
	});

	let canProcess = $derived(
		inputText.trim().length > 0 && markerPairs.some(p => p.patternTemplate.trim().length > 0)
	);
</script>

<div class="space-y-8">
	<!-- Save/Load Card -->
	<Card>
		<CardHeader>
			<CardTitle>Session Management</CardTitle>
			<CardDescription>
				Save and load your chunking configurations
			</CardDescription>
		</CardHeader>
		<CardContent>
			<div class="flex flex-wrap gap-2">
				<Button onclick={handleSave} variant="outline" size="sm" disabled={!inputText.trim()}>
					Save Current State
				</Button>
				<Button onclick={handleLoad} variant="outline" size="sm" disabled={isLoadingState}>
					{#if isLoadingState}
						Loading...
					{:else}
						Load Latest State
					{/if}
				</Button>
				<a href={resolve('/history')} class="inline-flex">
					<Button variant="outline" size="sm">
						View History
					</Button>
				</a>
			</div>
			<p class="text-xs text-muted-foreground mt-2">
				States are automatically saved as you work
			</p>
		</CardContent>
	</Card>

	<!-- Input Card -->
	<Card>
		<CardHeader>
			<CardTitle>Input Text</CardTitle>
			<CardDescription>
				Paste your text with segment markers
			</CardDescription>
		</CardHeader>
		<CardContent>
			<TextInput bind:value={inputText} onTextChange={handleTextChange} />
		</CardContent>
	</Card>

	<!-- Patterns Card -->
	<Card>
		<CardHeader>
			<CardTitle>Segment Patterns</CardTitle>
			<CardDescription>
				Use %n for numbers and %d for character counts.
			</CardDescription>
		</CardHeader>
		<CardContent class="space-y-6">
			<!-- Pattern List -->
			<div class="space-y-4">
				<div class="space-y-2 mb-4">
					<div class="flex items-center justify-between">
						<Label class="text-sm font-medium">Segment Patterns</Label>
						<Button onclick={addMarkerPair} variant="outline" size="sm">+ Add Pattern</Button>
					</div>
					<p class="text-xs text-muted-foreground">
						Use <code class="px-1 py-0.5 bg-muted rounded">%n</code> for segment numbers and
						<code class="px-1 py-0.5 bg-muted rounded">%d</code> for character counts.
					</p>
					<p class="text-xs text-emerald-600 dark:text-emerald-500">
						💡 The tool will find existing segments, extract their content, and re-chunk them.
					</p>
				</div>

				{#each markerPairs as pair, index (pair.id)}
					<div class="space-y-3 p-4 border rounded-lg">
						<div class="flex items-center justify-between">
							<span class="text-sm font-medium">Pattern {index + 1}</span>
							{#if markerPairs.length > 1}
								<Button
									onclick={() => removeMarkerPair(pair.id)}
									variant="ghost"
									size="sm"
									class="h-8 w-8 p-0"
								>
									×
								</Button>
							{/if}
						</div>

						<div class="space-y-2">
							<Label class="text-xs">Start Marker (where segments begin)</Label>
							<Input
								bind:value={pair.startMarker}
								placeholder="### Voice Script Segments"
								class="font-mono text-xs"
							/>
							<p class="text-xs text-muted-foreground">
								The section header before your segments. Leave empty to process from the beginning.
							</p>

							<div class="text-xs text-muted-foreground font-medium mt-3">
								<Label class="text-xs">Segment Pattern (how segments are marked)</Label>
							</div>
							<Input
								bind:value={pair.patternTemplate}
								oninput={(e) => updateMarkerPattern(pair.id, e.currentTarget.value)}
								placeholder="**Segment %n:** (%d characters)"
								class="font-mono text-xs"
							/>
							<p class="text-xs text-muted-foreground">
								Use <code class="px-1 py-0.5 bg-muted rounded">%n</code> for numbers,
								<code class="px-1 py-0.5 bg-muted rounded">%d</code> for character counts
							</p>
						</div>

						<div class="space-y-2">
							<Label class="text-xs">End Marker (where segments end)</Label>
							<Input
								bind:value={pair.endMarker}
								placeholder="### Storyboard Images"
								class="font-mono text-xs"
							/>
							<p class="text-xs text-muted-foreground">
								Optional. Leave empty to go until next section. Use <code class="px-1 py-0.5 bg-muted rounded">\n</code> for blank line separator.
							</p>
						</div>
					</div>
				{/each}
			</div>

			<!-- Output Format -->
			<div class="space-y-3 p-4 border rounded-lg bg-muted/50">
				<Label class="text-sm font-medium">Output Format</Label>
				<div class="space-y-2">
					<label class="flex items-center gap-2 cursor-pointer">
						<input
							type="radio"
							bind:group={outputFormat}
							value="auto"
							class="cursor-pointer"
						/>
						<span class="text-sm">Auto-detect from input patterns</span>
					</label>
					<label class="flex items-center gap-2 cursor-pointer">
						<input
							type="radio"
							bind:group={outputFormat}
							value="double-star"
							class="cursor-pointer"
						/>
						<span class="text-sm font-mono">**Segment N:** (bold format)</span>
					</label>
					<label class="flex items-center gap-2 cursor-pointer">
						<input
							type="radio"
							bind:group={outputFormat}
							value="plain"
							class="cursor-pointer"
						/>
						<span class="text-sm font-mono">Segment N: (plain format)</span>
					</label>
				</div>
				{#if outputFormat === 'auto' && detectedFormat}
					<p class="text-xs text-emerald-600 dark:text-emerald-500">
						Detected format: **Segment N:**
					</p>
				{/if}
			</div>

			<!-- Character Limit -->
			<div class="space-y-2">
				<div class="flex items-center justify-between">
					<Label>Target Character Limit</Label>
				</div>
				<Input
					type="number"
					bind:value={maxCharacters}
					min="50"
					max="2000"
					step="10"
					class="font-mono"
				/>
				<p class="text-xs text-muted-foreground">
					Groups will be as close as possible without breaking sentences (50-2000 characters)
				</p>
			</div>

			<!-- Process Button -->
			<div class="flex justify-center">
				<Button onclick={handleProcess} variant="outline" disabled={!canProcess}>
					🔄 Process & Re-chunk Segments
				</Button>
			</div>
		</CardContent>
	</Card>

	<!-- Preview Card -->
	{#if hasProcessed || chunks.length > 0}
		<div id="preview-section">
			<Card>
				<CardHeader>
					<CardTitle>Preview</CardTitle>
					<CardDescription>
						{#if chunks.length > 0}
							Re-chunked into {chunks.length} new segments
						{:else}
							Your re-chunked segments will appear here
						{/if}
					</CardDescription>
				</CardHeader>
				<CardContent>
					<ChunkPreview {chunks} {stats} />
				</CardContent>
				<CardFooter>
					<ExportOptions {chunks} {beforeContent} {afterContent} disabled={chunks.length === 0} />
				</CardFooter>
			</Card>
		</div>
	{/if}

	<!-- Instructions -->
	{#if !hasProcessed && chunks.length === 0}
		<Card>
			<CardHeader>
				<CardTitle>How It Works</CardTitle>
			</CardHeader>
			<CardContent>
				<div class="space-y-4 text-sm text-muted-foreground">
					<div class="flex gap-3">
						<div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
							1
						</div>
						<div>
							<p class="font-medium text-foreground mb-1">Paste Your Segmented Text</p>
							<p>Input text that already has segment markers like <code class="px-1 py-0.5 bg-muted rounded">**Segment 1:**</code></p>
						</div>
					</div>
					<div class="flex gap-3">
						<div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
							2
						</div>
						<div>
							<p class="font-medium text-foreground mb-1">Configure Patterns</p>
							<p>Tell the tool how your segments are formatted and where they start/end</p>
						</div>
					</div>
					<div class="flex gap-3">
						<div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
							3
						</div>
						<div>
							<p class="font-medium text-foreground mb-1">Process & Download</p>
							<p>The tool extracts content, re-chunks it to your limit, and outputs new segments</p>
						</div>
					</div>

					<div class="mt-6 rounded-lg bg-muted p-4">
						<p class="font-medium text-foreground mb-2">Example Input:</p>
						<pre class="text-xs overflow-x-auto whitespace-pre-wrap">### Voice Script Segments

**Segment 1:** (487 characters)
Your content here...

**Segment 2:** (512 characters)
More content...</pre>
					</div>

					<div class="rounded-lg bg-blue-500/10 border border-blue-500/20 p-4">
						<p class="font-medium text-foreground mb-2">💡 Pro Tip</p>
						<p class="text-xs">
							The tool will find ALL segments matching your patterns, combine their content,
							and re-chunk them to fit your character limit while preserving sentence boundaries.
						</p>
					</div>
				</div>
			</CardContent>
		</Card>
	{/if}
</div>
