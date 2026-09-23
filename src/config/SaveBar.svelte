<script lang="ts">
	interface Props {
		savedOk: boolean;
		save: () => void;
	}

	let { save, savedOk }: Props = $props();
</script>

<div class="save">
	<button onclick={() => save()}>Save</button>
	{#if savedOk}
		<span class="ok">Saved</span>
	{/if}
</div>

<style>
	.ok {
		color: var(--success);
	}
	button {
		background: var(--button);
		color: var(--text);
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
