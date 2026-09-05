<script>
  import { isTwitch, getBroadcasterConfig, saveBroadcasterConfig } from '../shared/twitch.js';
  import { INDEX_URL } from '../shared/content.js';

  let list = $state([]); // рабочая копия: { id, title, hidden }
  let status = $state('loading'); // loading | ready | error
  let error = $state('');
  let saved = $state(false);

  const savedCfg = getBroadcasterConfig();

  async function load() {
    status = 'loading';
    error = '';
    try {
      const res = await fetch(INDEX_URL);
      if (!res.ok) throw new Error(`index.json: HTTP ${res.status}`);
      const index = await res.json();
      const hidden = new Set(savedCfg?.hidden ?? []);
      const order = new Map((savedCfg?.order ?? []).map((id, i) => [id, i]));
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

  load();

  function move(i, dir) {
    const j = i + dir;
    if (j < 0 || j >= list.length) return;
    [list[i], list[j]] = [list[j], list[i]];
  }

  function save() {
    saved = saveBroadcasterConfig({
      v: 1,
      hidden: list.filter((d) => d.hidden).map((d) => d.id),
      order: list.map((d) => d.id),
    });
  }
</script>

<div class="config">
  <h1>Документы панели</h1>
  <p class="muted">Порядок и видимость для этого канала. Содержимое документов правится в git-репозитории.</p>

  {#if status === 'loading'}
    <p class="muted">Загрузка…</p>
  {:else if status === 'error'}
    <p>Не удалось загрузить index.json.</p>
    <p class="muted">{error}</p>
    <button onclick={load}>Повторить</button>
  {:else}
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
      <p class="muted">Список пуст: соберите контент билдером и сделайте push.</p>
    {/each}

    <div class="save">
      <button onclick={save}>Сохранить</button>
      {#if saved}
        <span class="ok">Сохранено</span>
      {:else if !isTwitch}
        <span class="muted">Локальный режим: сохранение доступно только в Creator Dashboard.</span>
      {/if}
    </div>
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
  .row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
    padding: 8px 10px;
    border: 1px solid #3a3a3d;
    border-radius: 6px;
    margin-bottom: 6px;
  }
  .controls {
    display: flex;
    align-items: center;
    gap: 6px;
    white-space: nowrap;
  }
  label {
    font-size: 0.85em;
    color: #adadb8;
  }
  button {
    background: #3a3a3d;
    color: #efeff1;
    border: 0;
    border-radius: 6px;
    height: 28px;
    min-width: 28px;
    cursor: pointer;
  }
  button:hover {
    filter: brightness(1.2);
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
  .ok {
    color: #00f593;
  }
</style>
