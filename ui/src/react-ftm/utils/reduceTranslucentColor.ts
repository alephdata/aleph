type RgbColor = { r: number; g: number; b: number };

function hexToRgb(hex: string): null | RgbColor {
  const matches = hex.match(/^#([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);

  if (!matches) {
    return null;
  }

  return {
    r: parseInt(matches[1], 16),
    g: parseInt(matches[2], 16),
    b: parseInt(matches[3], 16),
  };
}

function rgbToHex(rgb: RgbColor): string {
  const hex = Object.values(rgb)
    .map((component) => component.toString(16).padStart(2, '0'))
    .join('');

  return `#${hex}`;
}

// Calculate the HEX representation for a color as if
// it was rendered on a white background
export function reduceTranslucentColor(
  hex: string,
  opacity: number
): null | string {
  const color = hexToRgb(hex);
  const white = { r: 255, g: 255, b: 255 };

  if (!color) {
    return null;
  }

  const reducedRgb = {
    r: Math.round(opacity * color.r + (1 - opacity) * white.r),
    g: Math.round(opacity * color.g + (1 - opacity) * white.g),
    b: Math.round(opacity * color.b + (1 - opacity) * white.b),
  };

  return rgbToHex(reducedRgb);
}
