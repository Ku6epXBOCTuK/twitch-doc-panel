# DocPanel — тексты для ревью (Version Details / Status)

Все поля копируются в консоль Twitch как есть. Раздел «Скопировать в консоль» —
готовый текст на английском.

## Скопировать в консоль

### Name

```txt
DocPanel
```

### Summary

```txt
Show multiple documents in one Twitch panel: about, rules, schedule, FAQ. Markdown from your repo — no backend, no coding.
```

### Description

```txt
DocPanel turns a Twitch panel into a small channel notebook: several documents (about, rules, schedule, FAQ, links) that viewers flip through with prev/next.

Content is plain Markdown in a public GitHub repository, loaded directly through the jsDelivr CDN (cdn.jsdelivr.net/gh/...) — no GitHub Pages, no backend, no build step, no cost. Other content hosts are not supported.

How it works
1. Write docs as .md files: headings, lists, quotes, links, images.
2. Run the included build-docs tool to generate index.json.
3. In Extension Config paste your index.json URL and save.
4. Pin a tag or HEAD: @main, @v1.0 or @commit-hash — change ref to switch versions.
5. Push content updates to the repo; cache refreshes in a few hours (or use jsdelivr.com/tools/purge).

Features
- Multiple docs in one panel with a pager.
- Per-document banners.
- Reorder or hide docs from the config — no rebuild.
- Dark and light Twitch themes.
- No tracking; viewer and channel IDs never leave the browser.
```

### Категория

```txt
Streamer Tools
```

### Walkthrough Guide (Status → при сабмите на ревью)

```txt
Step 1. Open DocPanel config (Extension Manager → Configure).
Step 2. Paste the URL to an index.json that lists the channel documents. If the URL is missing, the panel shows a "content URL not set" hint.
Step 3. Click "Load list". The documents from index.json appear with their titles; the first one is shown in the panel preview.
Step 4. Drag to reorder or hide documents, then Save. The panel on the channel shows the first document and a prev/next pager.
Step 5. Verify: the panel displays the rendered document, arrows switch between documents, and the configuration persists after refresh.

Notes for the review team: this is a panel-only extension with no backend. It does not request identity, chat, or bits. The streamer supplies the content URL themselves; without it the panel shows an empty-hint state. The extension makes no network calls except loading the Markdown content and index from the streamer-provided URL.
```

### Changelog (v0.2.0)

```txt
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
