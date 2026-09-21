<script>
	// Рекурсивный рендерер мини-AST. Никакого {@html}: строка = текст
	// (эскейпит Svelte), узел = [tag, ...rest]. Неизвестное — пропускаем с warning.
	// Картинки — только https (http — только localhost: дев-режим и скриншоты).

	let { nodes = [] } = $props();

	const LINK_RE = /^https?:\/\//i;

	function safeImg(src) {
		if (typeof src !== "string") return null;
		try {
			const u = new URL(src);
			// http разрешён только для localhost (дев-режим и скриншоты)
			if (
				u.protocol === "https:" ||
				u.hostname === "localhost" ||
				u.hostname === "127.0.0.1"
			) {
				return u.href;
			}
			return null;
		} catch {
			return null;
		}
	}

	function safeLink(href) {
		return typeof href === "string" && LINK_RE.test(href) ? href : null;
	}
</script>

{#snippet children(ns)}
	{#each ns as c}{@render node(c)}{/each}
{/snippet}

{#snippet node(n)}
	{#if typeof n === "string"}
		{n}
	{:else if Array.isArray(n)}
		{@const [tag, ...rest] = n}
		{#if tag === "p"}
			<p>{@render children(rest)}</p>
		{:else if tag === "br"}
			<br />
		{:else if tag === "hr"}
			<hr />
		{:else if tag === "em"}
			<em>{@render children(rest)}</em>
		{:else if tag === "strong"}
			<strong>{@render children(rest)}</strong>
		{:else if tag === "del"}
			<del>{@render children(rest)}</del>
		{:else if tag === "code"}
			<code>{rest[0]}</code>
		{:else if tag === "a"}
			{@const href = safeLink(rest[0])}
			{#if href}
				<a {href} target="_blank" rel="noopener noreferrer"
					>{@render children(rest.slice(1))}</a
				>
			{:else}
				{@render children(rest.slice(1))}
			{/if}
		{:else if tag === "img"}
			{@const src = safeImg(rest[0])}
			{#if src}
				<img {src} alt={rest[1] ?? ""} loading="lazy" />
			{/if}
		{:else if /^h[1-6]$/.test(tag)}
			<svelte:element this={tag}>{@render children(rest)}</svelte:element>
		{:else if tag === "ul" || tag === "ol"}
			<svelte:element this={tag}>
				{#each rest[0] ?? [] as item}{@render node(item)}{/each}
			</svelte:element>
		{:else if tag === "li"}
			<li>{@render children(rest)}</li>
		{:else if tag === "blockquote"}
			<blockquote>
				{#each rest as b}{@render node(b)}{/each}
			</blockquote>
		{:else}
			{@const _warn = console.warn("DocRenderer: неизвестный узел", tag)}
		{/if}
	{/if}
{/snippet}

{#each nodes as n}{@render node(n)}{/each}

<style>
	p {
		margin: 0.35em 0;
	}
	h1,
	h2,
	h3,
	h4,
	h5,
	h6 {
		margin: 0.8em 0 0.3em;
		line-height: 1.25;
	}
	h1 {
		font-size: 1.15em;
	}
	h2 {
		font-size: 1.08em;
	}
	h3,
	h4,
	h5,
	h6 {
		font-size: 1em;
	}
	ul,
	ol {
		margin: 0.35em 0;
		padding-left: 1.4em;
	}
	li {
		margin: 0.15em 0;
	}
	blockquote {
		margin: 0.5em 0;
		padding: 0.1em 0.8em;
		border-left: 3px solid var(--muted);
		color: var(--muted);
	}
	hr {
		border: 0;
		border-top: 1px solid var(--border);
		margin: 0.8em 0;
	}
	a {
		color: var(--link);
		text-decoration: none;
	}
	a:hover {
		text-decoration: underline;
	}
	img {
		max-width: 100%;
		border-radius: 6px;
		display: block;
		margin: 0.5em 0;
	}
	code {
		font-family: ui-monospace, Consolas, monospace;
		font-size: 0.9em;
		background: var(--border);
		border-radius: 4px;
		padding: 0.1em 0.35em;
	}
	del {
		opacity: 0.6;
	}
</style>
