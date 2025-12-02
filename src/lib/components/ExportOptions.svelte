<script lang="ts">
	import { Button } from "$lib/components/ui/button";
	import type { Chunk } from "$lib/types";
	import JSZip from "jszip";
	import { exportAsSingleFile, prepareMultipleFiles } from "$lib/utils/chunker";
	import { toast } from "svelte-sonner";

	interface ExtendedChunk extends Chunk {
		formattedOutput?: string;
	}

	interface Props {
		chunks?: ExtendedChunk[];
		disabled?: boolean;
		beforeContent?: string;
		afterContent?: string;
	}

	let { chunks = [], disabled = false, beforeContent = "", afterContent = "" }: Props = $props();

	let isDownloading = $state(false);

	function getExportContent(): string {
		// If chunks have formatted output (with segment markers), use that
		if (chunks.length > 0 && chunks[0].formattedOutput) {
			return chunks.map(chunk => chunk.formattedOutput).join('\n\n');
		}
		// Otherwise use the standard export format
		return exportAsSingleFile(chunks);
	}

	function downloadSingleFile() {
		if (chunks.length === 0) return;

		isDownloading = true;

		try {
			const exportedContent = getExportContent();
			const content = beforeContent + exportedContent + afterContent;
			const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
			const url = URL.createObjectURL(blob);
			const link = document.createElement("a");
			link.href = url;
			link.download = "script-chunked.txt";
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			URL.revokeObjectURL(url);
		} catch (error) {
			console.error("Error downloading file:", error);
			toast.error("Failed to download file. Please try again.", { duration: 5000 });
		} finally {
			isDownloading = false;
		}
	}

	async function downloadZip() {
		if (chunks.length === 0) return;

		isDownloading = true;

		try {
			const zip = new JSZip();

			// If chunks have formatted output, use that for each file
			if (chunks.length > 0 && chunks[0].formattedOutput) {
				chunks.forEach((chunk, index) => {
					zip.file(`segment-${index + 1}.txt`, chunk.formattedOutput || chunk.content);
				});
			} else {
				const files = prepareMultipleFiles(chunks);
				files.forEach(({ filename, content }) => {
					zip.file(filename, content);
				});
			}

			// Generate the ZIP file
			const zipBlob = await zip.generateAsync({ type: "blob" });

			// Trigger download
			const url = URL.createObjectURL(zipBlob);
			const link = document.createElement("a");
			link.href = url;
			link.download = "script-chunks.zip";
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			URL.revokeObjectURL(url);
		} catch (error) {
			console.error("Error creating ZIP:", error);
			toast.error("Failed to create ZIP file. Please try again.", { duration: 5000 });
		} finally {
			isDownloading = false;
		}
	}

	async function copyToClipboard() {
		if (chunks.length === 0) return;

		try {
			const exportedContent = getExportContent();
			const content = beforeContent + exportedContent + afterContent;
			await navigator.clipboard.writeText(content);
			toast.success("Copied to clipboard!");
		} catch (error) {
			console.error("Error copying to clipboard:", error);
			toast.error("Failed to copy to clipboard", { duration: 5000 });
		}
	}
</script>

<div class="flex flex-col gap-2">
	<div class="flex flex-col sm:flex-row gap-2">
		<Button
			variant="outline"
			onclick={copyToClipboard}
			disabled={disabled || chunks.length === 0}
			class="flex-1"
		>
			📋 Copy to Clipboard
		</Button>
		<Button
			variant="outline"
			onclick={downloadSingleFile}
			disabled={disabled || isDownloading || chunks.length === 0}
			class="flex-1"
		>
			{#if isDownloading}
				⏳ Downloading...
			{:else}
				📄 Download Single File
			{/if}
		</Button>
		<Button
			variant="outline"
			onclick={downloadZip}
			disabled={disabled || isDownloading || chunks.length === 0}
			class="flex-1"
		>
			{#if isDownloading}
				⏳ Creating ZIP...
			{:else}
				📦 Download ZIP
			{/if}
		</Button>
	</div>
</div>
