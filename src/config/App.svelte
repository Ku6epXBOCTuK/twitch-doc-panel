<script lang="ts">
	import { ConfigState, STATUS } from "./config-state.svelte.ts";

	const state = new ConfigState();
</script>

<div class="config">
	<h1>Configuration</h1>

	<label class="field">
		<span class="label">index.json URL</span>
		<input
			type="text"
			bind:value={state.indexUrl}
			placeholder="https://…/index.json"
			onkeydown={(e: KeyboardEvent) => e.key === "Enter" && state.load()}
		/>
	</label>
	<p class="muted hint">
		An absolute http(s) URL (e.g. GitHub Pages or jsDelivr) or a path next to
		the widget.
	</p>
	<button onclick={() => state.load()}>Load list</button>

	{#if state.status === STATUS.LOADING}
		<p class="muted">Loading…</p>
	{:else if state.status === STATUS.ERROR}
		<p class="err">{state.error}</p>
	{:else if state.status === STATUS.READY}
		{#each state.list as doc, i (doc.id)}
			<div class="row">
				<span class="title">{doc.title}</span>
				<span class="controls">
					<button
						title="Move up"
						onclick={() => state.move(i, -1)}
						disabled={i === 0}>↑</button
					>
					<button
						title="Move down"
						onclick={() => state.move(i, 1)}
						disabled={i === state.list.length - 1}>↓</button
					>
					<label>
						<input type="checkbox" bind:checked={doc.hidden} />
						hide
					</label>
				</span>
			</div>
		{:else}
			<p class="muted">The list is empty: add .md files to the content repo.</p>
		{/each}

		<div class="save">
			<button onclick={() => state.save()}>Save</button>
			{#if state.savedOk}
				<span class="ok">Saved</span>
			{/if}
		</div>
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
	.ok {
		color: #00f593;
	}
	.field {
		display: block;
		margin: 10px 0 4px;
	}
	.label {
		display: block;
		font-size: 0.85em;
		color: #adadb8;
		margin-bottom: 4px;
	}
	input[type="text"] {
		width: 100%;
		box-sizing: border-box;
		background: #1f1f23;
		color: #efeff1;
		border: 1px solid #3a3a3d;
		border-radius: 6px;
		padding: 8px 10px;
		font-size: 0.95em;
	}
	.hint {
		font-size: 0.8em;
		margin: 4px 0 10px;
	}
	button {
		background: #3a3a3d;
		color: #efeff1;
		border: 0;
		border-radius: 6px;
		height: 30px;
		min-width: 28px;
		padding: 0 12px;
		cursor: pointer;
	}
	button:hover {
		filter: brightness(1.2);
	}
	.row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 8px;
		padding: 8px 10px;
		border: 1px solid #3a3a3d;
		border-radius: 6px;
		margin-top: 6px;
	}
	.controls {
		display: flex;
		align-items: center;
		gap: 6px;
		white-space: nowrap;
	}
	.controls label {
		font-size: 0.85em;
		color: #adadb8;
	}
	.save {
		margin-top: 12px;
		display: flex;
		align-items: center;
		gap: 10px;
	}
	.save button {
		min-width: 100px;
		height: 32px;
	}
</style>
