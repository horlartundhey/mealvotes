import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Same-origin in dev, so guest session cookies behave exactly as they will on Vercel.
    proxy: { '/api': 'http://localhost:4010' },
  },
});
