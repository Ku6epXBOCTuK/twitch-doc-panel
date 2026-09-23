<script lang="ts">
	import ChevronDown from "~icons/lucide/chevron-down";
	import ChevronUp from "~icons/lucide/chevron-up";

	interface Props {
		title: string;
		hidden: boolean;
		isFirst: boolean;
		isLast: boolean;
		moveUp: () => void;
		moveDown: () => void;
	}

	let {
		title,
		hidden = $bindable(),
		isFirst,
		isLast,
		moveUp,
		moveDown,
	}: Props = $props();
</script>

<div class="row">
	<span class="title">{title}</span>
	<span class="controls">
		<button title="Move up" onclick={moveUp} disabled={isFirst}>
			<ChevronUp />
		</button>
		<button title="Move down" onclick={moveDown} disabled={isLast}>
			<ChevronDown />
		</button>
		<label>
			<input type="checkbox" bind:checked={hidden} />
			hide
		</label>
	</span>
</div>

<style>
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
	button:disabled {
		filter: brightness(0.5);
	}
</style>
