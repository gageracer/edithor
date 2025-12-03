<script lang="ts">
	import { onMount } from 'svelte';
	import { setEditorContext } from '$lib/contexts/editorContext.svelte';
	import { resolve } from '$app/paths';
	import { goto } from '$app/navigation';
	import { SwipeIndicator } from '$lib/components/ui/swipe-indicator';
	import { historyStore } from '$lib/stores/historyStore.svelte';
	import EditorPanel from './EditorPanel.svelte';
	import FilterPanel from './FilterPanel.svelte';
	import StatsBar from './StatsBar.svelte';
	import HistoryTabs from './HistoryTabs.svelte';

	const ctx = setEditorContext();

	// Preload history data when hovering over the link
	function handleHistoryHover() {
		historyStore.preload();
	}

	let swipeStartX = $state(0);
	let swipeCurrentX = $state(0);
	let isSwiping = $state(false);
	let swipeThreshold = 100;
	let showSwipeIndicator = $state(false);

	onMount(async () => {
		await ctx.loadHistory();
	});

	// Swipe gesture handlers
	function handleTouchStart(e: TouchEvent) {
		swipeStartX = e.touches[0].clientX;
		isSwiping = true;
	}

	function handleTouchMove(e: TouchEvent) {
		if (!isSwiping) return;
		swipeCurrentX = e.touches[0].clientX;

		const swipeDistance = swipeCurrentX - swipeStartX;
		showSwipeIndicator = swipeDistance < -50;
	}

	function handleTouchEnd() {
		if (!isSwiping) return;

		const swipeDistance = swipeCurrentX - swipeStartX;

		if (Math.abs(swipeDistance) > swipeThreshold) {
			if (swipeDistance < 0) {
				// Swipe left - go to history
				goto(resolve('/history'));
			}
		}

		isSwiping = false;
		swipeStartX = 0;
		swipeCurrentX = 0;
		showSwipeIndicator = false;
	}
</script>

<div
	class="flex flex-col h-screen bg-background"
	ontouchstart={handleTouchStart}
	ontouchmove={handleTouchMove}
	ontouchend={handleTouchEnd}
>
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
						<a
							href={resolve('/history')}
							data-sveltekit-preload-data="hover"
							onmouseenter={handleHistoryHover}
							onfocus={handleHistoryHover}
							class="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
						>
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
							</svg>
							History
						</a>
						<span class="text-xs text-muted-foreground hidden sm:inline">
							← Swipe left
						</span>
						<a href={resolve('/')} data-sveltekit-preload-data="hover" class="text-sm text-muted-foreground hover:text-foreground transition-colors">
							← Back to Home
						</a>
					</div>
				</div>

				<!-- Swipe Indicator -->
				<SwipeIndicator show={showSwipeIndicator} direction="right" label="View History" />
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
