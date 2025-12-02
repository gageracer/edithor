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
	<!-- Stats Bar -->
	<StatsBar stats={ctx.stats} />

	<!-- Main Content: Split Panel -->
	<div class="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 p-4 overflow-hidden">
		<!-- Editor Panel (Left) -->
		<EditorPanel />

		<!-- Filter Panel (Right) -->
		<FilterPanel />
	</div>

	<!-- History Tabs (Bottom) -->
	<HistoryTabs />
</div>
