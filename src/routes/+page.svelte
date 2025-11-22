<script lang="ts">
	import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "$lib/components/ui/card";
	import TextInput from "$lib/components/TextInput.svelte";
	import ChunkSettings from "$lib/components/ChunkSettings.svelte";
	import ChunkPreview from "$lib/components/ChunkPreview.svelte";
	import ExportOptions from "$lib/components/ExportOptions.svelte";
	import { chunkText } from "$lib/utils/chunker";
	import type { Chunk, ChunkStats } from "$lib/types";

	let inputText = $state("");
	let maxCharacters = $state(500);
	let chunks = $state<Chunk[]>([]);
	let stats = $state<ChunkStats | undefined>(undefined);
	let hasProcessed = $state(false);

	function handleProcess() {
		if (!inputText.trim()) {
			alert("Please enter some text to process.");
			return;
		}

		try {
			const result = chunkText(inputText, { maxCharacters });
			chunks = result.chunks;
			stats = result.stats;
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
			alert(errorMessage);
		}
	}

	function handleTextChange(text: string) {
		inputText = text;
		// Reset chunks when text changes
		if (hasProcessed) {
			hasProcessed = false;
			chunks = [];
			stats = undefined;
		}
	}

	let canProcess = $derived(inputText.trim().length > 0);
</script>

<svelte:head>
	<title>Edithor - Smart Text Chunking Tool</title>
	<meta name="description" content="Smart text chunking for AI voiceover tools. Split your scripts intelligently while preserving sentence boundaries." />
</svelte:head>

<div class="container mx-auto min-h-screen p-4 sm:p-8">
	<div class="mx-auto max-w-5xl space-y-8">
		<!-- Header -->
		<div class="text-center space-y-2">
			<h1 class="text-4xl font-bold tracking-tight">Edithor ✂️</h1>
			<p class="text-muted-foreground text-lg">
				Smart text chunking for AI voiceover tools
			</p>
		</div>

		<!-- Input Card -->
		<Card>
			<CardHeader>
				<CardTitle>Input Text</CardTitle>
				<CardDescription>
					Paste your voiceover script or upload a text file
				</CardDescription>
			</CardHeader>
			<CardContent>
				<TextInput bind:value={inputText} onTextChange={handleTextChange} />
			</CardContent>
		</Card>

		<!-- Settings Card -->
		<Card>
			<CardHeader>
				<CardTitle>Chunk Settings</CardTitle>
				<CardDescription>
					Configure how your text will be split
				</CardDescription>
			</CardHeader>
			<CardContent>
				<ChunkSettings
					bind:maxCharacters
					onProcess={handleProcess}
					disabled={!canProcess}
				/>
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
								Your text has been split into {chunks.length} {chunks.length === 1 ? 'chunk' : 'chunks'}
							{:else}
								Your chunked text will appear here
							{/if}
						</CardDescription>
					</CardHeader>
					<CardContent>
						<ChunkPreview {chunks} {stats} />
					</CardContent>
					<CardFooter>
						<ExportOptions {chunks} disabled={chunks.length === 0} />
					</CardFooter>
				</Card>
			</div>
		{/if}

		<!-- Instructions (shown when no text) -->
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
								<p class="font-medium text-foreground mb-1">Input Your Text</p>
								<p>Paste your voiceover script directly or upload a .txt file.</p>
							</div>
						</div>
						<div class="flex gap-3">
							<div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
								2
							</div>
							<div>
								<p class="font-medium text-foreground mb-1">Set Your Limit</p>
								<p>Choose your character limit per chunk (default 500). The tool will respect sentence boundaries.</p>
							</div>
						</div>
						<div class="flex gap-3">
							<div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
								3
							</div>
							<div>
								<p class="font-medium text-foreground mb-1">Process & Download</p>
								<p>Preview your chunks and download as a single file or multiple files in a ZIP archive.</p>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>
		{/if}

		<!-- Footer -->
		<div class="text-center text-sm text-muted-foreground border-t pt-8">
			<p class="mt-2 text-xs">All processing happens in your browser. Your text never leaves your device.</p>
		</div>
	</div>
</div>
