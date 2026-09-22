import { describe, expect, test } from "vitest";
import { absolutizeUrls, type MdAst } from "./md.ts";
import { safeImg, safeLink } from "./md-sanitize.ts";

// Test nodes are built without as const: MdAst requires mutable arrays.

describe("absolutizeUrls", () => {
	const base = "https://cdn.example.com/docs/rules.md";

	test("resolves relative img and a hrefs against the doc base", () => {
		const node: MdAst = [
			"p",
			["img", "images/pic.png", "alt"],
			["a", "other.md", "link"],
		];
		const out = absolutizeUrls(node, base) as unknown[];
		const [, img, a] = out as [string, [string, string, string], unknown[]];
		expect(img[1]).toBe("https://cdn.example.com/docs/images/pic.png");
		expect(a[1]).toBe("https://cdn.example.com/docs/other.md");
	});

	test("keeps absolute http(s) hrefs as-is", () => {
		const node: MdAst = ["p", ["a", "https://twitch.tv/x", "link"]];
		const out = absolutizeUrls(node, base) as unknown[];
		const [, a] = out as [string, [string, string]];
		expect(a[1]).toBe("https://twitch.tv/x");
	});

	test("recurses into containers: headings, lists, li, blockquote, inline", () => {
		const node: MdAst = [
			"blockquote",
			["h2", "Heading"],
			["ul", [["li", ["a", "x.md", "l"]]]],
			["em", ["img", "i.png", ""]],
		];
		const out = absolutizeUrls(node, base);
		expect(JSON.stringify(out)).toContain("https://cdn.example.com/docs/x.md");
		expect(JSON.stringify(out)).toContain("https://cdn.example.com/docs/i.png");
	});

	test("leaves strings untouched", () => {
		expect(absolutizeUrls("text", base)).toBe("text");
	});

	test("missing or non-string href keeps node unchanged", () => {
		const node: MdAst = ["img"];
		expect(absolutizeUrls(node, base)).toEqual(node);
	});
});

describe("safeImg", () => {
	test("https allowed, absolute form returned", () => {
		expect(safeImg("https://cdn.example.com/a.png")).toBe(
			"https://cdn.example.com/a.png",
		);
	});

	test("http allowed only for localhost (dev mode and screenshots)", () => {
		expect(safeImg("http://localhost:5173/a.png")).toBe(
			"http://localhost:5173/a.png",
		);
		expect(safeImg("http://127.0.0.1/a.png")).toBe("http://127.0.0.1/a.png");
		expect(safeImg("http://evil.example.com/a.png")).toBeNull();
	});

	test("garbage → null", () => {
		expect(safeImg("not a url")).toBeNull();
		expect(safeImg(null)).toBeNull();
		expect(safeImg(42)).toBeNull();
	});
});

describe("safeLink", () => {
	test("http(s) passes through, everything else → null", () => {
		expect(safeLink("https://twitch.tv")).toBe("https://twitch.tv");
		expect(safeLink("http://twitch.tv")).toBe("http://twitch.tv");
		expect(safeLink("javascript:alert(1)")).toBeNull();
		expect(safeLink("relative.md")).toBeNull();
		expect(safeLink(undefined)).toBeNull();
	});
});
