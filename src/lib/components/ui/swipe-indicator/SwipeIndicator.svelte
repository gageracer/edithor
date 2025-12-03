<script lang="ts">
	import { fade } from 'svelte/transition';

	type Direction = 'left' | 'right';

	interface Props {
		show: boolean;
		direction?: Direction;
		label?: string;
	}

	let { show = false, direction = 'right', label }: Props = $props();

	const directionConfig = {
		left: {
			position: 'left-4',
			icon: 'M11 19l-7-7 7-7m8 14l-7-7 7-7',
			defaultLabel: 'Swipe right to go back'
		},
		right: {
			position: 'right-4',
			icon: 'M13 5l7 7-7 7M5 5l7 7-7 7',
			defaultLabel: 'Swipe left to continue'
		}
	};

	const config = $derived(directionConfig[direction]);
	const displayLabel = $derived(label || config.defaultLabel);
</script>

{#if show}
	<div
		class="fixed {config.position} top-1/2 -translate-y-1/2 z-50"
		in:fade={{ duration: 150 }}
		out:fade={{ duration: 150 }}
	>
		<div class="flex flex-col items-center gap-2">
			<div class="bg-primary text-primary-foreground rounded-full p-4 shadow-2xl animate-pulse">
				<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={config.icon} />
				</svg>
			</div>
			{#if displayLabel}
				<div class="bg-primary/90 text-primary-foreground text-xs px-3 py-1.5 rounded-full shadow-lg backdrop-blur-sm">
					{displayLabel}
				</div>
			{/if}
		</div>
	</div>
{/if}
