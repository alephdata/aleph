import path from 'node:path';
import url from 'node:url';
import { defineConfig } from 'astro/config';
import yaml from '@rollup/plugin-yaml';
import theme, { injectComponent } from 'astro-theme-docs';

const root = path.dirname(url.fileURLToPath(import.meta.url));
const base = path.join(root, 'src/components');

export default defineConfig({
  experimental: {
    redirects: true,
  },
  redirects: {
    '/how-aleph-is-used': '/about',
    '/guide': '/users',
    '/guide/getting-started': '/users',
    '/guide/the-basics': '/users/getting-started/key-terms/',
    '/guide/search': '/users/search/basics/',
    '/guide/search/anatomy-of-a-search': '/users/search/basics',
    '/guide/search/advanced-search-methods': '/users/search/advanced',
    '/guide/search/filtering-your-search-results': '/users/search/basics#filtering-results',
    '/guide/search/searching-within-other-contexts': '/users/search/datasets',
    '/guide/search/searching-for-a-dataset': '/users/search/datasets',
    '/guide/building-out-your-investigation': '/users/investigations/overview',
    '/guide/building-out-your-investigation/creating-an-investigation': '/users/investigations/create',
    '/guide/building-out-your-investigation/uploading-documents': '/users/investigations/uploading-documents',
    '/guide/building-out-your-investigation/network-diagrams': '/users/investigations/network-diagrams',
    '/guide/building-out-your-investigation/using-the-table-editor': '/users/investigations/entity-editor',
    '/guide/building-out-your-investigation/generating-multiple-entities-from-a-list': '/users/investigations/cross-referencing#generating-entities-from-yourspreadsheet',
    '/guide/building-out-your-investigation/cross-referencing': '/users/investigations/cross-referencing',
    '/guide/reconciliation': '/users/advanced/reconciliation',
  },
  integrations: [
    theme({
      remarkPlugins: [
        injectComponent('Annotations', path.join(base, 'Annotations.astro'), 'default'),
        injectComponent('Annotation', path.join(base, 'Annotation.astro'), 'default'),
        injectComponent('AnnotationRef', path.join(base, 'AnnotationRef.astro'), 'default'),
        injectComponent('VideoTutorial', path.join(base, 'VideoTutorial.astro'), 'default'),
      ],
    }),
  ],
  vite: {
    plugins: [yaml()],
  },
});
