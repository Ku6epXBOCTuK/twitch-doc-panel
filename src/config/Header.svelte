<script lang="ts">
	import Save from "~icons/lucide/save";

	interface Props {
		savedOk: boolean;
		save: () => void;
	}

	let { save, savedOk }: Props = $props();
</script>

<header>
	<h1>Configuration</h1>

	<div class="save">
		{#if savedOk}
			<span class="ok">Saved</span>
		{/if}
		<button onclick={() => save()}>
			<Save />
			<span class="button-label"> Save </span>
		</button>
	</div>
</header>

<style>
	header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding-bottom: 8px;
	}
	h1 {
		font-size: 24px;
	}
	.ok {
		color: var(--success);
	}
	button {
		background: var(--accent-1);
		color: #fff;
		display: flex;
		align-items: center;
		gap: 8px;
		justify-content: center;
		border: 0;
		border-radius: 6px;
		padding: 0 12px;
		cursor: pointer;
		transition: 0.3s;
		min-width: 100px;
		height: 32px;
	}
	button:hover {
		filter: brightness(1.2);
	}
	.button-label {
		padding-top: 2px;
	}
	.save {
		display: flex;
		align-items: center;
		gap: 12px;
	}
</style>
