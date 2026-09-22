// URL sanitizers for DocRenderer. Images — https only (http only for
// localhost: dev mode and screenshots), links — any http(s).

const LINK_RE = /^https?:\/\//i;

export function safeImg(src: unknown): string | null {
	if (typeof src !== "string") return null;
	try {
		const u = new URL(src);
		// http is allowed only for localhost (dev mode and screenshots)
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

export function safeLink(href: unknown): string | null {
	return typeof href === "string" && LINK_RE.test(href) ? href : null;
}
