import { fileURLToPath } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  // In dev the API port comes from server/.env, so client and server can never disagree.
  // In production the same /api paths are proxied to the server project by the rewrite in vercel.json.
  const env = loadEnv(mode, fileURLToPath(new URL('../server', import.meta.url)), '');
  const apiPort = env.PORT || '4010';

  return {
    plugins: [react(), tailwindcss()],
    server: {
      // Same-origin in dev, exactly like production, so guest session cookies behave identically.
      proxy: { '/api': `http://localhost:${apiPort}` },
    },
  };
});
