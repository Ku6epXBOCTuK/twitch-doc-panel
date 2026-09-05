# twitch-panel-bio

Twitch Panel Extension: одна панель (318×496), внутри — несколько документов.
Контент — Markdown из git (Gitea), хостинг — твой сервер за nginx. Без бэкендов, без GitHub, без ревью.

## Структура

```
src/viewer/                    вьювер: пейджер документов, тема Twitch
src/config/                    панель управления (Creator Dashboard): порядок/скрытие
src/shared/DocRenderer.svelte  рекурсивный рендерер JSON-AST (без {@html})
builder/                       валидация MD по белому списку → JSON-AST, sharp-картинки
content/docs/*.md              документы (front-matter: title обязателен, order/hidden/header)
site/                          сборка контента (промежуточная)
app/                           ИТОГ ДЛЯ ДЕПЛОЯ: viewer.html, config.html,
                               index.json, docs/, img/ — контент лежит рядом с html
```

## Команды

| Команда | Что делает |
|---|---|
| `npm run build:content` | контент: `content/` → `site/` |
| `npm run build` | фронтенд + контент → `app/` (одна самодостаточная папка) |
| `npm run dev` | dev-сервер :8080 (https, если в `certs/` есть mkcert-сертификат) |

## Деплой

`app/` — самодостаточная папка: контент ищется рядом с html, никаких зашитых
адресов и отдельных location не нужно. nginx — просто статика:

```nginx
location /panel/ {
    alias /srv/twitch-panel/app/;
}
```

Base URI в консоли Twitch = URL этой папки со слэшем на конце
(`https://xboct-git.duckdns.org/panel/`), Panel Viewer Path `viewer.html`,
Panel Config Path `config.html`. Контент same-origin — CORS не нужен вовсе.

Обновление: `npm run build:content && npm run build` → содержимое `app/` — на сервер
в ту же папку (git push/pull или копированием).

## Контент

- Документы: `content/docs/<id>.md`. Front-matter: `title` (обязателен), `order` (число),
  `hidden` (bool), `header` (путь к заголовочной картинке от `content/assets/`).
- Картинки в тексте: `![](картинка.png)` — путь относительно .md; билдер жмёт в WebP
  (макс. ширина 640) и пишет относительный путь. Битые пути = ошибка сборки.
- Заголовочные картинки режутся в 636×340 (318×170 @2x, object-fit: cover).
- Белый список: заголовки, абзацы, **жирный**/*курсив*/~~зачёркнутый~~, списки (включая
  GFM-чекбоксы), ссылки (только http/https), картинки, цитаты, `---`. Всё прочее
  (HTML, код-блоки, таблицы) — ошибка сборки с файлом:строкой.

## Тест на своём канале (Local Test)

1. `npm run build:content && npm run dev` — окно держать открытым; строка `Local:`
   покажет адрес и схему (с mkcert-сертификатом в `certs/` сервер поднимется по https).
2. В консоли Twitch: Base URI = адрес из `Local:` со слэшем на конце,
   Panel Viewer Path `viewer.html`, Panel Config Path `config.html`.
3. Extension Manager → Activate на своём канале. Панель управления — Configure
   у расширения в Extension Manager (порядок, скрытие документов).

Если в DevTools на config.html «Provisional headers are shown» / «CORS error» —
сервер не запущен, либо Base URI не совпадает со строкой `Local:` (схема/порт).

## Мелочи

- Pop-out отключить нельзя — кнопка UI Twitch.
- Zip-загрузка в Twitch = Hosted Test (виден только тестовым аккаунтам); для зрителей
  нужно Review → Released. Контент в zip в любом случае не попадает — он с твоего сервера.
- Если Twitch заблокирует fetch контента по CSP — добавь origin папки в connect-src
  allowlist расширения (обычно same-origin и так разрешён).
