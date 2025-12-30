
export const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
};

// Mix color with white (tint) or black (shade)
const mix = (color: {r: number, g: number, b: number}, mixColor: {r: number, g: number, b: number}, weight: number) => {
  return {
    r: Math.round(color.r * (1 - weight) + mixColor.r * weight),
    g: Math.round(color.g * (1 - weight) + mixColor.g * weight),
    b: Math.round(color.b * (1 - weight) + mixColor.b * weight)
  };
};

const rgbToHex = (rgb: {r: number, g: number, b: number}) => {
  return "#" + ((1 << 24) + (rgb.r << 16) + (rgb.g << 8) + rgb.b).toString(16).slice(1);
};

export const generatePalette = (baseHex: string) => {
  const rgb = hexToRgb(baseHex);
  const white = { r: 255, g: 255, b: 255 };
  const black = { r: 0, g: 0, b: 0 };

  return {
    50: rgbToHex(mix(rgb, white, 0.95)),
    100: rgbToHex(mix(rgb, white, 0.9)),
    200: rgbToHex(mix(rgb, white, 0.75)),
    300: rgbToHex(mix(rgb, white, 0.6)),
    400: rgbToHex(mix(rgb, white, 0.3)),
    500: baseHex, // Base color is usually 500 or 600. Let's assume input is the primary brand color (approx 600)
    600: baseHex, // We'll use the input as 600 for strong contrast
    700: rgbToHex(mix(rgb, black, 0.1)),
    800: rgbToHex(mix(rgb, black, 0.2)),
    900: rgbToHex(mix(rgb, black, 0.3)),
  };
};
