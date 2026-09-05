// Обёртка над Twitch Extension Helper с заглушкой для локальной разработки:
// вне Twitch (npm run dev) всё работает, сохранение конфига просто логируется.

const ext = globalThis.Twitch?.ext ?? null;

export const isTwitch = Boolean(ext);

const contextListeners = [];
const authListeners = [];

if (ext) {
  ext.onContext((ctx) => contextListeners.forEach((cb) => cb(ctx)));
  ext.onAuthorized((auth) => authListeners.forEach((cb) => cb(auth)));
}

export function onContext(cb) {
  contextListeners.push(cb);
  if (!ext) cb({ theme: 'dark' });
}

export function onAuthorized(cb) {
  authListeners.push(cb);
}

// Сегмент broadcaster — публичные настройки канала (JSON или null).
export function getBroadcasterConfig() {
  if (!ext) return null;
  const raw = ext.configuration?.broadcaster?.content;
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    console.warn('twitch.js: broadcaster config не парсится как JSON');
    return null;
  }
}

// Разрешено вызывать только из config-вью от имени стримера.
export function saveBroadcasterConfig(value) {
  if (!ext) {
    console.warn('[dev] saveBroadcasterConfig:', value);
    return false;
  }
  ext.configuration.set('broadcaster', '1', JSON.stringify(value));
  return true;
}
