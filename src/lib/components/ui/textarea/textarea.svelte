<script lang="ts">
	import type { HTMLTextareaAttributes } from "svelte/elements";
	import { cn } from "$lib/utils/cn.js";

	type Props = HTMLTextareaAttributes & {
		value?: string;
	};

	let {
		class: className,
		value = $bindable(""),
		...restProps
	}: Props = $props();
</script>

<textarea
	bind:value
	class={cn(
		"flex min-h-20 w-full rounded-md border border-input bg-black/50 px-3 py-2 text-sm text-foreground ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
		className
	)}
	{...restProps}
></textarea>
