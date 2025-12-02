<script lang="ts">
	import { getEditorContext } from '$lib/contexts/editorContext.svelte';
	import { Button } from '$lib/components/ui/button';

	const ctx = getEditorContext();

	function formatTimestamp(timestamp: number): string {
		const date = new Date(timestamp);
		return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
	}

	function getTabName(state: any, index: number): string {
		return state.name || `text${index + 1}`;
	}
</script>

<div class="border-t bg-card">
	<div class="px-4 py-3 overflow-x-auto">
		<div class="flex gap-2 min-w-max">
			{#if ctx.historyStates.length === 0}
				<p class="text-sm text-muted-foreground py-2">No history yet</p>
			{:else}
				{#each ctx.historyStates as state, index (state.id)}
					<Button
						variant={ctx.currentHistoryId === state.id ? 'default' : 'outline'}
						size="sm"
						class="flex flex-col items-start gap-1 h-auto py-2 px-3"
						onclick={() => state.id && ctx.loadHistoryItem(state.id)}
					>
						<span class="text-xs font-semibold">
							{getTabName(state, index)}
						</span>
						<span class="text-xs opacity-70">
							{formatTimestamp(state.timestamp)}
						</span>
					</Button>
				{/each}
			{/if}
		</div>
	</div>
</div>
