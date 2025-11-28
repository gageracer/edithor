<script lang="ts">
	import RefactoringMode from '$lib/components/RefactoringMode.svelte';
</script>

<svelte:head>
	<title>Segment Refactoring - Edithor</title>
	<meta
		name="description"
		content="Fix AI-generated segment markers with correct character counts and numbering."
	/>
</svelte:head>

<div class="container mx-auto min-h-screen p-4 sm:p-8">
	<div class="mx-auto max-w-5xl space-y-8">
		<!-- Header -->
		<div class="text-center space-y-2">
			<h1 class="text-4xl font-bold tracking-tight">Segment Refactoring 🔄</h1>
			<p class="text-muted-foreground text-lg">
				Fix AI-generated segment markers with correct character counts
			</p>
		</div>

		<!-- Back to home link -->
		<div>
			<a href="/" class="text-sm text-muted-foreground hover:text-foreground transition-colors">
				← Back to Home
			</a>
		</div>

		<!-- Refactoring Mode Component -->
		<RefactoringMode />

		<!-- Footer -->
		<div class="text-center text-sm text-muted-foreground border-t pt-8">
			<p class="mt-2 text-xs">
				All processing happens in your browser. Your text never leaves your device.
			</p>
		</div>
	</div>
</div>
