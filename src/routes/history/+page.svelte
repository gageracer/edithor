<script lang="ts">
	import { onMount } from 'svelte';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "$lib/components/ui/card";
	import { Button, buttonVariants } from "$lib/components/ui/button";
	import { Input } from "$lib/components/ui/input";
	import { getAllStates, deleteState, updateStateName, clearAllStates, type ChunkingState } from "$lib/db/storage";
	import { toast } from "svelte-sonner";
	import { goto } from '$app/navigation';
	import * as AlertDialog from "$lib/components/ui/alert-dialog";

	let states = $state<ChunkingState[]>([]);
	let isLoading = $state(true);
	let editingId = $state<number | null>(null);
	let editingName = $state("");
	let showDeleteDialog = $state(false);
	let showClearAllDialog = $state(false);
	let deleteTargetId = $state<number | null>(null);

	onMount(async () => {
		await loadStates();
	});

	async function loadStates() {
		try {
			isLoading = true;
			states = await getAllStates();
		} catch (error) {
			toast.error("Failed to load history", { duration: 5000 });
		} finally {
			isLoading = false;
		}
	}

	function openDeleteDialog(id: number) {
		deleteTargetId = id;
		showDeleteDialog = true;
	}

	async function confirmDelete() {
		if (deleteTargetId === null) return;

		showDeleteDialog = false;
		try {
			await deleteState(deleteTargetId);
			states = states.filter(s => s.id !== deleteTargetId);
			toast.success("State deleted", { duration: 3000 });
		} catch (error) {
			toast.error("Failed to delete state", { duration: 5000 });
		}
		deleteTargetId = null;
	}

	function openClearAllDialog() {
		showClearAllDialog = true;
	}

	async function confirmClearAll() {
		showClearAllDialog = false;
		try {
			await clearAllStates();
			states = [];
			toast.success("All states cleared", { duration: 3000 });
		} catch (error) {
			toast.error("Failed to clear states", { duration: 5000 });
		}
	}

	function startEditing(state: ChunkingState) {
		if (state.id !== undefined) {
			editingId = state.id;
			editingName = state.name || "";
		}
	}

	async function saveEdit(id: number) {
		try {
			await updateStateName(id, editingName);
			const state = states.find(s => s.id === id);
			if (state) {
				state.name = editingName;
			}
			editingId = null;
			toast.success("Name updated", { duration: 3000 });
		} catch (error) {
			toast.error("Failed to update name", { duration: 5000 });
		}
	}

	function cancelEdit() {
		editingId = null;
		editingName = "";
	}

	function formatDate(timestamp: number): string {
		const date = new Date(timestamp);
		const now = new Date();
		const diff = now.getTime() - timestamp;
		const seconds = Math.floor(diff / 1000);
		const minutes = Math.floor(seconds / 60);
		const hours = Math.floor(minutes / 60);
		const days = Math.floor(hours / 24);

		if (days > 7) {
			return date.toLocaleDateString('en-US', {
				month: 'short',
				day: 'numeric',
				year: 'numeric',
				hour: '2-digit',
				minute: '2-digit'
			});
		} else if (days > 0) {
			return `${days} day${days > 1 ? 's' : ''} ago`;
		} else if (hours > 0) {
			return `${hours} hour${hours > 1 ? 's' : ''} ago`;
		} else if (minutes > 0) {
			return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
		} else {
			return 'Just now';
		}
	}

	function loadState(state: ChunkingState) {
		// Store the state in sessionStorage to pass to main page
		sessionStorage.setItem('loadedState', JSON.stringify(state));
		goto('/');
	}
</script>

<div class="container mx-auto py-8 px-4 max-w-6xl">
	<!-- Header -->
	<div class="mb-8">
		<div class="flex items-center justify-between mb-4">
			<div>
				<h1 class="text-3xl font-bold tracking-tight">Saved States History</h1>
				<p class="text-muted-foreground mt-2">
					All your saved chunking configurations and text, stored locally in your browser
				</p>
			</div>
			<Button onclick={() => goto('/')} variant="outline">
				← Back to Editor
			</Button>
		</div>

		{#if states.length > 0}
			<div class="flex justify-between items-center">
				<p class="text-sm text-muted-foreground">
					{states.length} saved state{states.length !== 1 ? 's' : ''}
				</p>
				<Button onclick={openClearAllDialog} variant="destructive" size="sm">
					🗑️ Clear All
				</Button>
			</div>
		{/if}
	</div>

	<!-- Loading State -->
	{#if isLoading}
		<Card>
			<CardContent class="py-12">
				<div class="text-center text-muted-foreground">
					<div class="animate-spin inline-block w-8 h-8 border-4 border-current border-t-transparent rounded-full mb-4"></div>
					<p>Loading saved states...</p>
				</div>
			</CardContent>
		</Card>
	{:else if states.length === 0}
		<!-- Empty State -->
		<Card>
			<CardContent class="py-12">
				<div class="text-center">
					<div class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
						<span class="text-2xl">📂</span>
					</div>
					<h3 class="text-lg font-semibold mb-2">No saved states yet</h3>
					<p class="text-sm text-muted-foreground max-w-sm mx-auto mb-6">
						Your saved states will appear here. Start by saving a state from the main editor.
					</p>
					<Button onclick={() => goto('/')} variant="default">
						Go to Editor
					</Button>
				</div>
			</CardContent>
		</Card>
	{:else}
		<!-- States List -->
		<div class="space-y-4">
			{#each states as state (state.id)}
				<Card class="hover:shadow-md transition-shadow">
					<CardHeader class="pb-3">
						<div class="flex items-start justify-between">
							<div class="flex-1">
								{#if editingId === state.id}
									<div class="flex gap-2">
										<Input
											bind:value={editingName}
											placeholder="Enter name..."
											class="max-w-xs"
											autofocus
										/>
										<Button onclick={() => saveEdit(state.id!)} size="sm" variant="default">
											Save
										</Button>
										<Button onclick={cancelEdit} size="sm" variant="outline">
											Cancel
										</Button>
									</div>
								{:else}
									<div class="flex items-center gap-2">
										<CardTitle class="text-base">
											{state.name || 'Unnamed State'}
										</CardTitle>
										<Button
											onclick={() => startEditing(state)}
											size="sm"
											variant="ghost"
											class="h-6 w-6 p-0"
										>
											✏️
										</Button>
									</div>
								{/if}
								<CardDescription class="mt-1">
									Saved {formatDate(state.timestamp)}
								</CardDescription>
							</div>

							<div class="flex gap-2">
								<Button
									onclick={() => loadState(state)}
									size="sm"
									variant="default"
								>
									📂 Load
								</Button>
								<Button
									onclick={() => openDeleteDialog(state.id!)}
									size="sm"
									variant="outline"
								>
									🗑️
								</Button>
							</div>
						</div>
					</CardHeader>
					<CardContent>
						<div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
							<div>
								<p class="text-muted-foreground mb-1">Text Preview:</p>
								<p class="font-mono text-xs bg-muted p-2 rounded max-h-20 overflow-hidden">
									{state.inputText.substring(0, 200)}{state.inputText.length > 200 ? '...' : ''}
								</p>
							</div>
							<div class="space-y-2">
								<div>
									<p class="text-muted-foreground">Character Limit:</p>
									<p class="font-semibold">{state.maxCharacters}</p>
								</div>
								<div>
									<p class="text-muted-foreground">Patterns:</p>
									<p class="font-semibold">{state.markerPairs.length} pattern{state.markerPairs.length !== 1 ? 's' : ''}</p>
								</div>
								{#if state.markerPairs.length > 0}
									<div>
										<p class="text-xs text-muted-foreground">First pattern:</p>
										<p class="font-mono text-xs bg-muted px-2 py-1 rounded truncate">
											{state.markerPairs[0].patternTemplate}
										</p>
									</div>
								{/if}
							</div>
						</div>

						<!-- Marker Pairs Details (Expandable) -->
						{#if state.markerPairs.length > 1}
							<details class="mt-4">
								<summary class="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
									View all {state.markerPairs.length} patterns
								</summary>
								<div class="mt-2 space-y-2">
									{#each state.markerPairs as pair, index}
										<div class="text-xs bg-muted p-2 rounded">
											<p class="font-semibold">Pattern {index + 1}:</p>
											<p class="font-mono">{pair.patternTemplate}</p>
											{#if pair.startMarker}
												<p class="text-muted-foreground">Start: {pair.startMarker}</p>
											{/if}
											{#if pair.endMarker}
												<p class="text-muted-foreground">End: {pair.endMarker}</p>
											{/if}
										</div>
									{/each}
								</div>
							</details>
						{/if}
					</CardContent>
				</Card>
			{/each}
		</div>
	{/if}

	<!-- Delete Single State Dialog -->
	<AlertDialog.Root bind:open={showDeleteDialog}>
		<AlertDialog.Content>
			<AlertDialog.Header>
				<AlertDialog.Title>Delete State</AlertDialog.Title>
				<AlertDialog.Description>
					Are you sure you want to delete this state? This action cannot be undone.
				</AlertDialog.Description>
			</AlertDialog.Header>
			<AlertDialog.Footer>
				<AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
				<AlertDialog.Action onclick={confirmDelete}>Delete</AlertDialog.Action>
			</AlertDialog.Footer>
		</AlertDialog.Content>
	</AlertDialog.Root>

	<!-- Clear All States Dialog -->
	<AlertDialog.Root bind:open={showClearAllDialog}>
		<AlertDialog.Content>
			<AlertDialog.Header>
				<AlertDialog.Title>Clear All States</AlertDialog.Title>
				<AlertDialog.Description>
					Are you sure you want to delete ALL saved states? This action cannot be undone and will remove all your saved history.
				</AlertDialog.Description>
			</AlertDialog.Header>
			<AlertDialog.Footer>
				<AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
				<AlertDialog.Action onclick={confirmClearAll}>Delete All</AlertDialog.Action>
			</AlertDialog.Footer>
		</AlertDialog.Content>
	</AlertDialog.Root>
</div>
