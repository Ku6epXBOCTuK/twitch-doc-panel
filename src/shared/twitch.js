// Обёртка над Twitch Extension Helper. В dev (import.meta.env.DEV) работает на
// моках: тема dark, конфиг канала хранится в localStorage —
// сохранение в config-вью сразу видно во viewer (как onChanged в Twitch).
// В проде — только реальные API расширения.
const ext = globalThis.Twitch?.ext ?? null;

const DEV_CONFIG_KEY = "dev:broadcaster-config";

const contextListeners = [];
const authListeners = [];
const configListeners = [];
let broadcasterConfig = null;
let notified = false;

function readDevConfig() {
	try {
		const raw = globalThis.localStorage?.getItem(DEV_CONFIG_KEY);
		return raw ? JSON.parse(raw) : null;
	} catch {
		console.warn("twitch.js: dev-конфиг не парсится как JSON");
		return null;
	}
}

function parseConfig() {
	if (import.meta.env.DEV) return readDevConfig();
	const raw = ext?.configuration?.broadcaster?.content;
	if (!raw) return null;
	try {
		return JSON.parse(raw);
	} catch {
		console.warn("twitch.js: broadcaster config не парсится как JSON");
		return null;
	}
}

function notifyConfig() {
	broadcasterConfig = parseConfig();
	notified = true;
	configListeners.forEach((cb) => cb(broadcasterConfig));
}

if (import.meta.env.DEV) {
	// Dev-моки. storage-событие ловит сохранение из config-вью в соседнем
	// iframe/вкладке — аналог onChanged в Twitch.
	globalThis.addEventListener?.("storage", (e) => {
		if (e.key === DEV_CONFIG_KEY) notifyConfig();
	});
	setTimeout(notifyConfig, 0);
} else {
	ext.onContext((ctx) => contextListeners.forEach((cb) => cb(ctx)));
	ext.onAuthorized((auth) => authListeners.forEach((cb) => cb(auth)));
	// Конфиг приходит асинхронно: onChanged ловит и первое значение при бутстрапе,
	// и последующие изменения (например, сохранение в config-вью).
	ext.configuration?.onChanged?.(notifyConfig);
	// Если значение уже лежит синхронно — уведомляем сразу.
	if (ext.configuration?.broadcaster?.content) notifyConfig();
	// Страховка: если конфиг так и не пришёл (страница открыта вне Twitch) —
	// уведомляем null, чтобы UI не завис на «Загрузка…».
	setTimeout(() => {
		if (!notified) notifyConfig();
	}, 2000);
}

export function onContext(cb) {
	contextListeners.push(cb);
	if (import.meta.env.DEV) cb({ theme: "dark" });
}

export function onAuthorized(cb) {
	authListeners.push(cb);
}

// Подписка на конфиг канала (null, пока не пришёл). Колбэк зовётся
// сразу, если значение уже доставлено.
export function onBroadcasterConfig(cb) {
	configListeners.push(cb);
	if (notified) cb(broadcasterConfig);
}

// Разовое чтение текущего значения (может быть null до бутстрапа).
export function getBroadcasterConfig() {
	return broadcasterConfig ?? parseConfig();
}

// Разрешено вызывать только из config-вью от имени стримера.
export function saveBroadcasterConfig(value) {
	if (import.meta.env.DEV) {
		// Dev: Twitch-конфига нет — сохраняем в localStorage и перечитываем,
		// чтобы тот же фрейм (config-вью) сразу увидил свой savedCfg.
		try {
			globalThis.localStorage?.setItem(DEV_CONFIG_KEY, JSON.stringify(value));
		} catch {
			// localStorage недоступен — остаётся только лог ниже
		}
		notifyConfig();
		console.warn("[dev] saveBroadcasterConfig:", value);
		return true;
	}
	ext.configuration.set("broadcaster", "1", JSON.stringify(value));
	return true;
}
