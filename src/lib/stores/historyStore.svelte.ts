import { getAllStates, type ChunkingState } from "$lib/db/storage";

class HistoryStore {
	private cache = $state<ChunkingState[] | null>(null);
	private loading = $state(false);
	private lastFetch = $state(0);
	private cacheDuration = 5000; // 5 seconds

	get states() {
		return this.cache || [];
	}

	get isLoading() {
		return this.loading;
	}

	get isCached() {
		return this.cache !== null;
	}

	async load(force = false) {
		// Return cached data if available and not expired
		const now = Date.now();
		if (!force && this.cache && (now - this.lastFetch) < this.cacheDuration) {
			return this.cache;
		}

		this.loading = true;
		try {
			const states = await getAllStates();
			this.cache = states;
			this.lastFetch = now;
			return states;
		} catch (error) {
			console.error('Failed to load history:', error);
			throw error;
		} finally {
			this.loading = false;
		}
	}

	// Optimistic update - update cache immediately, then persist
	updateCache(updater: (states: ChunkingState[]) => ChunkingState[]) {
		if (this.cache) {
			this.cache = updater(this.cache);
		}
	}

	// Invalidate cache to force reload
	invalidate() {
		this.cache = null;
		this.lastFetch = 0;
	}

	// Preload data in background
	async preload() {
		if (!this.cache) {
			await this.load();
		}
	}
}

// Singleton instance
export const historyStore = new HistoryStore();
