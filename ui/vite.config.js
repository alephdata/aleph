import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import {
  IconSvgPaths16,
  IconSvgPaths20,
  iconNameToPathsRecordKey,
} from '@blueprintjs/icons';
import { SassString, SassColor, SassMap } from 'sass';

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
    css: {
      preprocessorOptions: {
        scss: {
          functions: {
            'svg-icon($path, $selectors: null)': svgIcon,
          },
        },
      },
    },
  };
});

// Blueprint internally uses a custom Sass function `svg-icon` [1] to inline
// icon SVGs to data URIs. In order to be able to build Blueprint from the SCSS
// source, we need to provide a reimplementation of this function to the Sass
// compiler. The implementation used by Blueprint [2] won’t work out of the box,
// as it relies on the raw SVG files which are not exported by `@blueprint/icons`.
// For this reason, the `svgIcon` function is implemented differently, using the
// SVG paths exported by `@blueprint/icons`.
//
// [1]: https://sass-lang.com/documentation/js-api/interfaces/Options#functions
// [2]: https://github.com/palantir/blueprint/blob/develop/packages/core/scripts/sass-custom-functions.js
function svgIcon([path, selectors]) {
  // Parse a string "16px/chevron-right.svg" into size (16) and a name (chevron-right).
  const { size, name } = path.text.match(
    /^(?<size>16|20)px\/(?<name>[a-z\-]+)\.svg$/
  )?.groups;

  // The `selectors` argument is a nested map that represents CSS rules. For example:
  // (path: (fill: '#000')). We try to find a `fill` property in the list and use that
  // in the SVG generated below.
  const fill = findFill(selectors);

  // Get the SVG path for requested icon size and name.
  const svgPaths = size === '16' ? IconSvgPaths16 : IconSvgPaths20;
  const svgPath = svgPaths[iconNameToPathsRecordKey(name)];

  // Assemble an icon SVG element and encode it as a data URI.
  const svg =
    `<svg viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">` +
    `<path fill-rule="evenodd" clip-rule="evenodd" fill="${fill}" d="${svgPath}" />` +
    `</svg>`;

  const value = `url('data:image/svg+xml,${encodeURIComponent(svg)}')`;

  return new SassString(value);
}

function findFill(map) {
  for (const [key, value] of map.contents) {
    if (key.text === 'fill' && value instanceof SassColor) {
      return `rgba(${value.red}, ${value.green}, ${value.blue}, ${value.alpha})`;
    }

    if (value instanceof SassMap) {
      const recursiveFill = findFill(value);

      if (recursiveFill !== null) {
        return recursiveFill;
      }
    }
  }

  return null;
}
