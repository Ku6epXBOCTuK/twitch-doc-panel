# twitch-panel-bio

Twitch Panel Extension: одна панель (318×496), внутри — несколько документов.
Контент — Markdown из git-репозитория: push → CI собирает → зрители видят новое
через ≤5 минут. Никаких бэкендов и кнопок «обновить».

## Структура

```
viewer.html / config.html      входы (single-file билд, один файл каждый)
src/viewer/                    вьювер: пейджер документов, тема Twitch
src/config/                    панель управления (Creator Dashboard): порядок/скрытие
src/shared/DocRenderer.svelte  рекурсивный рендерер JSON-AST (без {@html})
builder/                       валидация MD по белому списку → JSON-AST, sharp-картинки
content/docs/*.md              документы (front-matter: title обязателен, order/hidden/header)
.github/workflows/publish.yml  CI: push в main → ветка `published` (index.json + docs + img)
config.json                    ← впиши сюда repo: "user/repo"
```

## Команды

| Команда | Что делает |
|---|---|
| `npm run dev` | dev-сервер (HTTPS :8080): `/viewer.html` и `/config.html` |
| `npm run build` | два single-file билда → `dist/pkg/` (viewer.html + config.html) — это zip-билд |
| `npm run build:content` | контент: `content/` → `out/` (index.json, docs/*.json, img/*.webp) |

Локально билдер требует заполненного `config.json`; в CI SHA коммита подставляется автоматически.

## Контент

- Документы: `content/docs/<id>.md`. Front-matter: `title` (обязателен), `order` (число),
  `hidden` (bool), `header` (путь к заголовочной картинке от `content/assets/`).
- Картинки в тексте: `![](картинка.png)` — путь относительно .md; билдер жмёт в WebP
  (макс. ширина 640) и переписывает на иммутабельный jsDelivr-URL. Битые пути = ошибка сборки.
- Заголовочные картинки режутся в 636×340 (панель 318×170 @2x, object-fit: cover).
- Белый список: заголовки, абзацы, **жирный**/*курсив*/~~зачёркнутый~~, списки (включая
  GFM-чекбоксы), ссылки (только http/https), картинки, цитаты, `---`. Всё прочее
  (HTML, код-блоки, таблицы) — ошибка сборки с файлом:строкой.

## Доставка

CI (`push` в `main`) собирает `out/` и коммитит в ветку `published` (peaceiris/actions-gh-pages,
история сохраняется). Вьювер читает `raw.githubusercontent.com/<repo>/published/index.json`
(кэш 5 мин), документы — по абсолютным jsDelivr-URL с SHA коммита (иммутабельные).
Конфиг-сегмент Twitch хранит только per-channel исключения: `{v:1, hidden:[], order:[]}`.

## Чеклист Twitch-консоли (dev.twitch.tv → Console)

1. Create Extension → тип **Panel**, заполнить имя/описание.
2. **Asset Hosting**: Base URI `https://localhost:8080/` (для Local Test);
   Panel Viewer Path = `/viewer.html`; Panel Config Path = `/config.html`.
3. **CSP**: connect-src — `raw.githubusercontent.com`, `cdn.jsdelivr.net`;
   img-src — `cdn.jsdelivr.net` (добавить raw, если картинки будут там).
4. Загрузить zip из `dist/pkg/` (Files → Upload Version).
5. Local Test → Activate на своём канале (ревью не нужно). Публичный релиз —
   Hosted Test → Review (walkthrough + change log).

Pop-out отключить нельзя — это кнопка UI Twitch. Скрипт Helper (`twitch-ext.min.js`)
обязателен в обоих HTML — уже подключён.
