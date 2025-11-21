<script lang="ts">
	import type { HTMLInputAttributes } from "svelte/elements";
	import { cn } from "$lib/utils/cn.js";

	type Props = HTMLInputAttributes & {
		value?: string | number;
	};

	let {
		class: className,
		type = "text",
		value = $bindable(""),
		...restProps
	}: Props = $props();
</script>

<input
	bind:value
	{type}
	class={cn(
		"flex h-10 w-full rounded-md border border-input bg-black/50 px-3 py-2 text-sm text-foreground ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
		className
	)}
	{...restProps}
/>
