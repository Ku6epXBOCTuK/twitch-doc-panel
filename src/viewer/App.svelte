<script lang="ts">
	import { ThemeState } from "../shared/theme-state.svelte.ts";
	import { THEME_VARIANT } from "../shared/types.ts";
	import DocViewer from "./DocViewer.svelte";
	import Pager from "./Pager.svelte";
	import StatusMessage from "./StatusMessage.svelte";
	import { VIEWER_STATUS, ViewerState } from "./viewer-state.svelte.ts";

	const viewer = new ViewerState();
	const theme = new ThemeState();

	$effect(() => {
		let currentTheme = theme.theme;
		if (currentTheme === THEME_VARIANT.DARK) {
			document.documentElement.setAttribute("data-theme", THEME_VARIANT.DARK);
		} else {
			document.documentElement.setAttribute("data-theme", THEME_VARIANT.LIGHT);
		}
	});
</script>

<div class="panel">
	{#if viewer.status === VIEWER_STATUS.READY}
		<DocViewer
			banner={viewer.currentDoc?.banner ?? null}
			title={viewer.currentDoc?.title ?? ""}
			error={viewer.docError}
			doc={viewer.doc}
		/>
		<Pager
			total={viewer.docs.length}
			current={viewer.current}
			currentTitle={viewer.currentDoc?.title ?? ""}
			next={viewer.next}
			prev={viewer.prev}
		/>
	{:else}
		<StatusMessage
			status={viewer.status}
			detail={viewer.loadError}
			onRetry={viewer.retry}
		/>
	{/if}
</div>

<style>
	.panel {
		height: 100%;
		display: flex;
		flex-direction: column;
		box-sizing: border-box;
		padding: 0;
		color: var(--text);
	}
</style>
