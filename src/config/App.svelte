<script>
  import { onBroadcasterConfig, saveBroadcasterConfig } from '../shared/twitch.js';
  import { isContentUrl, initialIndexUrl } from '../shared/content.js';

  // Конфиг приходит асинхронно — заполняем поле, когда доедет.
  let savedCfg = $state({});

  let indexUrl = $state('');
  let list = $state([]);
  let status = $state('idle'); // idle | loading | ready | error
  let error = $state('');
  let savedOk = $state(false);

  onBroadcasterConfig((c) => {
    savedCfg = c ?? {};
    if (!indexUrl) {
      const url = initialIndexUrl(c);
      if (url) {
        indexUrl = url;
        load();
      }
    }
  });

  async function load() {
    savedOk = false;
    error = '';
    const url = indexUrl.trim();
    if (!url) {
      error = 'Укажи ссылку на index.json';
      return;
    }
    if (!isContentUrl(url)) {
      error = 'Ссылка должна быть http(s) URL или относительным путём';
      return;
    }
    status = 'loading';
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const index = await res.json();
      if (!Array.isArray(index)) throw new Error('ожидался массив документов');
      const hidden = new Set(savedCfg.hidden ?? []);
      const order = new Map((savedCfg.order ?? []).map((id, i) => [id, i]));
      list = index
        .filter((d) => !d.hidden)
        .map((d) => ({ id: d.id, title: d.title, hidden: hidden.has(d.id) }))
        .sort((a, b) => (order.get(a.id) ?? Infinity) - (order.get(b.id) ?? Infinity));
      status = 'ready';
    } catch (e) {
      console.error(e);
      error = String(e.message ?? e);
      status = 'error';
    }
  }

  function move(i, dir) {
    const j = i + dir;
    if (j < 0 || j >= list.length) return;
    [list[i], list[j]] = [list[j], list[i]];
  }

  function save() {
    savedOk = saveBroadcasterConfig({
      v: 1,
      indexUrl: indexUrl.trim(),
      hidden: list.filter((d) => d.hidden).map((d) => d.id),
      order: list.map((d) => d.id),
    });
  }
</script>

<div class="config">
  <h1>Панель управления</h1>

  <label class="field">
    <span class="label">Ссылка на index.json</span>
    <input
      type="text"
      bind:value={indexUrl}
      placeholder="https://…/index.json"
      onkeydown={(e) => e.key === 'Enter' && load()}
    />
  </label>
  <p class="muted hint">Абсолютный http(s) URL (например, GitHub Pages или jsDelivr) или путь рядом с виджетом.</p>
  <button onclick={load}>Загрузить список</button>

  {#if status === 'loading'}
    <p class="muted">Загрузка…</p>
  {:else if status === 'error'}
    <p class="err">{error}</p>
  {:else if status === 'ready'}
    {#each list as doc, i (doc.id)}
      <div class="row">
        <span class="title">{doc.title}</span>
        <span class="controls">
          <button title="Выше" onclick={() => move(i, -1)} disabled={i === 0}>↑</button>
          <button title="Ниже" onclick={() => move(i, 1)} disabled={i === list.length - 1}>↓</button>
          <label>
            <input type="checkbox" bind:checked={doc.hidden} />
            скрыть
          </label>
        </span>
      </div>
    {:else}
      <p class="muted">Список пуст: добавь .md файлы в репозиторий контента.</p>
    {/each}

    <div class="save">
      <button onclick={save}>Сохранить</button>
      {#if savedOk}
        <span class="ok">Сохранено</span>
      {/if}
    </div>
  {:else if error}
    <p class="err">{error}</p>
  {/if}
</div>

<style>
  .config {
    font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
    color: #efeff1;
    background: #0e0e10;
    min-height: 100vh;
    box-sizing: border-box;
    padding: 16px;
    max-width: 640px;
  }
  h1 {
    font-size: 1.2em;
  }
  .muted {
    color: #adadb8;
  }
  .err {
    color: #ff8a8a;
  }
  .ok {
    color: #00f593;
  }
  .field {
    display: block;
    margin: 10px 0 4px;
  }
  .label {
    display: block;
    font-size: 0.85em;
    color: #adadb8;
    margin-bottom: 4px;
  }
  input[type='text'] {
    width: 100%;
    box-sizing: border-box;
    background: #1f1f23;
    color: #efeff1;
    border: 1px solid #3a3a3d;
    border-radius: 6px;
    padding: 8px 10px;
    font-size: 0.95em;
  }
  .hint {
    font-size: 0.8em;
    margin: 4px 0 10px;
  }
  button {
    background: #3a3a3d;
    color: #efeff1;
    border: 0;
    border-radius: 6px;
    height: 30px;
    min-width: 28px;
    padding: 0 12px;
    cursor: pointer;
  }
  button:hover {
    filter: brightness(1.2);
  }
  .row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
    padding: 8px 10px;
    border: 1px solid #3a3a3d;
    border-radius: 6px;
    margin-top: 6px;
  }
  .controls {
    display: flex;
    align-items: center;
    gap: 6px;
    white-space: nowrap;
  }
  .controls label {
    font-size: 0.85em;
    color: #adadb8;
  }
  .save {
    margin-top: 12px;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .save button {
    min-width: 100px;
    height: 32px;
  }
</style>
