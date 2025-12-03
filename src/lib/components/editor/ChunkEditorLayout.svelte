<script lang="ts">
	import { onMount } from 'svelte';
	import { setEditorContext } from '$lib/contexts/editorContext.svelte';
	import { resolve } from '$app/paths';
	import EditorPanel from './EditorPanel.svelte';
	import FilterPanel from './FilterPanel.svelte';
	import StatsBar from './StatsBar.svelte';
	import HistoryTabs from './HistoryTabs.svelte';

	const ctx = setEditorContext();

	onMount(async () => {
		await ctx.loadHistory();
	});
</script>

<div class="flex flex-col h-screen bg-background">
	<!-- Main Content: Split Panel -->
	<div class="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 p-4 overflow-hidden">
		<!-- Editor Panel (Left) - with its own scroll, full height -->
		<div class="overflow-auto">
			<EditorPanel />
		</div>

		<!-- Right Side: Nav + Stats + Filter + History -->
		<div class="flex flex-col gap-4 overflow-hidden">
			<!-- Top Nav Bar (Right side only) -->
			<div class="flex-shrink-0 border rounded-lg bg-card px-4 py-2">
				<div class="flex items-center justify-between">
					<h1 class="text-lg font-semibold">Text Chunking ✂️</h1>
					<div class="flex items-center gap-3">
						<a href={resolve('/history')} class="text-sm text-muted-foreground hover:text-foreground transition-colors">
							📚 History
						</a>
						<a href={resolve('/')} class="text-sm text-muted-foreground hover:text-foreground transition-colors">
							← Back to Home
						</a>
					</div>
				</div>
			</div>

			<!-- Stats Bar (Right side only) -->
			<div class="flex-shrink-0">
				<StatsBar stats={ctx.stats} />
			</div>

			<!-- Filter Panel (Scrollable) -->
			<div class="flex-1 overflow-auto">
				<FilterPanel />
			</div>

			<!-- History Tabs (Right side only) -->
			<div class="flex-shrink-0">
				<HistoryTabs />
			</div>
		</div>
	</div>
</div>
