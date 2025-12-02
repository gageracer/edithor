<script lang="ts">
	import { getEditorContext } from '$lib/contexts/editorContext.svelte';
	import { Button } from '$lib/components/ui/button';
	import { ChevronLeft, ChevronRight } from 'lucide-svelte';

	const ctx = getEditorContext();
	let scrollContainer: HTMLDivElement;
	let canScrollLeft = $state(false);
	let canScrollRight = $state(false);

	function formatTimestamp(timestamp: number): string {
		const date = new Date(timestamp);
		return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
	}

	function getTabName(state: any, index: number): string {
		return state.name || `text${index + 1}`;
	}

	function scrollLeft() {
		if (scrollContainer) {
			scrollContainer.scrollBy({ left: -400, behavior: 'smooth' });
			setTimeout(updateScrollButtons, 100);
		}
	}

	function scrollRight() {
		if (scrollContainer) {
			scrollContainer.scrollBy({ left: 400, behavior: 'smooth' });
			setTimeout(updateScrollButtons, 100);
		}
	}

	function updateScrollButtons() {
		if (scrollContainer) {
			canScrollLeft = scrollContainer.scrollLeft > 5;
			canScrollRight =
				scrollContainer.scrollLeft < scrollContainer.scrollWidth - scrollContainer.clientWidth - 5;
		}
	}

	function handleWheel(e: WheelEvent) {
		// Convert vertical mouse wheel to horizontal scroll
		if (e.deltaY !== 0 && scrollContainer) {
			e.preventDefault();
			scrollContainer.scrollBy({ left: e.deltaY, behavior: 'auto' });
			updateScrollButtons();
		}
	}

	$effect(() => {
		if (scrollContainer) {
			// Initial check with longer delay
			setTimeout(updateScrollButtons, 200);

			scrollContainer.addEventListener('scroll', updateScrollButtons);
			scrollContainer.addEventListener('wheel', handleWheel, { passive: false });

			// Also update on window resize
			const resizeObserver = new ResizeObserver(() => {
				setTimeout(updateScrollButtons, 200);
			});
			resizeObserver.observe(scrollContainer);

			return () => {
				scrollContainer.removeEventListener('scroll', updateScrollButtons);
				scrollContainer.removeEventListener('wheel', handleWheel);
				resizeObserver.disconnect();
			};
		}
	});

	// Also update when history changes
	$effect(() => {
		if (ctx.historyStates.length > 0) {
			setTimeout(updateScrollButtons, 300);
		}
	});
</script>

<div class="border-t bg-card flex-shrink-0 w-full relative" data-testid="history-tabs">
	<!-- Left scroll button -->
	{#if canScrollLeft}
		<button
			onclick={scrollLeft}
			class="absolute left-0 top-0 bottom-0 z-10 px-3 hover:opacity-90 transition-opacity flex items-center"
			style="background: linear-gradient(to right, hsl(var(--card)) 60%, transparent);"
			aria-label="Scroll left"
		>
			<ChevronLeft class="w-5 h-5" />
		</button>
	{/if}

	<!-- Scrollable container -->
	<div
		bind:this={scrollContainer}
		class="overflow-x-auto overflow-y-hidden scrollbar-thin w-full scroll-smooth"
	>
		<div class="flex gap-2 px-4 py-3">
			{#if ctx.historyStates.length === 0}
				<p class="text-sm text-muted-foreground py-2" data-testid="no-history">No history yet</p>
			{:else}
				{#each ctx.historyStates as state, index (state.id)}
					<Button
						variant={ctx.currentHistoryId === state.id ? 'default' : 'outline'}
						size="sm"
						class="flex flex-col items-start gap-1 h-auto py-2 px-3 shrink-0"
						onclick={() => state.id && ctx.loadHistoryItem(state.id)}
						data-testid="history-tab-{state.id}"
					>
						<span class="text-xs font-semibold whitespace-nowrap">
							{getTabName(state, index)}
						</span>
						<span class="text-xs opacity-70 whitespace-nowrap">
							{formatTimestamp(state.timestamp)}
						</span>
					</Button>
				{/each}
			{/if}
		</div>
	</div>

	<!-- Right scroll button -->
	{#if canScrollRight}
		<button
			onclick={scrollRight}
			class="absolute right-0 top-0 bottom-0 z-10 px-3 hover:opacity-90 transition-opacity flex items-center"
			style="background: linear-gradient(to left, hsl(var(--card)) 60%, transparent);"
			aria-label="Scroll right"
		>
			<ChevronRight class="w-5 h-5" />
		</button>
	{/if}
</div>

<style>
	/* Custom scrollbar styling for better visibility */
	.scrollbar-thin {
		scrollbar-width: thin;
		scrollbar-color: hsl(var(--muted-foreground) / 0.3) transparent;
	}

	.scrollbar-thin::-webkit-scrollbar {
		height: 8px;
	}

	.scrollbar-thin::-webkit-scrollbar-track {
		background: transparent;
	}

	.scrollbar-thin::-webkit-scrollbar-thumb {
		background-color: hsl(var(--muted-foreground) / 0.3);
		border-radius: 4px;
	}

	.scrollbar-thin::-webkit-scrollbar-thumb:hover {
		background-color: hsl(var(--muted-foreground) / 0.5);
	}

	/* Smooth scroll behavior */
	.scroll-smooth {
		scroll-behavior: smooth;
	}

	/* Ensure scroll arrows are clickable and visible */
	button[aria-label^="Scroll"] {
		transition: opacity 0.2s;
		cursor: pointer;
	}

	button[aria-label^="Scroll"]:active {
		opacity: 1 !important;
	}

	/* Show subtle scroll hint when content overflows */
	.overflow-x-auto {
		position: relative;
	}
</style>
