<script>
  import { onContext, onBroadcasterConfig } from '../shared/twitch.js';
  import { isAllowedUrl, DEFAULT_INDEX_URL } from '../shared/content.js';
  import { mdToBlocks } from '../shared/md.js';
  import DocRenderer from '../shared/DocRenderer.svelte';

  let theme = $state('dark');
  onContext((ctx) => {
    if (ctx.theme) theme = ctx.theme;
  });

  // Конфиг канала: {v:1, indexUrl, hidden:[], order:[]} — приходит асинхронно
  // и меняется при сохранении в config-вью; подписка ловит оба случая.
  let cfg = null;
  let lastCfgJson = '';

  let docs = $state([]);
  let current = $state(0);
  let status = $state('loading'); // loading|ready|empty|error|need-config|bad-host
  let loadError = $state('');
  let doc = $state(null);
  let docError = $state('');

  function resolveIndexUrl() {
    if (cfg?.indexUrl) {
      if (!isAllowedUrl(cfg.indexUrl)) {
        loadError = cfg.indexUrl;
        status = 'bad-host';
        return null;
      }
      return cfg.indexUrl;
    }
    if (DEFAULT_INDEX_URL && isAllowedUrl(DEFAULT_INDEX_URL)) return DEFAULT_INDEX_URL;
    status = 'need-config';
    return null;
  }

  onBroadcasterConfig((c) => {
    const json = JSON.stringify(c ?? null);
    if (json === lastCfgJson) return;
    lastCfgJson = json;
    cfg = c;
    const indexUrl = resolveIndexUrl();
    if (indexUrl) loadIndex(indexUrl);
  });

  async function loadIndex(indexUrl) {
    status = 'loading';
    loadError = '';
    try {
      const res = await fetch(indexUrl);
      if (!res.ok) throw new Error(`index.json: HTTP ${res.status}`);
      // res.url учитывает редиректы: относительные пути — от фактического адреса индекса
      const base = new URL('.', res.url).href;
      let list = await res.json();
      if (!Array.isArray(list)) throw new Error('index.json: ожидался массив');
      list = list.map((d) => ({
        ...d,
        url: new URL(d.url, base).href,
        header: d.header ? new URL(d.header, base).href : null,
      }));
      if (cfg) {
        const hidden = new Set(cfg.hidden ?? []);
        const order = new Map((cfg.order ?? []).map((id, i) => [id, i]));
        list = list.filter((d) => !hidden.has(d.id));
        list.sort((a, b) => (order.get(a.id) ?? Infinity) - (order.get(b.id) ?? Infinity));
      }
      docs = list;
      if (!list.length) {
        status = 'empty';
        return;
      }
      status = 'ready';
      await loadDoc(0);
    } catch (e) {
      console.error(e);
      loadError = String(e.message ?? e);
      status = 'error';
    }
  }

  // Относительные пути картинок/ссылок из .md резолвим от адреса самого файла.
  function absolutize(n, base) {
    if (typeof n === 'string' || !Array.isArray(n)) return n;
    const [tag, ...rest] = n;
    if (
      (tag === 'img' || tag === 'a') &&
      typeof rest[0] === 'string' &&
      !/^https?:\/\//i.test(rest[0])
    ) {
      return [tag, new URL(rest[0], base).href, ...rest.slice(1)];
    }
    return [tag, ...rest.map((x) => absolutize(x, base))];
  }

  async function loadDoc(i) {
    current = i;
    doc = null;
    docError = '';
    try {
      const res = await fetch(docs[i].url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const docBase = new URL('.', res.url).href;
      const blocks = mdToBlocks(await res.text()).map((b) => absolutize(b, docBase));
      doc = { title: docs[i].title, blocks };
    } catch (e) {
      console.error(e);
      docError = String(e.message ?? e);
    }
  }

  const prev = () => current > 0 && loadDoc(current - 1);
  const next = () => current < docs.length - 1 && loadDoc(current + 1);
</script>

<div class="panel" data-theme={theme}>
  {#if status === 'loading'}
    <p class="muted center">Загрузка…</p>
  {:else if status === 'need-config'}
    <p class="center">Ссылка на контент не задана.</p>
    <p class="muted center">
      Открой панель управления расширением и укажи ссылку на index.json.
    </p>
  {:else if status === 'bad-host'}
    <p class="center">Хост контента не в белом списке.</p>
    <p class="muted center">{loadError}</p>
  {:else if status === 'error'}
    <p class="center">Не удалось загрузить документы.</p>
    <p class="muted center">{loadError}</p>
    <p class="center"><button onclick={loadIndex}>Повторить</button></p>
  {:else if status === 'empty'}
    <p class="muted center">Документов пока нет.</p>
  {:else}
    {#if docs[current]?.header}
      <img class="header" src={docs[current].header} alt="" />
    {/if}
    <main>
      <h1 class="title">{doc?.title ?? docs[current].title}</h1>
      {#if docError}
        <p class="muted">Не удалось загрузить документ ({docError}).</p>
      {:else if doc}
        <DocRenderer nodes={doc.blocks} />
      {:else}
        <p class="muted">Загрузка…</p>
      {/if}
    </main>
    {#if docs.length > 1}
      <nav>
        <button onclick={prev} disabled={current === 0} aria-label="Предыдущий документ">‹</button>
        <span class="counter">{current + 1} / {docs.length}</span>
        <button onclick={next} disabled={current === docs.length - 1} aria-label="Следующий документ">›</button>
      </nav>
    {/if}
  {/if}
</div>

<style>
  .panel {
    height: 100%;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    padding: 10px;
    gap: 8px;
    /* Тема приходит из Twitch (onContext) */
    --text: #efeff1;
    --muted: #adadb8;
    --border: #3a3a3d;
    --link: #bf94ff;
    color: var(--text);
  }
  .panel[data-theme='light'] {
    --text: #0e0e10;
    --muted: #53535f;
    --border: #dcdde1;
    --link: #6441a5;
  }
  .header {
    width: 100%;
    height: 150px;
    object-fit: cover;
    border-radius: 6px;
    flex-shrink: 0;
  }
  main {
    flex: 1;
    overflow-y: auto;
    min-height: 0;
    padding-right: 2px;
  }
  .title {
    font-size: 1.1em;
    margin: 0 0 0.4em;
  }
  .muted {
    color: var(--muted);
  }
  .center {
    text-align: center;
  }
  nav {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    border-top: 1px solid var(--border);
    padding-top: 6px;
  }
  .counter {
    color: var(--muted);
    font-size: 0.85em;
    min-width: 48px;
    text-align: center;
  }
  button {
    background: var(--border);
    color: var(--text);
    border: 0;
    border-radius: 6px;
    min-width: 32px;
    height: 28px;
    font-size: 1.1em;
    cursor: pointer;
  }
  button:hover:not(:disabled) {
    filter: brightness(1.2);
  }
  button:disabled {
    opacity: 0.4;
    cursor: default;
  }
</style>
