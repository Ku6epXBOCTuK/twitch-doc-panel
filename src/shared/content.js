// Контент лежит РЯДОМ с html (index.json, docs/, img/) — базой в проде является
// папка текущей страницы (какой бы ни был Base URI); в dev контент раздаёт
// vite на /content/ с того же origin.
const BASE = import.meta.env.DEV
  ? `${globalThis.location.origin}/content`
  : new URL('.', globalThis.location.href).href;

export const CONTENT_ROOT = BASE.endsWith('/') ? BASE : `${BASE}/`;
export const INDEX_URL = `${CONTENT_ROOT}index.json`;
// Разрешённый хост картинок — origin самой страницы.
export const CONTENT_ORIGIN = new URL(BASE).origin;
