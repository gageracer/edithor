<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { Toaster } from '$lib/components/ui/sonner';
	import { onNavigate, beforeNavigate } from '$app/navigation';
	import { Spinner } from '$lib/components/ui/spinner';

	let { children } = $props();
	let isNavigating = $state(false);

	beforeNavigate(() => {
		isNavigating = true;
	});

	onNavigate((navigation) => {
		if (!document.startViewTransition) {
			isNavigating = false;
			return;
		}

		return new Promise((resolve) => {
			document.startViewTransition(async () => {
				resolve();
				await navigation.complete;
				isNavigating = false;
			});
		});
	});
</script>

<!-- Navigation Loading Indicator -->
{#if isNavigating}
	<!-- Backdrop -->
	<div class="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200"></div>

	<!-- Top progress bar -->
	<div class="fixed top-0 left-0 right-0 z-50 h-1 bg-primary/20">
		<div class="h-full bg-primary animate-pulse"></div>
	</div>

	<!-- Loading card -->
	<div class="fixed top-4 right-4 z-50 bg-card/95 backdrop-blur-md border rounded-lg shadow-2xl p-3 flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
		<Spinner class="w-4 h-4" />
		<span class="text-sm font-medium">Loading...</span>
	</div>
{/if}

<svelte:head>
	<link rel="icon" href={favicon} />
	<meta name="view-transition" content="same-origin" />
</svelte:head>

{@render children()}
<Toaster />

<style>
	:global(::view-transition-old(root)),
	:global(::view-transition-new(root)) {
		animation-duration: 0.3s;
	}

	:global(::view-transition-old(root)) {
		animation-name: fade-out, slide-to-left;
	}

	:global(::view-transition-new(root)) {
		animation-name: fade-in, slide-from-right;
	}

	@keyframes fade-out {
		to {
			opacity: 0;
		}
	}

	@keyframes fade-in {
		from {
			opacity: 0;
		}
	}

	@keyframes slide-to-left {
		to {
			transform: translateX(-30px);
		}
	}

	@keyframes slide-from-right {
		from {
			transform: translateX(30px);
		}
	}
</style>
