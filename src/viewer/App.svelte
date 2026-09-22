<script lang="ts">
	import { onContext, onBroadcasterConfig } from "../shared/twitch.ts";
	import { resolveIndexUrl } from "../shared/content.ts";
	import { mdToBlocks, type MdAst, type MdBlock } from "../shared/md.ts";
	import type { BroadcasterConfig, DocEntry, Theme } from "../shared/types.ts";
	import DocRenderer from "../shared/DocRenderer.svelte";

	// ?theme=light|dark — ручное перекрытие темы (аудит тем в dev-обёртке);
	// без параметра тема приходит из Twitch (локально — заглушка dark).
	const qpTheme = new URLSearchParams(globalThis.location?.search ?? "").get(
		"theme",
	);
	let theme = $state<Theme>(
		qpTheme === "light" || qpTheme === "dark" ? qpTheme : "dark",
	);
	onContext((ctx) => {
		if (!qpTheme && ctx.theme) theme = ctx.theme;
	});

	// Конфиг канала: {v:1, indexUrl, hidden:[], order:[]} — приходит асинхронно
	// и меняется при сохранении в config-вью; подписка ловит оба случая.
	let cfg: BroadcasterConfig | null = null;
	let lastCfgJson = "";

	type Status =
		"loading" | "ready" | "empty" | "error" | "need-config" | "bad-url";
	interface LoadedDoc {
		title: string;
		blocks: MdBlock[];
	}

	let docs: DocEntry[] = $state([]);
	let current = $state(0);
	let status = $state<Status>("loading"); // loading|ready|empty|error|need-config|bad-url
	let loadError = $state("");
	let doc = $state<LoadedDoc | null>(null);
	let docError = $state("");
	let lastIndexUrl = "";

	// ?index=<url> — ручное переопределение (тесты, скриншоты): грузим сразу,
	// не дожидаясь конфиг-сегмента. Фильтр хостов делает CSP версии.
	const qp = new URLSearchParams(globalThis.location?.search ?? "").get(
		"index",
	);
	if (qp) {
		loadIndex(qp);
	} else {
		onBroadcasterConfig((c) => {
			const json = JSON.stringify(c ?? null);
			if (json === lastCfgJson) return;
			lastCfgJson = json;
			cfg = c;
			const r = resolveIndexUrl(c);
			if (r.error) {
				status = r.error; // 'bad-url' | 'need-config' — совпадает со статусами вьюера
				loadError = r.detail;
			}
			if (r.url) loadIndex(r.url);
		});
	}

	async function loadIndex(indexUrl: string): Promise<void> {
		lastIndexUrl = indexUrl;
		status = "loading";
		loadError = "";
		try {
			const res = await fetch(indexUrl);
			if (!res.ok) throw new Error(`index.json: HTTP ${res.status}`);
			// res.url учитывает редиректы: относительные пути — от фактического адреса индекса
			const base = new URL(".", res.url).href;
			const raw: unknown = await res.json();
			if (!Array.isArray(raw)) throw new Error("index.json: ожидался массив");
			let list: DocEntry[] = raw as DocEntry[];
			list = list.map((d) => ({
				...d,
				url: new URL(d.url, base).href,
				banner: d.banner ? new URL(d.banner, base).href : null,
			}));
			if (cfg) {
				const hidden = new Set(cfg.hidden ?? []);
				const order = new Map((cfg.order ?? []).map((id, i) => [id, i]));
				list = list.filter((d) => !d.hidden && !hidden.has(d.id));
				list.sort(
					(a, b) =>
						(order.get(a.id) ?? Infinity) - (order.get(b.id) ?? Infinity),
				);
			}
			docs = list;
			if (!list.length) {
				status = "empty";
				return;
			}
			status = "ready";
			await loadDoc(0);
		} catch (e) {
			console.error(e);
			loadError = String((e as Error).message ?? e);
			status = "error";
		}
	}

	// Относительные пути картинок/ссылок из .md резолвим от адреса самого файла.
	// Рекурсивно по всем контейнерам (p, заголовки, списки, li, blockquote,
	// em/strong/del) — абсолютным становится href каждой картинки и ссылки.
	// Тип узла — «сырой» MdAst: строка или массив (узел или items списка),
	// форма проверяется в рантайме.
	function absolutize(n: MdAst, base: string): MdAst {
		if (typeof n === "string") return n;
		const [tag, ...rest] = n;
		if (tag === "img" || tag === "a") {
			const href = rest[0];
			if (typeof href === "string") {
				const abs = /^https?:\/\//i.test(href)
					? href
					: new URL(href, base).href;
				return [tag, abs, ...rest.slice(1)];
			}
			return n;
		}
		if (tag === "ul" || tag === "ol") {
			const items = rest[0];
			return Array.isArray(items)
				? [tag, ...items.map((li) => absolutize(li, base))]
				: n;
		}
		return [tag, ...rest.map((x) => absolutize(x, base))];
	}

	async function loadDoc(i: number): Promise<void> {
		current = i;
		doc = null;
		docError = "";
		try {
			const res = await fetch(docs[i].url);
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			const docBase = new URL(".", res.url).href;
			const blocks = mdToBlocks(await res.text()).map(
				(b) => absolutize(b, docBase) as MdBlock,
			);
			doc = { title: docs[i].title, blocks };
		} catch (e) {
			console.error(e);
			docError = String((e as Error).message ?? e);
		}
	}

	// --- Оверлей-скроллбар: полупрозрачный, поверх контента, виден только при скролле ---
	let mainEl = $state<HTMLElement | null>(null);
	let contentEl = $state<HTMLElement | null>(null);
	let thumb = $state({ visible: false, top: 0, height: 0 });
	let hideTimer: ReturnType<typeof setTimeout> | undefined;

	function updateThumb(): void {
		const el = mainEl;
		if (!el) return;
		if (el.scrollHeight <= el.clientHeight + 1) {
			thumb = { visible: false, top: 0, height: 0 };
			return;
		}
		const height = Math.max(
			28,
			(el.clientHeight / el.scrollHeight) * el.clientHeight,
		);
		const top =
			(el.scrollTop / (el.scrollHeight - el.clientHeight)) *
			(el.clientHeight - height);
		thumb = { ...thumb, height, top };
	}

	function onScroll(): void {
		updateThumb();
		thumb = { ...thumb, visible: true };
		clearTimeout(hideTimer);
		hideTimer = setTimeout(() => {
			thumb = { ...thumb, visible: false };
		}, 700);
	}

	// Пересчёт при изменении размеров (смена документа, загрузка картинок)
	const demoScroll = new URLSearchParams(globalThis.location?.search ?? "").has(
		"demoScroll",
	);
	$effect(() => {
		const el = mainEl;
		const content = contentEl;
		if (!el || !content) return;
		const ro = new ResizeObserver(() => {
			updateThumb();
			// Демо-кадр для скриншотов: прокручиваем контент, чтобы ползунок и тени
			// попали в кадр (включается параметром ?demoScroll=1).
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

	const prev = () => current > 0 && loadDoc(current - 1);
	const next = () => current < docs.length - 1 && loadDoc(current + 1);
</script>

<div class="panel" data-theme={theme}>
	{#if status === "loading"}
		<p class="muted center">Загрузка…</p>
	{:else if status === "need-config"}
		<p class="center">Ссылка на контент не задана.</p>
		<p class="muted center">
			Открой панель управления расширением и укажи ссылку на index.json.
		</p>
	{:else if status === "bad-url"}
		<p class="center">
			Ссылка на контент должна быть http(s) URL или относительным путём.
		</p>
		<p class="muted center">{loadError}</p>
	{:else if status === "error"}
		<p class="center">Не удалось загрузить документы.</p>
		<p class="muted center">{loadError}</p>
		<p class="center">
			<button onclick={() => loadIndex(lastIndexUrl)}>Повторить</button>
		</p>
	{:else if status === "empty"}
		<p class="muted center">Документов пока нет.</p>
	{:else}
		{#if docs[current]?.banner}
			<img
				class="banner"
				src={docs[current].banner}
				alt={docs[current].title}
			/>
		{/if}
		<div class="scrollwrap">
			<main bind:this={mainEl} onscroll={onScroll}>
				<div bind:this={contentEl}>
					{#if !docs[current]?.banner}
						<h1 class="title">{doc?.title ?? docs[current].title}</h1>
					{/if}
					{#if docError}
						<p class="muted">Не удалось загрузить документ ({docError}).</p>
					{:else if doc}
						<DocRenderer nodes={doc.blocks} />
					{:else}
						<p class="muted">Загрузка…</p>
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
		{#if docs.length > 1}
			<nav>
				<button
					onclick={prev}
					disabled={current === 0}
					aria-label="Предыдущий документ">‹</button
				>
				<span class="doc-title" title={docs[current]?.title}
					>{docs[current]?.title}</span
				>
				<button
					onclick={next}
					disabled={current === docs.length - 1}
					aria-label="Следующий документ">›</button
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
		/* Тема приходит из Twitch (onContext) */
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
		/* Нативный скроллбар скрыт полностью — вместо него оверлей-ползунок .sb-thumb */
		scrollbar-width: none;
		-ms-overflow-style: none;
		overscroll-behavior: contain;
		/* Градиентные тени: у края контент растворяется в цвет подложки
       (на тёмной теме чёрная тень не видна, а растворение текста — видно).
       Локальные слои (local) маскируют растворение у самого края. */
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
