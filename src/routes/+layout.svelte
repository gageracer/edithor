<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { Toaster } from '$lib/components/ui/sonner';
	import { onNavigate, beforeNavigate, afterNavigate } from '$app/navigation';
	import { Spinner } from '$lib/components/ui/spinner';

	let { children } = $props();
	let showLoading = $state(false);

	beforeNavigate((navigation) => {
		// Show loading when navigating to history page
		if (navigation.to?.route?.id === '/history') {
			showLoading = true;
		}
	});

	afterNavigate(() => {
		// Hide loading after navigation completes
		showLoading = false;
	});

	onNavigate((navigation) => {
		if (!document.startViewTransition) return;

		return new Promise((resolve) => {
			document.startViewTransition(async () => {
				resolve();
				await navigation.complete;
			});
		});
	});
</script>

<!-- Loading Indicator for History Page -->
{#if showLoading}
	<!-- Backdrop -->
	<div class="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200"></div>

	<!-- Loading card -->
	<div class="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-card/95 backdrop-blur-md border border-border rounded-lg shadow-2xl p-6 flex flex-col items-center gap-3 animate-in fade-in zoom-in-95 duration-200">
		<Spinner class="w-8 h-8" />
		<span class="text-sm font-medium">Loading History...</span>
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
