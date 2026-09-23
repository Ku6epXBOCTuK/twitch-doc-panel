<script lang="ts">
	import { DIRECTION } from "../shared/docs.ts";
	import { ConfigState, STATUS } from "./config-state.svelte.ts";
	import DocRow from "./DocRow.svelte";
	import DurationField from "./DurationField.svelte";
	import IndexUrlField from "./IndexUrlField.svelte";
	import SaveBar from "./SaveBar.svelte";

	const state = new ConfigState();
</script>

<div class="config">
	<h1>Configuration</h1>

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
		<SaveBar save={() => state.save()} savedOk={state.savedOk} />
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
		color: #efeff1;
		background: #0e0e10;
		min-height: 100vh;
		box-sizing: border-box;
		padding: 16px;
		max-width: 640px;
	}
	h1 {
		font-size: 1.2em;
	}
	.muted {
		color: #adadb8;
	}
	.err {
		color: #ff8a8a;
	}
</style>
