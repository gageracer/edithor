<script lang="ts">
	import type { EditorStats } from '$lib/contexts/editorContext.svelte';

	interface Props {
		stats: EditorStats;
	}

	let { stats }: Props = $props();

	function formatNumber(num: number): string {
		return num.toLocaleString();
	}
</script>

<div class="border-b bg-card px-6 py-3" data-testid="stats-bar">
	<div class="flex items-center gap-6 text-sm">
		<div class="flex items-center gap-2" data-testid="stat-words">
			<span class="font-semibold text-foreground" data-testid="stat-words-value">{formatNumber(stats.totalWords)}</span>
			<span class="text-muted-foreground">words</span>
		</div>

		<div class="h-4 w-px bg-border"></div>

		<div class="flex items-center gap-2" data-testid="stat-segments">
			<span class="font-semibold text-foreground" data-testid="stat-segments-value">{formatNumber(stats.segmentCount)}</span>
			<span class="text-muted-foreground">segments</span>
		</div>

		<div class="h-4 w-px bg-border"></div>

		<div class="flex items-center gap-2" data-testid="stat-avgsize">
			<span class="font-semibold text-foreground" data-testid="stat-avgsize-value">{formatNumber(stats.avgSize)}</span>
			<span class="text-muted-foreground">avg size</span>
		</div>

		<div class="h-4 w-px bg-border"></div>

		<div class="flex items-center gap-2" data-testid="stat-sessions">
			<span class="font-semibold text-foreground" data-testid="stat-sessions-value">{formatNumber(stats.sessionCount)}</span>
			<span class="text-muted-foreground">sessions</span>
		</div>

		<div class="h-4 w-px bg-border"></div>

		<div class="flex items-center gap-2" data-testid="stat-chars">
			<span class="font-semibold text-foreground" data-testid="stat-chars-value">{formatNumber(stats.totalChars)}</span>
			<span class="text-muted-foreground">total chars</span>
		</div>
	</div>
</div>
