// Конфиг Svelte для тулчейна (Svelte LS в VSCode, svelte-check). Препроцессоров
// нет — компилятору достаточно дефолтов. Сам файл нужен, чтобы Svelte LS не
// пытался вытащить опции из vite.config.js: тот собирается без ожидаемого LS
// сабплагина «vite-plugin-svelte:config» (появился в vite-plugin-svelte v6,
// в проекте v5) — без этого файла LS сыплет «Error in vite.config: No Svelte
// configuration found...» в Problems.
export default {
	compilerOptions: {},
};
