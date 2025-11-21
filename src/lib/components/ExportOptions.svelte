<script lang="ts">
	import { Button } from "$lib/components/ui/button";
	import type { Chunk } from "$lib/types";
	import JSZip from "jszip";
	import { exportAsSingleFile, prepareMultipleFiles } from "$lib/utils/chunker";

	interface Props {
		chunks?: Chunk[];
		disabled?: boolean;
	}

	let { chunks = [], disabled = false }: Props = $props();

	let isDownloading = $state(false);

	function downloadSingleFile() {
		if (chunks.length === 0) return;

		isDownloading = true;

		try {
			const content = exportAsSingleFile(chunks);
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
			alert("Failed to download file. Please try again.");
		} finally {
			isDownloading = false;
		}
	}

	async function downloadZip() {
		if (chunks.length === 0) return;

		isDownloading = true;

		try {
			const zip = new JSZip();
			const files = prepareMultipleFiles(chunks);

			// Add each chunk as a separate file to the ZIP
			files.forEach(({ filename, content }) => {
				zip.file(filename, content);
			});

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
			alert("Failed to create ZIP file. Please try again.");
		} finally {
			isDownloading = false;
		}
	}
</script>

<div class="flex flex-col sm:flex-row gap-2">
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
