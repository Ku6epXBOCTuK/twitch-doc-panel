<script lang="ts">
	import { DIRECTION } from "../shared/docs.ts";
	import { ThemeState } from "../shared/theme-state.svelte.ts";
	import { ConfigState, STATUS } from "./config-state.svelte.ts";
	import DocRow from "./DocRow.svelte";
	import DurationField from "./DurationField.svelte";
	import { default as Header } from "./Header.svelte";
	import IndexUrlField from "./IndexUrlField.svelte";

	const state = new ConfigState();
	new ThemeState();
</script>

<div class="config">
	<Header save={() => state.save()} savedOk={state.savedOk} />
	<IndexUrlField bind:indexUrl={state.indexUrl} load={state.load} />
	<DurationField bind:duration={state.duration} />

	{#if state.status === STATUS.LOADING}
		<p class="muted">Loading…</p>
	{:else if state.status === STATUS.ERROR}
		<p class="err">{state.error}</p>
	{:else if state.status === STATUS.READY}
		{#each state.list as doc, idx (doc.id)}
			<DocRow
				title={doc.title}
				bind:hidden={doc.hidden}
				isFirst={idx === 0}
				isLast={idx === state.list.length - 1}
				moveUp={() => state.move(idx, DIRECTION.UP)}
				moveDown={() => state.move(idx, DIRECTION.DOWN)}
			/>
		{:else}
			<p class="muted">The list is empty: add .md files to the content repo.</p>
		{/each}
	{:else if state.error}
		<p class="err">{state.error}</p>
	{/if}
</div>

<style>
	.config {
		font-family:
			system-ui,
			-apple-system,
			"Segoe UI",
			Roboto,
			sans-serif;
		color: var(--text);
		background: var(--bg);
		min-height: 100vh;
		box-sizing: border-box;
		padding: 16px;
		max-width: 640px;
	}
	.muted {
		color: var(--muted);
	}
	.err {
		color: var(--error);
	}
</style>
