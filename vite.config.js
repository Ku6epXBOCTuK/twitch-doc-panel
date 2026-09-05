import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import basicSsl from '@vitejs/plugin-basic-ssl';

// Dev-сервер: обслуживает и /viewer.html, и /config.html на одном origin
// (Twitch требует один Base URI). HTTPS — обязательное требование Twitch.
export default defineConfig({
  plugins: [svelte(), basicSsl()],
  server: { port: 8080 },
});
