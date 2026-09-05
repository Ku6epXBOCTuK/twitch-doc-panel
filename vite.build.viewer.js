import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { viteSingleFile } from 'vite-plugin-singlefile';

// Вьювер-панель: один самодостаточный HTML без внешних js/css.
export default defineConfig({
  plugins: [svelte(), viteSingleFile()],
  build: {
    outDir: 'dist/viewer',
    emptyOutDir: true,
    rollupOptions: { input: 'viewer.html' },
  },
});
