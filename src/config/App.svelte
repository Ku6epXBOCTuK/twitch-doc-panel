<script lang="ts">
	import {
		onBroadcasterConfig,
		saveBroadcasterConfig,
	} from "../shared/twitch.ts";
	import { isContentUrl, initialIndexUrl } from "../shared/content.ts";
	import {
		buildConfigRows,
		fetchDocsIndex,
		moveRow,
		toBroadcasterConfig,
	} from "../shared/docs.ts";
	import type { BroadcasterConfig, ConfigRow } from "../shared/types.ts";

	type Status = "idle" | "loading" | "ready" | "error";

	// The config arrives asynchronously — fill the field when it does.
	let savedCfg = $state<Partial<BroadcasterConfig>>({});

	let indexUrl = $state("");
	let list = $state<ConfigRow[]>([]);
	let status = $state<Status>("idle"); // idle | loading | ready | error
	let error = $state("");
	let savedOk = $state(false);

	onBroadcasterConfig((c) => {
		savedCfg = c ?? {};
		if (!indexUrl) {
			const url = initialIndexUrl(c);
			if (url) {
				indexUrl = url;
				load();
			}
		}
	});

	async function load(): Promise<void> {
		savedOk = false;
		error = "";
		const url = indexUrl.trim();
		if (!url) {
			error = "Set the index.json URL";
			return;
		}
		if (!isContentUrl(url)) {
			error = "The URL must be an http(s) URL or a relative path";
			return;
		}
		status = "loading";
		const r = await fetchDocsIndex(url);
		if (!r.ok) {
			error = r.message;
			status = "error";
			return;
		}
		list = buildConfigRows(r.entries, savedCfg);
		status = "ready";
	}

	function move(i: number, dir: number): void {
		list = moveRow(list, i, dir);
	}

	function save(): void {
		savedOk = saveBroadcasterConfig(toBroadcasterConfig(indexUrl.trim(), list));
	}
</script>

<div class="config">
	<h1>Configuration</h1>

	<label class="field">
		<span class="label">index.json URL</span>
		<input
			type="text"
			bind:value={indexUrl}
			placeholder="https://…/index.json"
			onkeydown={(e: KeyboardEvent) => e.key === "Enter" && load()}
		/>
	</label>
	<p class="muted hint">
		An absolute http(s) URL (e.g. GitHub Pages or jsDelivr) or a path next to
		the widget.
	</p>
	<button onclick={load}>Load list</button>

	{#if status === "loading"}
		<p class="muted">Loading…</p>
	{:else if status === "error"}
		<p class="err">{error}</p>
	{:else if status === "ready"}
		{#each list as doc, i (doc.id)}
			<div class="row">
				<span class="title">{doc.title}</span>
				<span class="controls">
					<button title="Move up" onclick={() => move(i, -1)} disabled={i === 0}
						>↑</button
					>
					<button
						title="Move down"
						onclick={() => move(i, 1)}
						disabled={i === list.length - 1}>↓</button
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
			<button onclick={save}>Save</button>
			{#if savedOk}
				<span class="ok">Saved</span>
			{/if}
		</div>
	{:else if error}
		<p class="err">{error}</p>
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
