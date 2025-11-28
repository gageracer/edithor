<script lang="ts">
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { buttonVariants } from '$lib/components/ui/button';
	import { Scissors, RefreshCw } from 'lucide-svelte';
</script>

<svelte:head>
	<title>Edithor - Smart Text Chunking Tool</title>
	<meta
		name="description"
		content="Smart text chunking for AI voiceover tools. Split your scripts intelligently while preserving sentence boundaries."
	/>
</svelte:head>

<div class="container mx-auto min-h-screen p-4 sm:p-8">
	<div class="mx-auto max-w-5xl space-y-8">
		<!-- Header -->
		<div class="text-center space-y-2">
			<h1 class="text-4xl font-bold tracking-tight">Edithor ✂️</h1>
			<p class="text-muted-foreground text-lg">Smart text chunking for AI voiceover tools</p>
		</div>

		<!-- Mode Selection Cards -->
		<div class="grid gap-6 md:grid-cols-2">
			<!-- Chunking Mode -->
			<Card class="hover:shadow-lg transition-shadow">
				<CardHeader>
					<div class="flex items-center gap-2">
						<Scissors class="h-6 w-6" />
						<CardTitle>Text Chunking</CardTitle>
					</div>
					<CardDescription>
						Split your text into smart chunks for AI voiceover tools
					</CardDescription>
				</CardHeader>
				<CardContent>
					<ul class="space-y-2 text-sm text-muted-foreground mb-4">
						<li>• Preserves sentence boundaries</li>
						<li>• Configurable character limits</li>
						<li>• Tolerance settings for optimal splits</li>
						<li>• Export to multiple formats</li>
					</ul>
					<a href="/chunking" class={buttonVariants({ variant: 'outline', class: 'w-full' })}>
						Start Chunking
					</a>
				</CardContent>
			</Card>

			<!-- Refactoring Mode -->
			<Card class="hover:shadow-lg transition-shadow">
				<CardHeader>
					<div class="flex items-center gap-2">
						<RefreshCw class="h-6 w-6" />
						<CardTitle>Segment Refactoring</CardTitle>
					</div>
					<CardDescription>
						Fix AI-generated segment markers with correct character counts
					</CardDescription>
				</CardHeader>
				<CardContent>
					<ul class="space-y-2 text-sm text-muted-foreground mb-4">
						<li>• Corrects segment numbering</li>
						<li>• Updates character counts</li>
						<li>• Preserves story metadata</li>
						<li>• Processes targeted sections only</li>
					</ul>
					<a href="/refactoring" class={buttonVariants({ variant: 'outline', class: 'w-full' })}>
						Start Refactoring
					</a>
				</CardContent>
			</Card>
		</div>

		<!-- Footer -->
		<div class="text-center text-sm text-muted-foreground border-t pt-8">
			<p class="mt-2 text-xs">
				All processing happens in your browser. Your text never leaves your device.
			</p>
		</div>
	</div>
</div>
