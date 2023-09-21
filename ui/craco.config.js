const {
  IconSvgPaths16,
  IconSvgPaths20,
  iconNameToPathsRecordKey,
} = require('@blueprintjs/icons');
const sass = require('sass');

const findFill = (map) => {
  for (let i = 0; i < map.getLength(); i++) {
    const key = map.getKey(i).getValue();
    const value = map.getValue(i);

    if (key === 'fill' && value instanceof sass.types.Color) {
      return `rgba(${value.getR()}, ${value.getG()}, ${value.getB()}, ${value.getA()})`;
    }

    if (value instanceof sass.types.Map) {
      const recursiveFill = findFill(value);

      if (recursiveFill !== null) {
        return recursiveFill;
      }
    }
  }

  return null;
};

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

const svgIcon = (path, selectors) => {
  // Parse a string "16px/chevron-right.svg" into size (16) and a name (chevron-right).
  const { size, name } = path
    .getValue()
    .match(/^(?<size>16|20)px\/(?<name>[a-z\-]+)\.svg$/)?.groups;

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

  return new sass.types.String(value);
};

module.exports = {
  style: {
    sass: {
      implementation: sass,
      loaderOptions: (options) => ({
        ...options,
        implementation: sass,
        sassOptions: {
          functions: {
            'svg-icon($path, $selectors: null)': svgIcon,
          },
        },
      }),
    },
  },
};
