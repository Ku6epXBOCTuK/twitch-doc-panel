# DocPanel — тексты для ревью (Version Details / Status)

Все поля копируются в консоль Twitch как есть. Раздел «Скопировать в консоль» —
готовый текст на английском.

## Скопировать в консоль

### Name

```
DocPanel
```

### Summary

```
Show multiple documents in one channel panel: about, rules, schedule, FAQ. Content is plain Markdown from your own repo — no backend, no coding.
```

### Description

```
DocPanel turns a single Twitch panel into a small channel notebook. Instead of one static panel, you get a pager with several documents that viewers flip through: about you, chat rules, schedule, FAQ, commands, links — anything you write.

All content lives in Markdown (.md) files in your own repository (GitHub, Gitea, any HTTP host). DocPanel loads them directly and renders them in the panel — no backend service, no build step, no extra cost.

How it works
- Write documents as plain Markdown: headings, bold/italic, lists, checkboxes, quotes, links, images.
- Run the included `build-docs` tool (or the builder from this repo) to generate `index.json`.
- In the panel config (inside the Twitch Extension Manager), paste the URL to your `index.json` and save.

Features
- Multiple documents in one panel with prev/next pager.
- Per-document banners for a styled header.
- Order and hide documents from the config — no rebuild needed.
- Fit for dark and light Twitch themes.
- HTTPS content hosts only; relative image paths are supported.
- No tracking, no ads. Viewer and channel IDs never leave the browser.

Installation
1. Open Extensions in your Twitch Dashboard and install DocPanel.
2. Configure the panel: paste the URL of your content repository's `index.json`.
3. Load the list, adjust order or hide documents, save. Done.
```

### Категория

```
Streamer Tools
```

### Walkthrough Guide (Status → при сабмите на ревью)

```
Step 1. Open DocPanel config (Extension Manager → Configure).
Step 2. Paste the URL to an index.json that lists the channel documents. If the URL is missing, the panel shows a "content URL not set" hint.
Step 3. Click "Load list". The documents from index.json appear with their titles; the first one is shown in the panel preview.
Step 4. Drag to reorder or hide documents, then Save. The panel on the channel shows the first document and a prev/next pager.
Step 5. Verify: the panel displays the rendered document, arrows switch between documents, and the configuration persists after refresh.

Notes for the review team: this is a panel-only extension with no backend. It does not request identity, chat, or bits. The streamer supplies the content URL themselves; without it the panel shows an empty-hint state. The extension makes no network calls except loading the Markdown content and index from the streamer-provided URL.
```

### Changelog (v0.2.0)

```
v0.2.0 — Initial submission.
- Panel viewer + config panel.
- Markdown rendering (headings, text styles, lists, checkboxes, quotes, links, images; unsupported constructs are skipped).
- Document pager, banners, ordering and hiding via config.
- Dark and light theme support.
```

## Шпаргалка по вкладкам консоли (для заполнения)

| Вкладка         | Значение                                                                                                                          |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Version Details | Name/Summary/Description выше, Author Name, Category = Streamer Tools                                                             |
| Image Assets    | `assets/logo-100x100.png` (100×100), `assets/discovery-300x200.png` (300×200), `assets/screenshots/panel-1024x768.png` (1024×768) |
| Author Email    | твой email → подтвердить по письму; Support Email — можно тот же                                                                  |
| URLs            | EULA/ToS URL и Privacy Policy URL = `legal/` страницы (Фаза 1 в release-plan.md)                                                  |
| Capabilities    | Request Identity Link: No, Chat: No, конфигурация: Extensions Configuration Service                                               |
| Monetization    | Bits No, Subscription No                                                                                                          |
| Access          | Review-ок: Testing Allowlist очистить (после одобрения открыть всем)                                                              |
| Status          | Review Channel URL = твой канал; Walkthrough Guide из этого файла                                                                 |
