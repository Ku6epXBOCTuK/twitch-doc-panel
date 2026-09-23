<script lang="ts">
	import { untrack } from "svelte";

	interface Props {
		duration: number;
	}

	let { duration = $bindable(10) }: Props = $props();

	let toggle = $state(true);

	$effect(() => {
		if (toggle) {
			untrack(() => {
				duration = 10;
			});
		} else {
			untrack(() => {
				duration = 0;
			});
		}
	});
</script>

<div class="container">
	<label class="field">
		<input type="checkbox" bind:checked={toggle} />
		Auto change to next document
	</label>
	<label class="field">
		<input type="number" bind:value={duration} />
		Duration in seconds
	</label>
</div>
<p class="muted hint"></p>

<style>
	.container {
		display: flex;
		width: 100%;
		align-items: center;
		justify-content: space-between;
	}
	.field {
		display: block;
		margin: 10px 0 4px;
	}
	label {
		display: flex;
		font-size: 0.85em;
		color: #adadb8;
		margin-bottom: 4px;
	}
	input[type="number"] {
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
</style>
