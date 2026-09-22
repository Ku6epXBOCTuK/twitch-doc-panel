import type { BroadcasterConfig, ResolveIndexResult } from "./types.ts";

// Ссылка на index.json по умолчанию, пока не задана в панели управления каналом.
export const DEFAULT_INDEX_URL = "";

// URL локального index.json в dev-режиме. Мидлварь dev-content в
// vite.config.ts пересобирает этот индекс на каждый запрос, поэтому правки
// fixtures/*.md видны по перезагрузке страницы.
const DEV_INDEX_URL = "/fixtures/index.json";

// Проверка ссылки на контент: абсолютные URL — только http/https,
// относительные пути разрешены (резолвятся от origin виджета).
// Реальный фильтр хостов — CSP версии, зашитый в консоли Twitch.
export function isContentUrl(url: unknown): boolean {
	if (typeof url !== "string" || !url.trim()) return false;
	try {
		const u = new URL(url, globalThis.location?.href);
		return u.protocol === "http:" || u.protocol === "https:";
	} catch {
		return false;
	}
}

// Резолв URL индекса для viewer-панели. Приоритет: конфиг канала →
// DEFAULT_INDEX_URL → в dev — локальный индекс. В проде без конфига —
// error 'need-config'. Единственное место, знающее про dev при выборе URL.
export function resolveIndexUrl(
	cfg: Partial<BroadcasterConfig> | null | undefined,
): ResolveIndexResult {
	if (cfg?.indexUrl) {
		if (!isContentUrl(cfg.indexUrl)) {
			return { url: null, error: "bad-url", detail: cfg.indexUrl };
		}
		return { url: cfg.indexUrl, error: null, detail: "" };
	}
	if (DEFAULT_INDEX_URL && isContentUrl(DEFAULT_INDEX_URL)) {
		return { url: DEFAULT_INDEX_URL, error: null, detail: "" };
	}
	if (import.meta.env.DEV) {
		return { url: DEV_INDEX_URL, error: null, detail: "" };
	}
	return { url: null, error: "need-config", detail: "" };
}

// URL индекса, с которого стартует config-вью: из конфига канала, в dev —
// локальный. В проде без конфига — пустая строка (пустое поле ввода).
export function initialIndexUrl(
	cfg: Partial<BroadcasterConfig> | null | undefined,
): string {
	return cfg?.indexUrl ?? (import.meta.env.DEV ? DEV_INDEX_URL : "");
}
