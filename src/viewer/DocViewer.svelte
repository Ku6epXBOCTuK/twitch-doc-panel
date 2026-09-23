<script lang="ts">
	import DocRenderer from "../shared/DocRenderer.svelte";
	import ScrollWrapper from "./ScrollWrapper.svelte";
	import type { LoadedDoc } from "./viewer-state.svelte";

	interface Props {
		banner: string | null;
		title: string;
		error?: string;
		doc: LoadedDoc | null;
	}

	let { banner, title, error, doc }: Props = $props();
</script>

{#if banner}
	<img class="banner" src={banner} alt={title} />
{/if}
<ScrollWrapper>
	{#if !banner}
		<h1 class="title">
			{title}
		</h1>
	{/if}
	{#if error}
		<p class="muted">
			Failed to load the document ({error}).
		</p>
	{:else if doc}
		<DocRenderer nodes={doc.blocks} />
	{:else}
		<p class="muted">Loading…</p>
	{/if}
</ScrollWrapper>

<style>
	.banner {
		width: 100%;
		height: auto;
		display: block;
		flex-shrink: 0;
	}
	.title {
		font-size: 1.1em;
		margin: 0 0 0.4em;
	}
	.muted {
		color: var(--muted);
	}
</style>
