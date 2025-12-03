<script lang="ts">
	import { onMount } from 'svelte';
	import { setEditorContext } from '$lib/contexts/editorContext.svelte';
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
	<!-- Header -->
	<div class="border-b bg-card px-6 py-3">
		<div class="flex items-center justify-between">
			<h1 class="text-xl font-semibold">Text Chunking ✂️</h1>
			<div class="flex items-center gap-4">
				<a href="/history" class="text-sm text-muted-foreground hover:text-foreground transition-colors">
					📚 History
				</a>
				<a href="/" class="text-sm text-muted-foreground hover:text-foreground transition-colors">
					← Back to Home
				</a>
			</div>
		</div>
	</div>

	<!-- Stats Bar -->
	<StatsBar stats={ctx.stats} />

	<!-- Main Content: Split Panel -->
	<div class="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 p-4 overflow-hidden">
		<!-- Editor Panel (Left) - with its own scroll -->
		<div class="overflow-auto">
			<EditorPanel />
		</div>

		<!-- Filter Panel (Right) - with its own scroll -->
		<div class="overflow-auto">
			<FilterPanel />
		</div>
	</div>

	<!-- History Tabs (Bottom) -->
	<HistoryTabs />
</div>
