import type { BroadcasterConfig, Theme } from "./types.ts";

// Обёртка над Twitch Extension Helper. В dev (import.meta.env.DEV) работает на
// моках: тема dark, конфиг канала хранится в localStorage —
// сохранение в config-вью сразу видно во viewer (как onChanged в Twitch).
// В проде — только реальные API расширения.

export interface TwitchContext {
	theme?: Theme;
	[key: string]: unknown;
}

export interface TwitchAuth {
	channelId: string;
	clientId: string;
	token: string;
	userId: string;
	helixToken: string;
	role: string;
}

interface TwitchExt {
	onContext(cb: (ctx: TwitchContext, changed: unknown) => void): void;
	onAuthorized(cb: (auth: TwitchAuth) => void): void;
	configuration: {
		onChanged(cb: () => void): void;
		set(segment: string, version: string, content: string): void;
		broadcaster?: { content?: string; version?: string };
	};
}

declare global {
	var Twitch: { ext: TwitchExt } | undefined;
}

const ext = globalThis.Twitch?.ext ?? null;

const DEV_CONFIG_KEY = "dev:broadcaster-config";

const contextListeners: ((ctx: TwitchContext) => void)[] = [];
const authListeners: ((auth: TwitchAuth) => void)[] = [];
const configListeners: ((cfg: BroadcasterConfig | null) => void)[] = [];
let broadcasterConfig: BroadcasterConfig | null = null;
let notified = false;

function readDevConfig(): BroadcasterConfig | null {
	try {
		const raw = globalThis.localStorage?.getItem(DEV_CONFIG_KEY);
		return raw ? (JSON.parse(raw) as BroadcasterConfig) : null;
	} catch {
		console.warn("twitch.ts: dev-конфиг не парсится как JSON");
		return null;
	}
}

function parseConfig(): BroadcasterConfig | null {
	if (import.meta.env.DEV) return readDevConfig();
	const raw = ext?.configuration?.broadcaster?.content;
	if (!raw) return null;
	try {
		return JSON.parse(raw) as BroadcasterConfig;
	} catch {
		console.warn("twitch.ts: broadcaster config не парсится как JSON");
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
	globalThis.addEventListener?.("storage", (e: StorageEvent) => {
		if (e.key === DEV_CONFIG_KEY) notifyConfig();
	});
	setTimeout(notifyConfig, 0);
} else if (ext) {
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

export function onContext(cb: (ctx: TwitchContext) => void): void {
	contextListeners.push(cb);
	if (import.meta.env.DEV) cb({ theme: "dark" });
}

export function onAuthorized(cb: (auth: TwitchAuth) => void): void {
	authListeners.push(cb);
}

// Подписка на конфиг канала (null, пока не пришёл). Колбэк зовётся
// сразу, если значение уже доставлено.
export function onBroadcasterConfig(
	cb: (cfg: BroadcasterConfig | null) => void,
): void {
	configListeners.push(cb);
	if (notified) cb(broadcasterConfig);
}

// Разовое чтение текущего значения (может быть null до бутстрапа).
export function getBroadcasterConfig(): BroadcasterConfig | null {
	return broadcasterConfig ?? parseConfig();
}

// Разрешено вызывать только из config-вью от имени стримера.
export function saveBroadcasterConfig(value: BroadcasterConfig): boolean {
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
	if (!ext) {
		console.warn("saveBroadcasterConfig: Twitch.ext недоступен");
		return false;
	}
	ext.configuration.set("broadcaster", "1", JSON.stringify(value));
	return true;
}
