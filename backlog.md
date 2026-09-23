# Беклог

## Общее

- [ ] выложить на twitch, настроить, проверить
- [ ] когда опять будет висящая задача esbuild\node - выяснить откуда она
      взялась
- [ ] использовать # для приватных полей (линтер?)

## Просмотрщик

- [ ] данные не кешируются, md и картинки запрашиваются заново
- [ ] заранее загружать соседние документы и картинки? улучшит UX
- [ ] viewer status need to be a guard for other fields - currentDoc and doc
- [ ] fix scroll shadow
- [ ] fix dark\light theme for viewer
- [ ] auto change to next doc at progress bar
- [ ] setup time for progress bar animation (also in config)
- [ ] cycle change docs - last + next = first and vice versa

## Страница конфигурации

- [ ] придумать UI\UX, кнопку save наверх
- [ ] добавить возможность настройки заголовка
- [ ] исправить описание - загрузка только с jsDelivr
- [ ] config-state - use direction enum instead of number
- [ ] does config page depends of dark\light theme? fix it

## Билдер

- [ ] игнорирование файлов. наверное лучше сделать ignore файл, чтобы можно было
      написать readme.md, но игнорировать его
- [ ] автоматически добавлять файл .nojekyll
- [ ] сделать настройку order более очевидной (z-index?)
- [ ] ресайзить баннеры под нужный размер - 318px в ширину
- [ ] анимация баннера, например 2 варианта картинки - en и ru

## Вопросы на будущее

- [ ] svelte-check не поддерживает TS7, обновиться, когда будет возможность
- [ ] загружать два варианта картинки, для светлой и темной темы?
