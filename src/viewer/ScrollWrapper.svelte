<script lang="ts">
	import type { Snippet } from "svelte";
	import { ScrollThumbState } from "./scroll-thumb-state.svelte";

	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();

	const thumb = new ScrollThumbState();
	// Screenshot script need demoScroll for show scroll thumb
	const demoScroll = new URLSearchParams(globalThis.location?.search ?? "").has(
		"demoScroll",
	);

	let mainEl = $state<HTMLElement | null>(null);
	let contentEl = $state<HTMLElement | null>(null);

	$effect(() => {
		thumb.bind(mainEl);
		const el = mainEl;
		const content = contentEl;
		if (!el || !content) return;
		const resizeObserver = new ResizeObserver(() => {
			thumb.bind(el);
			if (
				demoScroll &&
				el.scrollHeight > el.clientHeight &&
				el.scrollTop < 150
			) {
				el.scrollTop = 200;
			}
		});
		resizeObserver.observe(el);
		resizeObserver.observe(content);
		const demoScrollTimer = demoScroll
			? setInterval(() => el.scrollBy(0, 2), 150)
			: null;
		return () => {
			resizeObserver.disconnect();
			if (demoScrollTimer) clearInterval(demoScrollTimer);
		};
	});
</script>

<div class="scrollwrap">
	<main bind:this={mainEl} onscroll={() => thumb.onScroll()}>
		<div bind:this={contentEl}>
			{@render children()}
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

<style>
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
</style>
