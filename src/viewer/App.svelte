<script lang="ts">
	import DocRenderer from "../shared/DocRenderer.svelte";
	import { ThemeState } from "../shared/theme-state.svelte.ts";
	import { ScrollThumbState } from "./scroll-thumb-state.svelte.ts";
	import { VIEWER_STATUS, ViewerState } from "./viewer-state.svelte.ts";

	const viewer = new ViewerState();
	const theme = new ThemeState();
	const thumb = new ScrollThumbState();

	let mainEl = $state<HTMLElement | null>(null);
	let contentEl = $state<HTMLElement | null>(null);

	// Recalculate the thumb on size changes (document switch, image loading)
	// and demo-scroll for screenshots (?demoScroll=1).
	const demoScroll = new URLSearchParams(globalThis.location?.search ?? "").has(
		"demoScroll",
	);
	$effect(() => {
		thumb.bind(mainEl);
		const el = mainEl;
		const content = contentEl;
		if (!el || !content) return;
		const ro = new ResizeObserver(() => {
			thumb.bind(el);
			// Demo frame for screenshots: scroll the content so the thumb and
			// shadows are in frame.
			if (
				demoScroll &&
				el.scrollHeight > el.clientHeight &&
				el.scrollTop < 150
			) {
				el.scrollTop = 200;
			}
		});
		ro.observe(el);
		ro.observe(content);
		const timer = demoScroll ? setInterval(() => el.scrollBy(0, 2), 150) : null;
		return () => {
			ro.disconnect();
			if (timer) clearInterval(timer);
		};
	});
</script>

<div class="panel" data-theme={theme.theme}>
	{#if viewer.status === VIEWER_STATUS.LOADING}
		<p class="muted center">Loading…</p>
	{:else if viewer.status === VIEWER_STATUS.NEED_CONFIG}
		<p class="center">No content URL configured.</p>
		<p class="muted center">
			Open the extension config panel and set the index.json URL.
		</p>
	{:else if viewer.status === VIEWER_STATUS.BAD_URL}
		<p class="center">
			The content URL must be an http(s) URL or a relative path.
		</p>
		<p class="muted center">{viewer.loadError}</p>
	{:else if viewer.status === VIEWER_STATUS.ERROR}
		<p class="center">Failed to load documents.</p>
		<p class="muted center">{viewer.loadError}</p>
		<p class="center">
			<button onclick={viewer.retry}>Retry</button>
		</p>
	{:else if viewer.status === VIEWER_STATUS.EMPTY}
		<p class="muted center">No documents yet.</p>
	{:else}
		{#if viewer.currentDoc?.banner}
			<img
				class="banner"
				src={viewer.currentDoc.banner}
				alt={viewer.currentDoc.title}
			/>
		{/if}
		<div class="scrollwrap">
			<main bind:this={mainEl} onscroll={() => thumb.onScroll()}>
				<div bind:this={contentEl}>
					{#if !viewer.currentDoc?.banner}
						<h1 class="title">
							{viewer.doc?.title ?? viewer.currentDoc?.title}
						</h1>
					{/if}
					{#if viewer.docError}
						<p class="muted">
							Failed to load the document ({viewer.docError}).
						</p>
					{:else if viewer.doc}
						<DocRenderer nodes={viewer.doc.blocks} />
					{:else}
						<p class="muted">Loading…</p>
					{/if}
				</div>
			</main>
			{#if thumb.height > 0}
				<div
					class="sb-thumb"
					style="top: {thumb.top}px; height: {thumb.height}px; opacity: {thumb.visible
						? 1
						: 0}"
				></div>
			{/if}
		</div>
		{#if viewer.docs.length > 1}
			<nav>
				<button
					onclick={viewer.prev}
					disabled={viewer.current === 0}
					aria-label="Previous document">‹</button
				>
				<span class="doc-title" title={viewer.currentDoc?.title}
					>{viewer.currentDoc?.title}</span
				>
				<button
					onclick={viewer.next}
					disabled={viewer.current === viewer.docs.length - 1}
					aria-label="Next document">›</button
				>
			</nav>
		{/if}
	{/if}
</div>

<style>
	.panel {
		height: 100%;
		display: flex;
		flex-direction: column;
		box-sizing: border-box;
		padding: 0;
		gap: 8px;
		/* Theme comes from Twitch (onContext) */
		--text: #efeff1;
		--muted: #adadb8;
		--border: #3a3a3d;
		--link: #bf94ff;
		--surface: #17171a;
		--surface-0: rgba(23, 23, 26, 0);
		--thumb: rgba(173, 173, 184, 0.55);
		color: var(--text);
	}
	.panel[data-theme="light"] {
		--text: #0e0e10;
		--muted: #53535f;
		--border: #dcdde1;
		--link: #6441a5;
		--surface: #f7f7f8;
		--surface-0: rgba(247, 247, 248, 0);
		--thumb: rgba(83, 83, 95, 0.5);
	}
	.banner {
		width: 100%;
		height: auto;
		display: block;
		flex-shrink: 0;
	}
	.scrollwrap {
		position: relative;
		flex: 1;
		display: flex;
		min-height: 0;
	}
	main {
		flex: 1;
		overflow-y: auto;
		min-height: 0;
		padding: 10px 12px;
		border-radius: 8px;
		/* The native scrollbar is fully hidden — replaced by the overlay thumb .sb-thumb */
		scrollbar-width: none;
		-ms-overflow-style: none;
		overscroll-behavior: contain;
		/* Gradient shadows: at the edge the content dissolves into the backdrop
       color (on the dark theme a black shadow is invisible, but text fading
       is). Local layers (local) mask the fading right at the edge. */
		background:
			linear-gradient(var(--surface) 30%, var(--surface-0)),
			linear-gradient(var(--surface-0), var(--surface) 70%) 0 100%,
			linear-gradient(var(--surface), var(--surface-0)),
			linear-gradient(var(--surface-0), var(--surface)) 0 100%;
		background-repeat: no-repeat;
		background-size:
			100% 40px,
			100% 40px,
			100% 26px,
			100% 26px;
		background-attachment: local, local, scroll, scroll;
	}
	main::-webkit-scrollbar {
		display: none;
	}
	.sb-thumb {
		position: absolute;
		right: 3px;
		width: 4px;
		border-radius: 2px;
		background: var(--thumb);
		pointer-events: none;
		transition: opacity 0.25s;
	}
	.title {
		font-size: 1.1em;
		margin: 0 0 0.4em;
	}
	.muted {
		color: var(--muted);
	}
	.center {
		text-align: center;
	}
	nav {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 4px 2px 0;
	}
	.doc-title {
		flex: 1;
		min-width: 0;
		text-align: center;
		font-size: 0.8em;
		color: var(--muted);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	button {
		background: var(--border);
		color: var(--text);
		border: 0;
		border-radius: 5px;
		min-width: 24px;
		height: 22px;
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
</style>
