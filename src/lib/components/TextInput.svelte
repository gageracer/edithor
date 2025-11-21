<script lang="ts">
	import { Button } from "$lib/components/ui/button";
	import { Label } from "$lib/components/ui/label";
	import { Textarea } from "$lib/components/ui/textarea";

	interface Props {
		value?: string;
		onTextChange?: (text: string) => void;
	}

	let { value = $bindable(""), onTextChange }: Props = $props();

	let fileInput: HTMLInputElement;

	function handleFileUpload(event: Event) {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];

		if (!file) return;

		// Only accept text files
		if (!file.type.startsWith('text/')) {
			alert('Please upload a text file (.txt)');
			return;
		}

		// Check file size (max 5MB)
		const maxSize = 5 * 1024 * 1024; // 5MB in bytes
		if (file.size > maxSize) {
			alert('File is too large. Maximum size is 5MB.');
			return;
		}

		const reader = new FileReader();

		reader.onload = (e) => {
			const text = e.target?.result as string;
			value = text;
			if (onTextChange) {
				onTextChange(text);
			}
		};

		reader.onerror = () => {
			alert('Error reading file. Please try again.');
		};

		reader.readAsText(file);
	}

	function triggerFileUpload() {
		fileInput?.click();
	}
</script>

<div class="space-y-4">
	<div class="space-y-2">
		<Label for="text-input">Your Script</Label>
		<Textarea
			id="text-input"
			placeholder="Paste your voiceover script here..."
			bind:value
			rows={10}
			onchange={() => onTextChange?.(value)}
		/>
		<p class="text-xs text-muted-foreground">
			{#if value.length > 0}
				{value.length.toLocaleString()} characters
			{:else}
				Enter or paste your text above
			{/if}
		</p>
	</div>

	<div class="flex items-center gap-4">
		<input
			type="file"
			accept=".txt,text/plain"
			bind:this={fileInput}
			onchange={handleFileUpload}
			class="hidden"
			aria-label="Upload text file"
		/>
		<Button variant="outline" onclick={triggerFileUpload} type="button">
			📁 Upload File
		</Button>
		<span class="text-sm text-muted-foreground">or paste text above</span>
	</div>
</div>
