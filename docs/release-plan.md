# План выкладывания `doc-panel` на Twitch

## Фаза 0. Подготовка

1. Аккаунт Twitch с 2FA → dev.twitch.tv → расширение в Extensions Manager
   (получить Client ID).
2. Проверить незакрытое в `backlog.md`/`docs/plan.md` (вынос контента, деплой) —
   решить, что делаем до ревью.

## Фаза 1. Legal-документы (в этом репозитории, репо публичный)

1. Создать `legal/` с 3 вручную написанными HTML-страницами:
   - `privacy.html` — нет EBS/аналитики, JWT не покидает браузер; конфиг
     стримера (URL контента, порядок, скрытые) хранится в публичном Twitch
     Config Service (5 КБ); viewer грузит контент по URL, заданному стримером;
     channelId/userId из `onAuthorized` никуда не передаются.
   - `tos.html` — назначение, «как есть», отказ от ответственности за контент
     стримера.
   - `index.html` — ссылки на обе страницы (опц.).
2. GitHub → Settings → Pages → **Deploy from a branch** → `main`, folder `/` →
   Save. После этого сайт = `https://<owner>.github.io/twitch-doc-panel/`.
   - URL для консоли: `…/legal/privacy.html` и `…/legal/tos.html`.

## Фаза 2. Hosted Test (в консоли Extensions)

1. **Asset Hosting:** Type = Panel; Viewer Path `viewer.html`; Config Path
   `config.html`; Panel Height = 500.
2. **Files:** загрузить `app/doc-panel.zip` (пути в zip = путям выше).
3. **Monetization:** Bits No, Subscription No.
4. **Access:** внести `Testing Account Allowlist` (ID аккаунтов).
5. **CSP-поля** (`Allowlist for Image/Media/URL-Fetching Domains`): внести
   домен, с которого стримеры грузят контент. Пока контент-репо не публикуется —
   поставить домен, который будет на review-канале.
6. Активировать панель на тестовых каналах, проверить работу, перевести в Hosted
   Test.

## Фаза 3. Ревью (в консоли Extensions)

1. **Version Details:**
   - Name, Summary, Description, Author Name
   - General Category: **Streamer Tools**
   - Логотип 100×100, Discovery 300×200, скриншот 1024×768 (4:3, <10 MB) —
     `npm run assets` + `npm run screenshots`
   - Author Email (= письмо-верификация с Twitch) + Support Email
   - **Privacy Policy URL** и **EULA/ToS URL** = URL из Фазы 1
2. **Capabilities:** Request Identity Link No; Chat No; конфигурация =
   Extensions Configuration Service (+ версия broadcaster segment).
3. **Status при сабмите:**
   - `Extension Review Channel URL` — канал, где активирована панель
     (панель-only → канал не обязан быть live)
   - `Walkthrough Guide и Change Log` — текст: как конфигурируется (URL
     контент-репо в config), шаги проверки, changelog v0.2.0; пометить, что
     стример сам подставляет URL контента.

## Фаза 4. Релиз

1. После Approved → **Release** в консоли (после релиза версия неизменна,
   апдейты = новая версия → новое ревью).
2. Если Pending Action — править и ресабмитить; Rejected — терминально (Client
   ID аннулируется).

## Чек-лист полей в консоли (шпаргалка)

| Вкладка         | Обязательно                                                                                                         |
| --------------- | ------------------------------------------------------------------------------------------------------------------- |
| Asset Hosting   | Panel, viewer/config paths, высота 500                                                                              |
| Files           | zip версии                                                                                                          |
| Monetization    | No/No                                                                                                               |
| Access          | Testing Allowlist                                                                                                   |
| CSP             | Allowlist for Image/Media/URL-Fetching Domains                                                                      |
| Version Details | Name, Summary, Description, Author, Category=Streamer Tools, лого, discovery, скриншот, email, privacy URL, ToS URL |
| Capabilities    | Identity No, Chat No, Config Service                                                                                |
| Status          | Review Channel URL, Walkthrough Guide + changelog                                                                   |
