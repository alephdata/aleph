import { defineConfig } from 'astro/config';
import theme from 'astro-theme-docs';

export default defineConfig({
  integrations: [theme()],
});
