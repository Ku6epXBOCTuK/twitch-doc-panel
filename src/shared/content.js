// Белый список хостов, с которых разрешено грузить контент (index.json, .md, картинки).
// Расширение не станет обращаться ни к какому другому хосту.
export const ALLOWED_CONTENT_HOSTS = [
  'raw.githubusercontent.com', // GitHub
  'xboct-git.duckdns.org',     // Gitea
  'xboctuk.duckdns.org',       // хостинг контента (twitch-panel-docs)
  'localhost',                 // локальная разработка и скриншоты
  '127.0.0.1',
];

// Ссылка на index.json по умолчанию, пока не задана в панели управления канала.
export const DEFAULT_INDEX_URL = '';

export function isAllowedUrl(url) {
  try {
    return ALLOWED_CONTENT_HOSTS.includes(new URL(url, globalThis.location?.href).hostname);
  } catch {
    return false;
  }
}
