import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    // Proxy /api to the FastAPI backend. The target is the server ROOT,
    // not .../api, otherwise requests would arrive as /api/api. 127.0.0.1
    // rather than localhost: on Windows Node resolves localhost to IPv6
    // first while uvicorn listens on IPv4, which causes ECONNREFUSED.
    proxy: {
      '/api': 'http://127.0.0.1:8000',
    },
  },
});
