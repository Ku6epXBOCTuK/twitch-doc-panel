<script lang="ts">
	import { VIEWER_STATUS, type ViewerStatus } from "./viewer-state.svelte.ts";

	interface Props {
		status: ViewerStatus;
		detail?: string;
		onRetry?: () => void;
	}

	// Dumb status screen for all non-ready viewer states.
	let { status, detail = "", onRetry }: Props = $props();
</script>

{#if status === VIEWER_STATUS.LOADING}
	<p class="muted center">Loading…</p>
{:else if status === VIEWER_STATUS.NEED_CONFIG}
	<p class="center">No content URL configured.</p>
	<p class="muted center">
		Open the extension config panel and set the index.json URL.
	</p>
{:else if status === VIEWER_STATUS.BAD_URL}
	<p class="center">
		The content URL must be an http(s) URL or a relative path.
	</p>
	<p class="muted center">{detail}</p>
{:else if status === VIEWER_STATUS.ERROR}
	<p class="center">Failed to load documents.</p>
	<p class="muted center">{detail}</p>
	<p class="center">
		<button onclick={() => onRetry?.()}>Retry</button>
	</p>
{:else if status === VIEWER_STATUS.EMPTY}
	<p class="muted center">No documents yet.</p>
{/if}

<style>
	.muted {
		color: var(--muted);
	}
	.center {
		text-align: center;
	}
	button {
		background: var(--border);
		color: var(--text);
		border: 0;
		border-radius: 5px;
		min-width: 24px;
		height: 22px;
		padding: 0 10px;
		font-size: 0.9em;
		cursor: pointer;
	}
	button:hover:not(:disabled) {
		filter: brightness(1.2);
	}
</style>
