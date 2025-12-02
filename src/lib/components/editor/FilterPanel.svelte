<script lang="ts">
	import { getEditorContext } from '$lib/contexts/editorContext.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';

	const ctx = getEditorContext();

	async function handleProcess() {
		await ctx.processChunking();
		ctx.switchView('result');
	}
</script>

<div class="flex flex-col h-full border rounded-lg bg-card overflow-auto">
	<CardHeader>
		<CardTitle>Filter Settings</CardTitle>
	</CardHeader>

	<CardContent class="space-y-6">
		<!-- Character Limit -->
		<div class="space-y-2">
			<Label for="max-chars">Maximum Characters</Label>
			<Input
				id="max-chars"
				type="number"
				bind:value={ctx.maxCharacters}
				min="50"
				max="5000"
				class="w-full"
			/>
			<p class="text-xs text-muted-foreground">
				Target character count per chunk
			</p>
		</div>

		<!-- Marker Pairs -->
		<div class="space-y-4">
			<div class="flex items-center justify-between">
				<Label>Marker Pairs</Label>
				<Button
					variant="outline"
					size="sm"
					onclick={() => ctx.addMarkerPair()}
				>
					Add Pair
				</Button>
			</div>

			{#each ctx.markerPairs as pair (pair.id)}
				<Card>
					<CardContent class="pt-4 space-y-3">
						<div class="space-y-2">
							<Label for="start-{pair.id}">Start Marker</Label>
							<Input
								id="start-{pair.id}"
								bind:value={pair.startMarker}
								placeholder="### Voice Script Segments"
								class="w-full"
							/>
						</div>

						<div class="space-y-2">
							<Label for="end-{pair.id}">End Marker</Label>
							<Input
								id="end-{pair.id}"
								bind:value={pair.endMarker}
								placeholder="### Storyboard Images"
								class="w-full"
							/>
						</div>

						<div class="space-y-2">
							<Label for="pattern-{pair.id}">Pattern Template</Label>
							<Input
								id="pattern-{pair.id}"
								bind:value={pair.patternTemplate}
								placeholder="**Segment %n:** (%d characters)"
								class="w-full"
								onchange={() => ctx.updateMarkerPair(pair.id, {
									patternTemplate: pair.patternTemplate
								})}
							/>
							<p class="text-xs text-muted-foreground">
								Use %n for number, %d for character count
							</p>
						</div>

						{#if ctx.markerPairs.length > 1}
							<Button
								variant="destructive"
								size="sm"
								class="w-full"
								onclick={() => ctx.removeMarkerPair(pair.id)}
							>
								Remove
							</Button>
						{/if}
					</CardContent>
				</Card>
			{/each}
		</div>

		<!-- Process Button -->
		<Button
			class="w-full"
			onclick={handleProcess}
			disabled={ctx.isProcessing || !ctx.currentText}
		>
			{ctx.isProcessing ? 'Processing...' : 'Process Chunks'}
		</Button>
	</CardContent>
</div>
