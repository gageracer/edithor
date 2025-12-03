<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { EditorView } from '@codemirror/view';
	import { EditorState, StateField, StateEffect } from '@codemirror/state';
	import { Decoration, type DecorationSet } from '@codemirror/view';
	import { basicSetup } from 'codemirror';
	import { markdown } from '@codemirror/lang-markdown';
	import { lineNumbers } from '@codemirror/view';
	import type { HighlightRange } from '$lib/contexts/editorContext.svelte';

	interface Props {
		content: string;
		readonly?: boolean;
		highlights?: HighlightRange[];
		lineNumbers?: boolean;
		onChange?: (value: string) => void;
	}

	let {
		content,
		readonly = false,
		highlights = [],
		lineNumbers: showLineNumbers = true,
		onChange
	}: Props = $props();

	let editorElement: HTMLDivElement;
	let view: EditorView | undefined;

	// Highlight decoration field
	const highlightEffect = StateEffect.define<HighlightRange[]>();

	const highlightField = StateField.define<DecorationSet>({
		create() {
			return Decoration.none;
		},
		update(decorations, tr) {
			decorations = decorations.map(tr.changes);
			for (let effect of tr.effects) {
				if (effect.is(highlightEffect)) {
					const marks = effect.value.map(({ from, to, class: cls }) =>
						Decoration.mark({ class: cls }).range(from, to)
					);
					decorations = Decoration.set(marks, true);
				}
			}
			return decorations;
		},
		provide: (f) => EditorView.decorations.from(f)
	});

	onMount(() => {
		const extensions = [
			basicSetup,
			markdown(),
			highlightField,
			EditorView.editable.of(!readonly)
		];

		if (showLineNumbers) {
			extensions.push(lineNumbers());
		}

		if (onChange && !readonly) {
			extensions.push(
				EditorView.updateListener.of((update) => {
					if (update.docChanged) {
						onChange(update.state.doc.toString());
					}
				})
			);
		}

		const state = EditorState.create({
			doc: content,
			extensions
		});

		view = new EditorView({
			state,
			parent: editorElement
		});

		// Apply initial highlights
		if (highlights.length > 0) {
			view.dispatch({
				effects: highlightEffect.of(highlights)
			});
		}
	});

	// React to highlight changes
	$effect(() => {
		if (view && highlights) {
			// Validate that highlight positions are within document bounds
			const docLength = view.state.doc.length;
			const validHighlights = highlights.filter(h => h.from >= 0 && h.to <= docLength && h.from < h.to);

			if (validHighlights.length > 0) {
				view.dispatch({
					effects: highlightEffect.of(validHighlights)
				});
			}
		}
	});

	// React to content changes from outside
	$effect(() => {
		if (view && content !== view.state.doc.toString()) {
			view.dispatch({
				changes: { from: 0, to: view.state.doc.length, insert: content }
			});
		}
	});

	onDestroy(() => {
		view?.destroy();
	});
</script>

<div bind:this={editorElement} class="cm-editor-wrapper"></div>

<style>
	:global(.cm-editor-wrapper) {
		height: 100%;
		width: 100%;
	}

	:global(.cm-editor) {
		height: 100%;
		border: 1px solid var(--color-border);
		border-radius: 0.5rem;
	}

	:global(.cm-scroller) {
		font-family: ui-monospace, monospace;
		font-size: 0.875rem;
	}

	:global(.cm-content) {
		min-height: 100%;
		padding: 0.5rem;
	}

	:global(.cm-line) {
		padding-left: 0.5rem;
		padding-right: 0.5rem;
	}

	/* Highlight styles */
	:global(.cm-segment-highlight) {
		background-color: rgb(219 234 254);
		border-left: 2px solid rgb(59 130 246);
		padding-left: 0.25rem;
	}

	:global(.dark .cm-segment-highlight) {
		background-color: rgb(30 58 138 / 0.3);
	}

	:global(.cm-segment-active) {
		background-color: rgb(254 249 195);
		border-left: 2px solid rgb(234 179 8);
		padding-left: 0.25rem;
	}

	:global(.dark .cm-segment-active) {
		background-color: rgb(113 63 18 / 0.3);
	}

	/* Theme adjustments */
	:global(.cm-editor .cm-gutters) {
		background-color: var(--color-muted);
		border-right: 1px solid var(--color-border);
	}

	:global(.cm-editor .cm-activeLineGutter) {
		background-color: var(--color-accent);
	}

	:global(.cm-editor.cm-focused) {
		outline: none;
		box-shadow: 0 0 0 2px var(--color-ring);
	}
</style>
