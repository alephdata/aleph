import path from 'node:path';
import url from 'node:url';
import { defineConfig } from 'astro/config';
import theme, { injectComponent } from 'astro-theme-docs';

const root = path.dirname(url.fileURLToPath(import.meta.url));
const base = path.join(root, 'src/components');

export default defineConfig({
  integrations: [
    theme({
      mdxPlugins: [
        injectComponent('Annotations', path.join(base, 'Annotations.astro'), 'default'),
        injectComponent('Annotation', path.join(base, 'Annotation.astro'), 'default'),
        injectComponent('AnnotationRef', path.join(base, 'AnnotationRef.astro'), 'default'),
        injectComponent('VideoTutorial', path.join(base, 'VideoTutorial.astro'), 'default'),
      ],
    }),
  ],
});
