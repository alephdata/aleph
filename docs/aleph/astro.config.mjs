import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';
import react from '@astrojs/react';

// https://astro.build/config
import mdx from "@astrojs/mdx";

// https://astro.build/config
export default defineConfig({
  integrations: [
  // Enable Preact to support Preact JSX components.
  preact(),
  // Enable React for the Algolia search component.
  react(), mdx()],
  site: `http://astro.build`,
  vite: {
    ssr: {
      noExternal: ["@astro-community/astro-embed-youtube"]
    }
  }
});