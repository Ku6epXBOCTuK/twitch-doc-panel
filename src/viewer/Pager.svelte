<script lang="ts">
	interface Props {
		total: number;
		current: number;
		next: () => void;
		prev: () => void;
		currentTitle: string;
	}

	// TODO: auto change to next doc at progress bar
	// TODO: setup time for progress bar animation
	// TODO: cycle change docs - last + next = first and vice versa
	let { total, current, next, prev, currentTitle }: Props = $props();
</script>

<nav class="pager">
	<button onclick={prev} aria-label="Previous document"> ‹ </button>
	<div class="pager-wrapper">
		<div class="pager-title-row">
			<div class="pager-title">
				{currentTitle}
			</div>
			<div class="pager-counter">
				<div class="pager-counter-current">
					{current + 1}
				</div>
				<div class="pager-counter-divider"></div>
				<div class="pager-counter-total">
					{total}
				</div>
			</div>
		</div>
		<div class="pager-progress"></div>
	</div>
	<button onclick={next} aria-label="Next document"> › </button>
</nav>

<style>
	nav {
		border-top: 1px solid var(--border);
		flex-shrink: 0;
		display: flex;
		height: 24px;
		align-items: center;
		padding: 0;
	}
	.pager-wrapper {
		flex: 1;
		display: flex;
		flex-direction: column;
		height: 100%;
		justify-content: space-between;
		text-align: center;
		font-size: 0.8em;
		color: var(--muted);
		white-space: nowrap;
	}
	.pager-title {
		flex: 1;
		min-width: 0;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.pager-counter {
		display: flex;
		gap: 4px;
		height: 100%;
		background-color: var(--panel);
		border-left: 2px solid var(--border);
	}
	.pager-counter-current,
	.pager-counter-total {
		width: 24px;
	}
	.pager-counter-divider {
		width: 2px;
		height: 100%;
		background: var(--border);
	}
	.pager-title-row {
		display: flex;
		flex: 1;
	}

	.pager-progress {
		height: 3px;
		width: auto;
		background: linear-gradient(
			90deg,
			rgb(66, 125, 138),
			rgb(50, 77, 156),
			rgb(63, 130, 145)
		);
		animation: 10s linear 0s 1 normal running progress;
		transform-origin: 0;
	}
	button {
		color: var(--text);
		border: 0;
		border-radius: 0px;
		background: linear-gradient(
			rgb(63, 130, 145) 0%,
			rgb(44, 88, 108) 42%,
			rgb(50, 77, 156) 100%
		);
		width: 24px;
		height: 24px;
		font-size: 0.9em;
		cursor: pointer;
	}
	button:hover:not(:disabled) {
		filter: brightness(1.2);
	}
	button:disabled {
		opacity: 0.4;
		cursor: default;
	}

	@keyframes progress {
		from {
			transform: scaleX(0);
		}
		to {
			transform: scaleX(1);
		}
	}
</style>
