import 'fake-indexeddb/auto';

// Make sure IndexedDB is available globally
if (!globalThis.indexedDB) {
	throw new Error('IndexedDB setup failed');
}
