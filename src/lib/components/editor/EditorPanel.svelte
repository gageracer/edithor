<script lang="ts">
	import { getEditorContext } from '$lib/contexts/editorContext.svelte';
	import CodeMirrorEditor from './CodeMirrorEditor.svelte';
	import { Button } from '$lib/components/ui/button';

	const ctx = getEditorContext();

	function toggleView() {
		ctx.switchView(ctx.viewMode === 'original' ? 'result' : 'original');
	}

	const displayText = $derived(ctx.viewMode === 'original' ? ctx.currentText : ctx.resultText);
	const isReadonly = $derived(ctx.viewMode === 'result');
</script>

<div class="flex flex-col h-full border rounded-lg bg-card" data-testid="editor-panel">
	<!-- Header -->
	<div class="flex items-center justify-between border-b px-4 py-3 flex-shrink-0" data-testid="editor-header">
		<h3 class="font-semibold text-lg" data-testid="editor-title">
			{ctx.viewMode === 'original' ? 'Original Text' : 'Result'}
		</h3>

		<Button
			variant="outline"
			size="sm"
			onclick={toggleView}
			disabled={!ctx.resultText}
			data-testid="toggle-view-button"
		>
			{ctx.viewMode === 'original' ? 'Show Result' : 'Show Original'}
		</Button>
	</div>

	<!-- Editor -->
	<div class="flex-1 min-h-0 p-2" data-testid="editor-container">
		<CodeMirrorEditor
			content={displayText}
			readonly={isReadonly}
			highlights={ctx.highlightRanges}
			lineNumbers={true}
			onChange={(value) => ctx.setCurrentText(value)}
		/>
	</div>
</div>
