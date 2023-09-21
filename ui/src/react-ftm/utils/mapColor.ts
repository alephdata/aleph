import { Colors } from '@blueprintjs/core';

// Blueprint 4 comes with an updated color palette that has been
// improved for better accessibility. As a result, the darkest shades
// (e.g. Blue 1) are darker in BP4 compared to BP3. That makes them look
// kinda dull when used in network diagram, so we’re now using the second
// darkest shade (e.g. Blue 2).
//
// This mapping ensures that we render vertices using the new colors,
// even if they have been created when we still used Blueprint 3 colors
// or the darkest shade of the Blueprint 4 colors.

const COLOR_MAPPING: {
  [key: string]: string;
} = {
  // Map Blueprint 3 colors to Blueprint 4 colors
  // Example: BP3 Blue 1 => BP4 Blue 2
  '#0E5A8A': Colors.BLUE2,
  '#A82A2A': Colors.RED2,
  '#0A6640': Colors.GREEN2,
  '#A66321': Colors.ORANGE2,
  '#5C255C': Colors.VIOLET2,
  '#008075': Colors.TURQUOISE2,

  // Map Blueprint 4 colors to lighter shade
  // Example: BP4 Blue 1 => BP Blue 2
  '#184A90': Colors.BLUE2,
  '#8E292C': Colors.RED2,
  '#77450D': Colors.ORANGE2,
  '#165A36': Colors.GREEN2,
  // Violet colors haven’t changed from BP3 to BP4
  '#004D46': Colors.TURQUOISE2,
};

export function mapColor(color: string) {
  return COLOR_MAPPING[color] || color;
}
