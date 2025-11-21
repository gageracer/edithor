<script lang="ts">
	import { Button } from "$lib/components/ui/button";
	import { Input } from "$lib/components/ui/input";
	import { Label } from "$lib/components/ui/label";

	interface Props {
		maxCharacters?: number;
		onProcess?: () => void;
		disabled?: boolean;
	}

	let {
		maxCharacters = $bindable(500),
		onProcess,
		disabled = false
	}: Props = $props();

	function handleProcess() {
		if (onProcess) {
			onProcess();
		}
	}
</script>

<div class="space-y-4">
	<div class="space-y-2">
		<Label for="chunk-limit">Character Limit per Chunk</Label>
		<div class="flex items-center gap-4">
			<Input
				id="chunk-limit"
				type="number"
				bind:value={maxCharacters}
				min={50}
				max={2000}
				class="max-w-[200px]"
			/>
			<span class="text-sm text-muted-foreground">characters</span>
		</div>
		<p class="text-xs text-muted-foreground">
			Text will be split into chunks of approximately {maxCharacters} characters while preserving sentence boundaries.
		</p>
	</div>

	<div class="flex justify-center">
		<Button
			onclick={handleProcess}
			variant="outline"
			{disabled}
		>
			✨ Process Text
		</Button>
	</div>
</div>
