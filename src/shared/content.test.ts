import { afterEach, describe, expect, test, vi } from "vitest";
import { isContentUrl, resolveIndexUrl } from "./content.ts";

// Smoke test: verifies the vitest setup + basic behavior.
// isContentUrl resolves relative paths against location.href — not available
// in a node environment, so it is stubbed per test.
describe("isContentUrl", () => {
	afterEach(() => {
		vi.unstubAllGlobals();
	});

	test("allows http(s) URLs and relative paths", () => {
		vi.stubGlobal("location", { href: "https://extension-files.twitch.tv/" });
		expect(
			isContentUrl("https://cdn.jsdelivr.net/gh/u/r@main/index.json"),
		).toBe(true);
		expect(isContentUrl("http://localhost:5173/fixtures/index.json")).toBe(
			true,
		);
		expect(isContentUrl("./index.json")).toBe(true);
	});

	test("rejects non-http(s) schemes and garbage", () => {
		vi.stubGlobal("location", { href: "https://extension-files.twitch.tv/" });
		expect(isContentUrl("javascript:alert(1)")).toBe(false);
		expect(isContentUrl("data:text/html,hi")).toBe(false);
		expect(isContentUrl("")).toBe(false);
		expect(isContentUrl("   ")).toBe(false);
		expect(isContentUrl(null)).toBe(false);
		expect(isContentUrl(42)).toBe(false);
	});
});

describe("resolveIndexUrl", () => {
	test("passes a valid indexUrl from config through", () => {
		const r = resolveIndexUrl({ indexUrl: "https://example.com/index.json" });
		expect(r).toEqual({
			url: "https://example.com/index.json",
			error: null,
			detail: "",
		});
	});

	test("bad scheme from config -> bad-url with detail", () => {
		const r = resolveIndexUrl({ indexUrl: "javascript:alert(1)" });
		expect(r.url).toBeNull();
		expect(r.error).toBe("bad-url");
		expect(r.detail).toBe("javascript:alert(1)");
	});
});
