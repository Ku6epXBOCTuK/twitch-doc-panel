import type { BroadcasterConfig, ConfigRow, DocEntry } from "./types.ts";

// Shared docs-index logic for the viewer and config views:
// fetch + validation, hidden filter, ordering by the channel config.

// Result of fetching the index: success → entries, otherwise a human-readable message.
export type FetchIndexResult =
	| { ok: true; entries: DocEntry[]; base: string }
	| { ok: false; message: string };

export async function fetchDocsIndex(
	indexUrl: string,
): Promise<FetchIndexResult> {
	try {
		const res = await fetch(indexUrl);
		if (!res.ok) {
			return { ok: false, message: `index.json: HTTP ${res.status}` };
		}
		// res.url accounts for redirects: relative paths resolve against the
		// actual address the index was served from
		const base = new URL(".", res.url).href;
		const raw: unknown = await res.json();
		if (!Array.isArray(raw)) {
			return { ok: false, message: "index.json: expected an array" };
		}
		const entries = (raw as DocEntry[]).map((d) => ({
			...d,
			url: new URL(d.url, base).href,
			banner: d.banner ? new URL(d.banner, base).href : null,
		}));
		return { ok: true, entries, base };
	} catch (e) {
		return { ok: false, message: String((e as Error).message ?? e) };
	}
}

// Order map from the config: id → position.
function orderMap(cfg: Partial<BroadcasterConfig> | null | undefined) {
	return new Map((cfg?.order ?? []).map((id, i) => [id, i]));
}

// Filters out docs hidden in the index or in the config, sorts by the config
// order (docs missing from it go last).
export function applyConfig(
	list: DocEntry[],
	cfg: Partial<BroadcasterConfig> | null | undefined,
): DocEntry[] {
	const hidden = new Set(cfg?.hidden ?? []);
	const order = orderMap(cfg);
	return list
		.filter((d) => !d.hidden && !hidden.has(d.id))
		.sort(
			(a, b) => (order.get(a.id) ?? Infinity) - (order.get(b.id) ?? Infinity),
		);
}

// Rows of the config-view list from the index: index-hidden docs excluded,
// the hidden flag comes from the channel config, ordering follows the config.
export function buildConfigRows(
	index: DocEntry[],
	cfg: Partial<BroadcasterConfig> | null | undefined,
): ConfigRow[] {
	const hidden = new Set(cfg?.hidden ?? []);
	const order = orderMap(cfg);
	return index
		.filter((d) => !d.hidden)
		.map((d) => ({ id: d.id, title: d.title, hidden: hidden.has(d.id) }))
		.sort(
			(a, b) => (order.get(a.id) ?? Infinity) - (order.get(b.id) ?? Infinity),
		);
}

// Moves a row within a copy of the array (i swaps with i+dir).
export function moveRow(
	list: ConfigRow[],
	i: number,
	dir: number,
): ConfigRow[] {
	const j = i + dir;
	if (i < 0 || i >= list.length || j < 0 || j >= list.length) return list;
	const copy = [...list];
	[copy[i], copy[j]] = [copy[j], copy[i]];
	return copy;
}

// Builds the config to save from the config-view list rows.
export function toBroadcasterConfig(
	indexUrl: string,
	list: ConfigRow[],
): BroadcasterConfig {
	return {
		v: 1,
		indexUrl,
		hidden: list.filter((d) => d.hidden).map((d) => d.id),
		order: list.map((d) => d.id),
	};
}
