<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
	import type { EditorStats } from '$lib/contexts/editorContext.svelte';

	interface Props {
		stats: EditorStats;
	}

	let { stats }: Props = $props();

	function formatNumber(num: number): string {
		return num.toLocaleString();
	}
</script>

<div class="border border-border rounded-lg bg-card px-3 py-2" data-testid="stats-bar">
	<div class="flex items-center gap-2 flex-wrap justify-center">
		<Badge variant="secondary" class="text-xs px-2 py-0.5" data-testid="stat-words">
			<span class="font-semibold mr-1" data-testid="stat-words-value">{formatNumber(stats.totalWords)}</span>
			<span class="text-muted-foreground">words</span>
		</Badge>

		<Badge variant="secondary" class="text-xs px-2 py-0.5" data-testid="stat-segments">
			<span class="font-semibold mr-1" data-testid="stat-segments-value">{formatNumber(stats.segmentCount)}</span>
			<span class="text-muted-foreground">segments</span>
		</Badge>

		<Badge variant="secondary" class="text-xs px-2 py-0.5" data-testid="stat-avgsize">
			<span class="font-semibold mr-1" data-testid="stat-avgsize-value">{formatNumber(stats.avgSize)}</span>
			<span class="text-muted-foreground">avg</span>
		</Badge>

		<Badge variant="secondary" class="text-xs px-2 py-0.5" data-testid="stat-sessions">
			<span class="font-semibold mr-1" data-testid="stat-sessions-value">{formatNumber(stats.sessionCount)}</span>
			<span class="text-muted-foreground">sessions</span>
		</Badge>

		<Badge variant="secondary" class="text-xs px-2 py-0.5" data-testid="stat-chars">
			<span class="font-semibold mr-1" data-testid="stat-chars-value">{formatNumber(stats.totalChars)}</span>
			<span class="text-muted-foreground">chars</span>
		</Badge>
	</div>
</div>
