---
title: About
order: 1
---

**DocPanel** is a Twitch extension that turns one 318×500 channel panel into a
small notebook with several documents viewers flip through.

## What you get

- Several documents in **one panel** with a prev/next pager
- Content is plain **Markdown** from your own repo — no backend, no coding
- Per-document banners, order and hide via config — no rebuild needed
- Fits dark and light Twitch themes

## How it works

1. Write documents as `.md` files (GitHub, Gitea, any HTTPS host).
2. Run `build-docs` to generate `index.json`.
3. Paste the `index.json` URL in the panel config and save.

> The panel loads your Markdown directly — no tracking, no ads.

## Supported Markdown

- Headings, **bold**, _italic_, ~~strike~~, `inline code`
- Lists and checkboxes, links, images, quotes
