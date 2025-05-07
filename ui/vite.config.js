import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(() => {
  return {
    server: {
      port: 8080,
      host: true,
      proxy: {
        '/api': 'http://api:5000',
      },
    },
    build: {
      outDir: 'build',
    },
    plugins: [react()],
  };
});
