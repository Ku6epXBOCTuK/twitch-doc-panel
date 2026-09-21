// Белый список хостов, с которых разрешено грузить контент (index.json, .md, картинки).
// Расширение не станет обращаться ни к какому другому хосту.
export const ALLOWED_CONTENT_HOSTS = [
	"raw.githubusercontent.com", // GitHub
	"xboct-git.duckdns.org", // Gitea
	"xboctuk.duckdns.org", // хостинг контента (twitch-panel-docs)
	"localhost", // локальная разработка и скриншоты
	"127.0.0.1",
];

// Ссылка на index.json по умолчанию, пока не задана в панели управления канала.
export const DEFAULT_INDEX_URL = "";

// URL локального index.json в dev-режиме. Мидлварь dev-content в
// vite.config.js пересобирает этот индекс на каждый запрос, поэтому правки
// content/docs/*.md видны по перезагрузке страницы.
const DEV_INDEX_URL = "/content/docs/index.json";

// Резолв URL индекса для viewer-панели. Приоритет: конфиг канала →
// DEFAULT_INDEX_URL → в dev — локальный индекс. В проде без конфига —
// error 'need-config'. Единственное место, знающее про dev при выборе URL.
export function resolveIndexUrl(cfg) {
	if (cfg?.indexUrl) {
		if (!isAllowedUrl(cfg.indexUrl)) {
			return { url: null, error: "bad-host", detail: cfg.indexUrl };
		}
		return { url: cfg.indexUrl, error: null, detail: "" };
	}
	if (DEFAULT_INDEX_URL && isAllowedUrl(DEFAULT_INDEX_URL)) {
		return { url: DEFAULT_INDEX_URL, error: null, detail: "" };
	}
	if (import.meta.env.DEV) {
		return { url: DEV_INDEX_URL, error: null, detail: "" };
	}
	return { url: null, error: "need-config", detail: "" };
}

// URL индекса, с которого стартует config-вью: из конфига канала, в dev —
// локальный. В проде без конфига — пустая строка (пустое поле ввода).
export function initialIndexUrl(cfg) {
	return cfg?.indexUrl ?? (import.meta.env.DEV ? DEV_INDEX_URL : "");
}

export function isAllowedUrl(url) {
	try {
		return ALLOWED_CONTENT_HOSTS.includes(
			new URL(url, globalThis.location?.href).hostname,
		);
	} catch {
		return false;
	}
}
