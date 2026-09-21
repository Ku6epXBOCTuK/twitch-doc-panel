// Обёртка над Twitch Extension Helper с заглушкой для локальной разработки:
// вне Twitch (npm run dev) всё работает, сохранение конфига просто логируется.

const ext = globalThis.Twitch?.ext ?? null;

export const isTwitch = Boolean(ext);

const contextListeners = [];
const authListeners = [];
const configListeners = [];
let broadcasterConfig = null;
let notified = false;

function parseConfig() {
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

if (ext) {
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
} else {
	// Вне Twitch конфига нет вовсе.
	setTimeout(notifyConfig, 0);
}

export function onContext(cb) {
	contextListeners.push(cb);
	if (!ext) cb({ theme: "dark" });
}

export function onAuthorized(cb) {
	authListeners.push(cb);
}

// Подписка на конфиг канала (null, пока не пришёл или вне Twitch). Колбэк зовётся
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
	if (!ext) {
		console.warn("[dev] saveBroadcasterConfig:", value);
		return false;
	}
	ext.configuration.set("broadcaster", "1", JSON.stringify(value));
	return true;
}
