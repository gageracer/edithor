<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	onMount(() => {
		goto('/chunking', { replaceState: true });
	});
</script>

<svelte:head>
	<title>Redirecting...</title>
</svelte:head>

<div class="container mx-auto min-h-screen p-4 sm:p-8 flex items-center justify-center">
	<div class="text-center">
		<p class="text-muted-foreground">Redirecting to new editor...</p>
	</div>
</div>
