import { afterEach, describe, expect, test, vi } from "vitest";
import {
	applyConfig,
	buildConfigRows,
	fetchDocsIndex,
	moveRow,
	toBroadcasterConfig,
} from "./docs.ts";
import type { DocEntry } from "./types.ts";

const entry = (id: string, over: Partial<DocEntry> = {}): DocEntry => ({
	id,
	title: `Doc ${id}`,
	order: 1000,
	hidden: false,
	banner: null,
	url: `https://cdn.example.com/${id}.md`,
	...over,
});

// Response in node cannot set res.url via init — mock with a minimal object
// exposing the same surface fetchDocsIndex reads (ok, url, json).
const jsonResponse = (body: unknown, url: string) => ({
	ok: true,
	url,
	json: async () => body,
});

afterEach(() => {
	vi.unstubAllGlobals();
});

describe("fetchDocsIndex", () => {
	test("fetches, validates and absolutizes URLs against the index base", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(async () =>
				jsonResponse(
					[{ id: "a", title: "A", url: "a.md", banner: "banners/a.png" }],
					"https://cdn.example.com/index.json",
				),
			),
		);
		const r = await fetchDocsIndex("https://cdn.example.com/index.json");
		expect(r.ok).toBe(true);
		if (!r.ok) return;
		expect(r.base).toBe("https://cdn.example.com/");
		expect(r.entries[0].url).toBe("https://cdn.example.com/a.md");
		expect(r.entries[0].banner).toBe("https://cdn.example.com/banners/a.png");
	});

	test("keeps absolute URLs as-is and null banner as null", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(async () =>
				jsonResponse(
					[
						{
							id: "a",
							title: "A",
							url: "https://other.example.com/x.md",
							banner: null,
						},
					],
					"https://cdn.example.com/index.json",
				),
			),
		);
		const r = await fetchDocsIndex("https://cdn.example.com/index.json");
		expect(r.ok).toBe(true);
		if (!r.ok) return;
		expect(r.entries[0].url).toBe("https://other.example.com/x.md");
		expect(r.entries[0].banner).toBeNull();
	});

	test("non-ok response → failure with HTTP status", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(async () => new Response("", { status: 404 })),
		);
		const r = await fetchDocsIndex("https://cdn.example.com/index.json");
		expect(r).toEqual({
			ok: false,
			message: "index.json: HTTP 404",
		});
	});

	test("non-array JSON → failure", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(async () => jsonResponse({}, "https://cdn.example.com/index.json")),
		);
		const r = await fetchDocsIndex("https://cdn.example.com/index.json");
		expect(r).toEqual({ ok: false, message: "index.json: expected an array" });
	});

	test("network error → failure with error message", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(async () => {
				throw new TypeError("Failed to fetch");
			}),
		);
		const r = await fetchDocsIndex("https://cdn.example.com/index.json");
		expect(r).toEqual({ ok: false, message: "Failed to fetch" });
	});
});

describe("applyConfig", () => {
	test("removes docs hidden in the index or in config, sorts by config order", () => {
		const list = [
			entry("a"),
			entry("b", { hidden: true }),
			entry("c"),
			entry("d"),
		];
		const out = applyConfig(list, {
			hidden: ["d"],
			order: ["c", "a"],
		});
		expect(out.map((d) => d.id)).toEqual(["c", "a"]);
	});

	test("without config keeps only non-hidden docs in original order", () => {
		const list = [entry("a"), entry("b", { hidden: true }), entry("c")];
		expect(applyConfig(list, null).map((d) => d.id)).toEqual(["a", "c"]);
	});

	test("docs missing from config order go last", () => {
		const list = [entry("x"), entry("a"), entry("m")];
		const out = applyConfig(list, { order: ["a"] });
		expect(out.map((d) => d.id)).toEqual(["a", "x", "m"]);
	});
});

describe("buildConfigRows", () => {
	test("rows carry hidden flag from config, sorted by config order", () => {
		const index = [entry("a"), entry("b"), entry("c", { hidden: true })];
		const rows = buildConfigRows(index, { hidden: ["b"], order: ["c", "a"] });
		expect(rows).toEqual([
			{ id: "a", title: "Doc a", hidden: false },
			{ id: "b", title: "Doc b", hidden: true },
		]);
	});

	test("without config all rows visible in index order", () => {
		const index = [entry("a"), entry("b")];
		expect(buildConfigRows(index, {})).toEqual([
			{ id: "a", title: "Doc a", hidden: false },
			{ id: "b", title: "Doc b", hidden: false },
		]);
	});
});

describe("moveRow", () => {
	const rows = [
		{ id: "a", title: "A", hidden: false },
		{ id: "b", title: "B", hidden: false },
		{ id: "c", title: "C", hidden: false },
	];

	test("swaps with the next row, does not mutate the source", () => {
		const out = moveRow(rows, 0, 1);
		expect(out.map((r) => r.id)).toEqual(["b", "a", "c"]);
		expect(rows.map((r) => r.id)).toEqual(["a", "b", "c"]);
	});

	test("out-of-range moves return the same array", () => {
		expect(moveRow(rows, 0, -1)).toBe(rows);
		expect(moveRow(rows, 2, 1)).toBe(rows);
	});
});

describe("toBroadcasterConfig", () => {
	test("collects hidden ids and full order from rows", () => {
		const rows = [
			{ id: "a", title: "A", hidden: false },
			{ id: "b", title: "B", hidden: true },
			{ id: "c", title: "C", hidden: false },
		];
		expect(toBroadcasterConfig("https://x/index.json", rows)).toEqual({
			v: 1,
			indexUrl: "https://x/index.json",
			hidden: ["b"],
			order: ["a", "b", "c"],
		});
	});
});
