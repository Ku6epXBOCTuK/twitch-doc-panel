import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { viteSingleFile } from 'vite-plugin-singlefile';

// Конфиг-вью (панель управления в Creator Dashboard): отдельный самодостаточный HTML.
export default defineConfig({
  plugins: [svelte(), viteSingleFile()],
  build: {
    outDir: 'dist/config',
    emptyOutDir: true,
    rollupOptions: { input: 'config.html' },
  },
});
