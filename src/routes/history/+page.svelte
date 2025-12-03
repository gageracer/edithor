<script lang="ts">
	import { fly, fade } from 'svelte/transition';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "$lib/components/ui/card";
	import { Button } from "$lib/components/ui/button";
	import { Input } from "$lib/components/ui/input";
	import { Badge } from "$lib/components/ui/badge";
	import { Separator } from "$lib/components/ui/separator";
	import { ScrollArea } from "$lib/components/ui/scroll-area";
	import { SwipeIndicator } from "$lib/components/ui/swipe-indicator";
	import { Spinner } from "$lib/components/ui/spinner";
	import { deleteState, updateStateName, clearAllStates, type ChunkingState } from "$lib/db/storage";
	import { historyStore } from "$lib/stores/historyStore.svelte";
	import { toast } from "svelte-sonner";
	import { goto } from '$app/navigation';
	import * as AlertDialog from "$lib/components/ui/alert-dialog";
	import { resolve } from '$app/paths';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// Create a promise that resolves with initial data
	let statesPromise = $state(Promise.resolve(data.states));
	let editingId = $state<number | null>(null);
	let editingName = $state("");
	let showDeleteDialog = $state(false);
	let showClearAllDialog = $state(false);
	let deleteTargetId = $state<number | null>(null);
	let swipeStartX = $state(0);
	let swipeCurrentX = $state(0);
	let isSwiping = $state(false);
	let swipeThreshold = 100;
	let showSwipeIndicator = $state(false);

	// Refresh states function
	function refreshStates() {
		historyStore.invalidate();
		statesPromise = historyStore.load();
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
			refreshStates();
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
			refreshStates();
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

	async function saveEdit(id: number, currentStates: ChunkingState[]) {
		try {
			await updateStateName(id, editingName);
			const state = currentStates.find(s => s.id === id);
			if (state) {
				state.name = editingName;
			}
			editingId = null;
			toast.success("Name updated", { duration: 3000 });
			refreshStates();
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
		sessionStorage.setItem('loadedState', JSON.stringify(state));
		goto(resolve('/chunking'));
	}

	async function copyToClipboard(text: string, label: string) {
		try {
			await navigator.clipboard.writeText(text);
			toast.success(`${label} copied to clipboard!`, { duration: 2000 });
		} catch (error) {
			toast.error("Failed to copy", { duration: 3000 });
		}
	}

	function copyStateSettings(state: ChunkingState) {
		const settings = {
			maxCharacters: state.maxCharacters,
			markerPairs: state.markerPairs
		};
		copyToClipboard(JSON.stringify(settings, null, 2), "Settings");
	}

	// Swipe gesture handlers
	function handleTouchStart(e: TouchEvent) {
		swipeStartX = e.touches[0].clientX;
		isSwiping = true;
	}

	function handleTouchMove(e: TouchEvent) {
		if (!isSwiping) return;
		swipeCurrentX = e.touches[0].clientX;

		const swipeDistance = swipeCurrentX - swipeStartX;
		showSwipeIndicator = swipeDistance > 50;
	}

	function handleTouchEnd() {
		if (!isSwiping) return;

		const swipeDistance = swipeCurrentX - swipeStartX;

		if (Math.abs(swipeDistance) > swipeThreshold) {
			if (swipeDistance > 0) {
				// Swipe right - go back to editor
				goto(resolve('/chunking'));
			}
		}

		isSwiping = false;
		swipeStartX = 0;
		swipeCurrentX = 0;
		showSwipeIndicator = false;
	}
</script>

<svelte:head>
	<title>History - Edithor</title>
	<meta name="description" content="View and manage your saved chunking configurations" />
	<meta name="view-transition" content="same-origin" />
</svelte:head>

<div
	class="min-h-screen bg-gradient-to-br from-background via-background to-muted/20"
	ontouchstart={handleTouchStart}
	ontouchmove={handleTouchMove}
	ontouchend={handleTouchEnd}
>
	<div class="container mx-auto py-8 px-4 max-w-7xl" in:fly={{ x: 20, duration: 300, delay: 100 }}>
		{#await statesPromise}
			<!-- Loading State with Centered Spinner -->
			<div class="flex flex-col items-center justify-center min-h-[60vh]" in:fade={{ duration: 200 }}>
				<div class="flex flex-col items-center gap-6">
					<div class="relative">
						<div class="absolute inset-0 animate-ping opacity-20">
							<div class="w-16 h-16 bg-primary rounded-full"></div>
						</div>
						<div class="relative flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full">
							<Spinner class="w-8 h-8 text-primary" />
						</div>
					</div>
					<div class="text-center space-y-2">
						<h3 class="text-lg font-semibold">Loading History</h3>
						<p class="text-sm text-muted-foreground">Fetching your saved states...</p>
					</div>
				</div>
			</div>
		{:then states}
			<!-- Header with glassmorphism effect -->
			<div class="mb-8 backdrop-blur-sm bg-card/50 border rounded-xl p-6 shadow-lg">
				<div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
					<div class="flex-1">
						<div class="flex items-center gap-3 mb-2">
							<div class="p-2 bg-primary/10 rounded-lg">
								<svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
								</svg>
							</div>
							<h1 class="text-4xl font-bold tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
								Saved States History
							</h1>
						</div>
						<p class="text-muted-foreground text-sm sm:text-base">
							All your saved chunking configurations and text, stored locally in your browser
						</p>
					</div>
					<a href={resolve('/chunking')} data-sveltekit-preload-data="hover">
						<Button variant="outline" size="lg" class="gap-2 shadow-sm">
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
						</svg>
							Back to Editor
						</Button>
					</a>
				</div>

				{#if states.length > 0}
					<Separator class="my-4" />
					<div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
						<div class="flex items-center gap-3">
							<Badge variant="secondary" class="text-sm px-3 py-1">
								{states.length} saved state{states.length !== 1 ? 's' : ''}
							</Badge>
							<div class="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground">
								<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
								</svg>
								Swipe right to go back
							</div>
						</div>
						<Button onclick={openClearAllDialog} variant="destructive" size="sm" class="gap-2">
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
							</svg>
							Clear All
						</Button>
					</div>
				{/if}

				<!-- Swipe Indicator -->
				<SwipeIndicator show={showSwipeIndicator} direction="left" label="Back to Editor" />
			</div>

			{#if states.length === 0}
				<!-- Empty State -->
				<div in:fly={{ y: 20, duration: 300 }}>
					<Card class="border-2 shadow-xl bg-gradient-to-br from-card to-muted/20">
						<CardContent class="py-20">
							<div class="text-center max-w-md mx-auto">
								<div class="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/5 mb-6 shadow-lg">
									<svg class="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
									</svg>
								</div>
								<h3 class="text-2xl font-bold mb-3">No saved states yet</h3>
								<p class="text-muted-foreground mb-8 leading-relaxed">
									Your saved states will appear here. Start by saving a state from the main editor to quickly access your chunking configurations later.
								</p>
								<a href={resolve('/chunking')} data-sveltekit-preload-data="hover">
									<Button size="lg" class="gap-2 shadow-lg">
									<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
									</svg>
										Go to Editor
									</Button>
								</a>
							</div>
						</CardContent>
					</Card>
				</div>
			{:else}
				<!-- States Grid -->
				<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
					{#each states as state, index (state.id)}
						<div in:fly={{ y: 20, duration: 300, delay: index * 50 }}>
							<Card class="group hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 border-2 hover:border-primary/50 bg-gradient-to-br from-card to-card/80 overflow-hidden">
								<!-- Accent bar -->
								<div class="h-1 bg-gradient-to-r from-primary via-primary/50 to-transparent"></div>

								<CardHeader class="pb-4">
									<div class="flex items-start justify-between gap-4">
										<div class="flex-1 min-w-0">
											{#if editingId === state.id}
												<div class="flex gap-2">
													<Input
														bind:value={editingName}
														placeholder="Enter name..."
														class="flex-1"
														autofocus
													/>
													<Button onclick={() => saveEdit(state.id!, states)} size="sm" variant="default">
														Save
													</Button>
													<Button onclick={cancelEdit} size="sm" variant="outline">
														Cancel
													</Button>
												</div>
											{:else}
												<div class="space-y-2">
													<div class="flex items-center gap-2">
														<CardTitle class="text-xl truncate">
															{state.name || 'Unnamed State'}
														</CardTitle>
														<Button
															onclick={() => startEditing(state)}
															size="sm"
															variant="ghost"
															class="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
														>
															<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
															</svg>
														</Button>
													</div>
													<div class="flex items-center gap-2 flex-wrap">
														<CardDescription class="flex items-center gap-1.5">
															<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
															</svg>
															{formatDate(state.timestamp)}
														</CardDescription>
														<Badge variant="outline" class="text-xs">
															{state.maxCharacters} chars
														</Badge>
														<Badge variant="outline" class="text-xs">
															{state.markerPairs.length} pattern{state.markerPairs.length !== 1 ? 's' : ''}
														</Badge>
													</div>
												</div>
											{/if}
										</div>

										<div class="flex gap-2 flex-shrink-0">
											<Button
												onclick={() => copyStateSettings(state)}
												size="sm"
												variant="outline"
												class="h-9 w-9 p-0"
												title="Copy settings"
											>
												<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
												</svg>
											</Button>
											<Button
												onclick={() => loadState(state)}
												size="sm"
												variant="default"
												class="gap-2 shadow-md"
											>
												<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
												</svg>
												Load
											</Button>
											<Button
												onclick={() => openDeleteDialog(state.id!)}
												size="sm"
												variant="outline"
												class="h-9 w-9 p-0 hover:bg-destructive hover:text-destructive-foreground"
											>
												<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
												</svg>
											</Button>
										</div>
									</div>
								</CardHeader>

								<CardContent class="space-y-4">
									<!-- Text Preview -->
									<div class="space-y-2">
										<div class="flex items-center justify-between">
											<p class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Text Preview</p>
											<Button
												onclick={() => copyToClipboard(state.inputText, "Text")}
												size="sm"
												variant="ghost"
												class="h-6 text-xs gap-1.5"
											>
												<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
												</svg>
												Copy
											</Button>
										</div>
										<ScrollArea class="h-24 rounded-lg border bg-muted/30 p-3">
											<p class="font-mono text-xs leading-relaxed whitespace-pre-wrap">
												{state.inputText}
											</p>
										</ScrollArea>
									</div>

									<Separator />

									<!-- Patterns List -->
									{#if state.markerPairs.length > 0}
										<div class="space-y-2">
											<div class="flex items-center justify-between">
												<p class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Patterns</p>
											</div>
											<div class="space-y-2">
												{#each state.markerPairs.slice(0, 2) as pair, pairIndex}
													<div class="relative group/pattern bg-muted/30 border rounded-lg p-3 hover:bg-muted/50 transition-colors">
														<div class="flex items-start justify-between gap-2">
															<div class="flex-1 space-y-1.5 min-w-0">
																<div class="flex items-center gap-2">
																	<Badge variant="secondary" class="text-xs">Pattern {pairIndex + 1}</Badge>
																</div>
																<p class="font-mono text-xs break-all">{pair.patternTemplate}</p>
																{#if pair.startMarker || pair.endMarker}
																	<div class="text-xs text-muted-foreground space-y-0.5">
																		{#if pair.startMarker}
																			<p class="truncate">Start: {pair.startMarker}</p>
																		{/if}
																		{#if pair.endMarker}
																			<p class="truncate">End: {pair.endMarker}</p>
																		{/if}
																	</div>
																{/if}
															</div>
															<Button
																onclick={() => copyToClipboard(pair.patternTemplate, `Pattern ${pairIndex + 1}`)}
																size="sm"
																variant="ghost"
																class="h-7 w-7 p-0 opacity-0 group-hover/pattern:opacity-100 transition-opacity flex-shrink-0"
															>
																<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																	<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
																</svg>
															</Button>
														</div>
													</div>
												{/each}

												{#if state.markerPairs.length > 2}
													<details class="group/details">
														<summary class="cursor-pointer text-xs text-primary hover:text-primary/80 font-medium flex items-center gap-2 p-2 rounded hover:bg-muted/50 transition-colors">
															<svg class="w-3 h-3 transition-transform group-open/details:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
															</svg>
															View {state.markerPairs.length - 2} more pattern{state.markerPairs.length - 2 !== 1 ? 's' : ''}
														</summary>
														<div class="mt-2 space-y-2">
															{#each state.markerPairs.slice(2) as pair, pairIndex}
																<div class="relative group/pattern bg-muted/30 border rounded-lg p-3 hover:bg-muted/50 transition-colors">
																	<div class="flex items-start justify-between gap-2">
																		<div class="flex-1 space-y-1.5 min-w-0">
																			<div class="flex items-center gap-2">
																				<Badge variant="secondary" class="text-xs">Pattern {pairIndex + 3}</Badge>
																			</div>
																			<p class="font-mono text-xs break-all">{pair.patternTemplate}</p>
																			{#if pair.startMarker || pair.endMarker}
																				<div class="text-xs text-muted-foreground space-y-0.5">
																					{#if pair.startMarker}
																						<p class="truncate">Start: {pair.startMarker}</p>
																					{/if}
																					{#if pair.endMarker}
																						<p class="truncate">End: {pair.endMarker}</p>
																					{/if}
																				</div>
																			{/if}
																		</div>
																		<Button
																			onclick={() => copyToClipboard(pair.patternTemplate, `Pattern ${pairIndex + 3}`)}
																			size="sm"
																			variant="ghost"
																			class="h-7 w-7 p-0 opacity-0 group-hover/pattern:opacity-100 transition-opacity flex-shrink-0"
																		>
																			<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
																			</svg>
																		</Button>
																	</div>
																</div>
															{/each}
														</div>
													</details>
												{/if}
											</div>
										</div>
									{/if}
								</CardContent>
							</Card>
						</div>
					{/each}
				</div>
			{/if}
		{:catch error}
			<!-- Error State -->
			<div in:fade={{ duration: 200 }}>
				<Card class="border-2 border-destructive/50 shadow-xl">
					<CardContent class="py-20">
						<div class="text-center max-w-md mx-auto">
							<div class="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10 mb-6">
								<svg class="w-10 h-10 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
								</svg>
							</div>
							<h3 class="text-2xl font-bold mb-3">Failed to load history</h3>
							<p class="text-muted-foreground mb-8">
								{error?.message || 'An unexpected error occurred'}
							</p>
							<Button onclick={() => refreshStates()} size="lg" class="gap-2">
								<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
								</svg>
								Try Again
							</Button>
						</div>
					</CardContent>
				</Card>
			</div>
		{/await}

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
</div>

<style>
	:global(html) {
		view-transition-name: root;
	}
</style>
