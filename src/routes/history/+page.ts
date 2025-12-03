import { historyStore } from "$lib/stores/historyStore.svelte";
import type { PageLoad } from './$types';

export const ssr = false;
export const prerender = false;

export const load: PageLoad = async () => {
	// If data is cached, return immediately (instant!)
	if (historyStore.isCached) {
		// Start background refresh but don't wait for it
		historyStore.load().catch(console.error);
		return {
			states: historyStore.states
		};
	}

	// First time load - fetch from IndexedDB
	try {
		const states = await historyStore.load();
		return {
			states
		};
	} catch (error) {
		console.error('Failed to load states:', error);
		return {
			states: []
		};
	}
};
