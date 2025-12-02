import Dexie, { type EntityTable } from 'dexie';

export interface MarkerPair {
	id: number;
	startMarker: string;
	endMarker: string;
	patternTemplate: string;
	pattern: RegExp | null;
	format: 'double-star' | 'plain' | 'custom';
}

export interface ChunkingState {
	id?: number;
	inputText: string;
	maxCharacters: number;
	markerPairs: Omit<MarkerPair, 'pattern'>[];
	timestamp: number;
	name?: string;
}

export class ChunkingDatabase extends Dexie {
	states!: EntityTable<ChunkingState, 'id'>;

	constructor() {
		super('ChunkingDatabase');
		this.version(1).stores({
			states: '++id, timestamp, name'
		});
	}
}

export const db = new ChunkingDatabase();

// Storage utilities
export async function saveState(
	inputText: string,
	maxCharacters: number,
	markerPairs: MarkerPair[],
	name?: string
): Promise<number> {
	// Convert marker pairs to serializable format (remove RegExp)
	const serializableMarkers = markerPairs.map(p => ({
		id: p.id,
		startMarker: p.startMarker,
		endMarker: p.endMarker,
		patternTemplate: p.patternTemplate,
		format: p.format
	}));

	const id = await db.states.add({
		inputText,
		maxCharacters,
		markerPairs: serializableMarkers,
		timestamp: Date.now(),
		name
	});

	return id;
}

export async function loadState(id: number): Promise<ChunkingState | undefined> {
	return await db.states.get(id);
}

export async function loadLatestState(): Promise<ChunkingState | undefined> {
	const latest = await db.states.orderBy('timestamp').reverse().first();
	return latest;
}

export async function getAllStates(): Promise<ChunkingState[]> {
	return await db.states.orderBy('timestamp').reverse().toArray();
}

export async function deleteState(id: number): Promise<void> {
	await db.states.delete(id);
}

export async function updateStateName(id: number, name: string): Promise<void> {
	await db.states.update(id, { name });
}

export async function clearAllStates(): Promise<void> {
	await db.states.clear();
}

// Auto-save current state (debounced)
let autoSaveTimeout: ReturnType<typeof setTimeout> | null = null;

export function autoSaveState(
	inputText: string,
	maxCharacters: number,
	markerPairs: MarkerPair[],
	delay = 2000
): void {
	if (autoSaveTimeout) {
		clearTimeout(autoSaveTimeout);
	}

	autoSaveTimeout = setTimeout(async () => {
		// Don't save empty states
		if (!inputText.trim() && markerPairs.every(p => !p.patternTemplate.trim())) {
			return;
		}

		await saveState(inputText, maxCharacters, markerPairs, 'Auto-saved');
	}, delay);
}
