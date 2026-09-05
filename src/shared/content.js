import cfg from '../../config.json';

// Индекс контента публикуется CI в ветку `published`; raw.githubusercontent
// отдаёт его с кэшем 5 минут и CORS *. Документы и картинки внутри индекса —
// абсолютные URL на jsDelivr, запиннованные на SHA коммита (иммутабельные).
export const INDEX_URL = `https://raw.githubusercontent.com/${cfg.repo}/${cfg.branch}/index.json`;
