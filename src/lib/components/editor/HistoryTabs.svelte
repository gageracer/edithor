<script lang="ts">
	import { getEditorContext } from '$lib/contexts/editorContext.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { ScrollArea } from '$lib/components/ui/scroll-area';

	const ctx = getEditorContext();

	function formatTimestamp(timestamp: number): string {
		const date = new Date(timestamp);
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffMins = Math.floor(diffMs / 60000);
		const diffHours = Math.floor(diffMs / 3600000);

		if (diffMins < 1) return 'now';
		if (diffMins < 60) return `${diffMins}m`;
		if (diffHours < 24) return `${diffHours}h`;
		return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
	}
</script>

<div class="border border-border rounded-lg bg-card" data-testid="history-tabs">
	<ScrollArea class="h-14" orientation="horizontal">
		<div class="flex gap-2 px-3 py-2 items-center">
			<span class="text-xs text-muted-foreground font-medium shrink-0 mr-1">History:</span>

			{#if ctx.historyStates.length === 0}
				<span class="text-xs text-muted-foreground">No sessions yet</span>
			{:else}
				{#each ctx.historyStates as state, index (state.id)}
					<Button
						variant={ctx.currentHistoryId === state.id ? 'outline' : 'secondary'}
						size="sm"
						class="h-8 px-3 gap-2 {ctx.currentHistoryId === state.id ? 'border-2 border-primary' : ''}"
						onclick={() => state.id && ctx.loadHistoryItem(state.id)}
						data-testid="history-tab-{state.id}"
					>
						<Badge variant="outline" class="text-[10px] px-1.5 py-0">
							{state.maxCharacters}
						</Badge>
						<span class="text-xs">{formatTimestamp(state.timestamp)}</span>
					</Button>
				{/each}

				<Button
					variant="outline"
					size="sm"
					class="h-8 px-2 ml-2 text-xs text-muted-foreground hover:text-destructive shrink-0"
					onclick={() => {
						if (confirm('Clear all history?')) {
							// TODO: Add clearAllHistory method to context
						}
					}}
				>
					Clear
				</Button>
			{/if}
		</div>
	</ScrollArea>
</div>
