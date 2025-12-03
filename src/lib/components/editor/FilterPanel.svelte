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

<div class="flex flex-col h-full border rounded-lg bg-card" data-testid="filter-panel">
	<CardHeader class="flex-shrink-0">
		<CardTitle>Filter Settings</CardTitle>
	</CardHeader>

	<CardContent class="space-y-6 overflow-auto flex-1">
		<!-- Character Limit -->
		<div class="space-y-2" data-testid="max-chars-section">
			<Label for="max-chars">Maximum Characters</Label>
			<Input
				id="max-chars"
				type="number"
				bind:value={ctx.maxCharacters}
				min="50"
				max="5000"
				class="w-full"
				data-testid="max-chars-input"
			/>
			<p class="text-xs text-muted-foreground">
				Target character count per chunk
			</p>
		</div>

		<!-- Marker Pairs -->
		<div class="space-y-4" data-testid="marker-pairs-section">
			<div class="flex items-center justify-between">
				<Label>Marker Pairs</Label>
				<Button
					variant="outline"
					size="sm"
					onclick={() => ctx.addMarkerPair()}
					data-testid="add-marker-pair-button"
				>
					Add Pair
				</Button>
			</div>

			{#each ctx.markerPairs as pair (pair.id)}
				<Card data-testid="marker-pair-{pair.id}">
					<CardContent class="pt-4 space-y-3">
						<div class="space-y-2">
							<Label for="start-{pair.id}">Start Marker</Label>
							<Input
								id="start-{pair.id}"
								bind:value={pair.startMarker}
								placeholder="### Voice Script Segments"
								class="w-full"
								data-testid="start-marker-{pair.id}"
								oninput={() => ctx.updateMarkerPair(pair.id, {
									startMarker: pair.startMarker
								})}
							/>
						</div>

						<div class="space-y-2">
							<Label for="end-{pair.id}">End Marker</Label>
							<Input
								id="end-{pair.id}"
								bind:value={pair.endMarker}
								placeholder="### Storyboard Images"
								class="w-full"
								data-testid="end-marker-{pair.id}"
								oninput={() => ctx.updateMarkerPair(pair.id, {
									endMarker: pair.endMarker
								})}
							/>
						</div>

						<div class="space-y-2">
							<Label for="pattern-{pair.id}">Pattern Template</Label>
							<Input
								id="pattern-{pair.id}"
								bind:value={pair.patternTemplate}
								placeholder="**Segment %n:** (%d characters)"
								class="w-full"
								data-testid="pattern-template-{pair.id}"
								oninput={() => ctx.updateMarkerPair(pair.id, {
									patternTemplate: pair.patternTemplate
								})}
							/>
							<p class="text-xs text-muted-foreground">
								Use %n for number, %d for character count, %o&#123;...&#125; for optional parts (e.g., %o&#123;**&#125;Segment %n:%o&#123;**&#125;)
							</p>
						</div>

						<!-- Segment Detection Feedback -->
						{#if ctx.viewMode === 'original' && ctx.currentText && pair.pattern}
							<div class="rounded-md bg-blue-50 dark:bg-blue-950/30 px-3 py-2 text-xs border border-blue-200 dark:border-blue-800">
								<div class="flex items-center gap-2">
									<span class="text-blue-700 dark:text-blue-300">
										✓ Detecting {ctx.highlightRanges.filter(r => r.class === 'cm-segment-highlight').length} segment(s) in editor
									</span>
								</div>
							</div>
						{:else if ctx.viewMode === 'original' && ctx.currentText && !pair.pattern}
							<div class="rounded-md bg-yellow-50 dark:bg-yellow-950/30 px-3 py-2 text-xs border border-yellow-200 dark:border-yellow-800">
								<div class="flex items-center gap-2">
									<span class="text-yellow-700 dark:text-yellow-300">
										⚠ Invalid pattern template
									</span>
								</div>
							</div>
						{/if}

						{#if ctx.markerPairs.length > 1}
							<Button
								variant="destructive"
								size="sm"
								class="w-full"
								onclick={() => ctx.removeMarkerPair(pair.id)}
								data-testid="remove-marker-pair-{pair.id}"
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
			size="lg"
			class="w-full bg-blue-600 text-white hover:bg-blue-700 font-semibold"
			onclick={handleProcess}
			disabled={ctx.isProcessing || !ctx.currentText}
			data-testid="process-button"
		>
			{ctx.isProcessing ? 'Processing...' : 'Process Chunks'}
		</Button>
	</CardContent>
</div>
