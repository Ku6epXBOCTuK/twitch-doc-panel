<script>
  import { onContext, getBroadcasterConfig } from '../shared/twitch.js';
  import { INDEX_URL } from '../shared/content.js';
  import DocRenderer from '../shared/DocRenderer.svelte';

  let theme = $state('dark');
  onContext((ctx) => {
    if (ctx.theme) theme = ctx.theme;
  });

  let docs = $state([]);
  let current = $state(0);
  let status = $state('loading'); // loading | ready | empty | error
  let loadError = $state('');
  let doc = $state(null);
  let docError = $state('');

  // Per-channel исключения из конфиг-сегмента: скрыть/перепорядочить.
  const overrides = getBroadcasterConfig();

  async function loadIndex() {
    status = 'loading';
    loadError = '';
    try {
      const res = await fetch(INDEX_URL);
      if (!res.ok) throw new Error(`index.json: HTTP ${res.status}`);
      let list = await res.json();
      if (overrides) {
        const hidden = new Set(overrides.hidden ?? []);
        const order = new Map((overrides.order ?? []).map((id, i) => [id, i]));
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

  async function loadDoc(i) {
    current = i;
    doc = null;
    docError = '';
    try {
      const res = await fetch(docs[i].url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      doc = await res.json();
    } catch (e) {
      console.error(e);
      docError = String(e.message ?? e);
    }
  }

  const prev = () => current > 0 && loadDoc(current - 1);
  const next = () => current < docs.length - 1 && loadDoc(current + 1);

  loadIndex();
</script>

<div class="panel" data-theme={theme}>
  {#if status === 'loading'}
    <p class="muted center">Загрузка…</p>
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
