<script lang="ts">
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "$lib/components/ui/card";
	import type { Chunk, ChunkStats } from "$lib/types";

	interface Props {
		chunks?: Chunk[];
		stats?: ChunkStats;
	}

	let { chunks = [], stats }: Props = $props();

	let hasChunks = $derived(chunks.length > 0);
</script>

<div class="space-y-4">
	{#if hasChunks && stats}
		<!-- Statistics Summary -->
		<div class="grid grid-cols-2 md:grid-cols-5 gap-4">
			<div class="rounded-lg border bg-card p-4">
				<div class="text-2xl font-bold">{stats.totalChunks}</div>
				<div class="text-xs text-muted-foreground">Total Chunks</div>
			</div>
			<div class="rounded-lg border bg-card p-4">
				<div class="text-2xl font-bold">{stats.averageChunkSize}</div>
				<div class="text-xs text-muted-foreground">Avg Size</div>
			</div>
			<div class="rounded-lg border bg-card p-4">
				<div class="text-2xl font-bold">{stats.largestChunk}</div>
				<div class="text-xs text-muted-foreground">Largest</div>
			</div>
			<div class="rounded-lg border bg-card p-4">
				<div class="text-2xl font-bold">{stats.smallestChunk}</div>
				<div class="text-xs text-muted-foreground">Smallest</div>
			</div>
			<div class="rounded-lg border bg-card p-4">
				<div class="text-2xl font-bold">{stats.totalCharacters.toLocaleString()}</div>
				<div class="text-xs text-muted-foreground">Total Chars</div>
			</div>
		</div>

		<!-- Chunks List -->
		<div class="space-y-3 max-h-[600px] overflow-y-auto pr-2">
			{#each chunks as chunk (chunk.id)}
				<Card>
					<CardHeader class="pb-3">
						<div class="flex items-center justify-between">
							<CardTitle class="text-base">Chunk {chunk.id}</CardTitle>
							<div class="flex gap-3 text-xs text-muted-foreground">
								<span>{chunk.characterCount} chars</span>
								<span>•</span>
								<span>{chunk.sentenceCount} {chunk.sentenceCount === 1 ? 'sentence' : 'sentences'}</span>
							</div>
						</div>
					</CardHeader>
					<CardContent>
						<div class="rounded-md bg-muted/50 p-3">
							<p class="text-sm leading-relaxed whitespace-pre-wrap">{chunk.content}</p>
						</div>
					</CardContent>
				</Card>
			{/each}
		</div>
	{:else}
		<!-- Empty State -->
		<div class="rounded-md border border-dashed p-12 text-center">
			<div class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
				<span class="text-2xl">✂️</span>
			</div>
			<h3 class="text-lg font-semibold mb-2">No chunks yet</h3>
			<p class="text-sm text-muted-foreground max-w-sm mx-auto">
				Enter your text and click "Process Text" to see your chunked results here.
			</p>
		</div>
	{/if}
</div>
