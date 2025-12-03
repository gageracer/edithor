<script lang="ts">
	import { cn } from "$lib/utils.js";
	import { Loader2 } from "lucide-svelte";
	import type { ComponentProps } from "svelte";

	type Props = ComponentProps<typeof Loader2>;

	let { class: className, ...restProps }: Props = $props();
</script>

<Loader2
	role="status"
	aria-label="Loading"
	class={cn("size-4 animate-spin", className)}
	{...restProps}
/>
