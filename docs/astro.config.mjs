import { defineConfig } from 'astro/config';
import theme from 'astro-theme-docs';
import yaml from '@rollup/plugin-yaml';

export default defineConfig({
  integrations: [theme()],
  vite: {
    plugins: [yaml()],
  },
});
