<script lang="ts">
	interface Props {
		indexUrl: string;
		load: () => void;
	}

	let { indexUrl = $bindable(), load }: Props = $props();
</script>

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
	An absolute http(s) URL (e.g. GitHub Pages or jsDelivr) or a path next to the
	widget.
</p>
<button onclick={load}>Load list</button>

<style>
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
</style>
