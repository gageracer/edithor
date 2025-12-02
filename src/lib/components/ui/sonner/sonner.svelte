<script lang="ts">
	import { Toaster as Sonner, type ToasterProps as SonnerProps } from "svelte-sonner";
	import { mode } from "mode-watcher";

	let { ...restProps }: SonnerProps = $props();
</script>

<Sonner
	theme={mode.current}
	class="toaster group"
	toastOptions={{
		classes: {
			error: 'bg-red-600 text-white border-red-600',
			success: 'bg-green-600 text-white border-green-600',
			warning: 'bg-yellow-600 text-white border-yellow-600',
			info: 'bg-blue-600 text-white border-blue-600',
		},
	}}
	{...restProps}
/>
