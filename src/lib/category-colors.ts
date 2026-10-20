import type { CSSProperties } from 'react';

function rgb(hex: string) {
  const value = /^#[0-9a-f]{6}$/i.test(hex) ? hex : '#46B4A0';
  return [1, 3, 5].map((offset) =>
    parseInt(value.slice(offset, offset + 2), 16),
  );
}
function mix(color: number[], target: number, amount: number) {
  return color.map((channel) =>
    Math.round(channel + (target - channel) * amount),
  );
}
function hex(color: number[]) {
  return (
    '#' +
    color
      .map((channel) => channel.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase()
  );
}
function luminance(color: number[]) {
  const channels = color.map((channel) => {
    const value = channel / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}
export function colorContrast(first: string, second: string) {
  const a = luminance(rgb(first)),
    b = luminance(rgb(second));
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

export function categoryPalette(base: string) {
  const color = rgb(base);
  // Softened colors keep the same identity; adjust only as far as contrast needs.
  let light = mix(color, 255, 0.12);
  let dark = mix(color, 255, 0.35);
  for (
    let amount = 0;
    colorContrast(hex(light), '#FFFFFF') < 3 && amount <= 1;
    amount += 0.02
  )
    light = mix(color, 0, amount);
  for (
    let amount = 0.35;
    colorContrast(hex(dark), '#193932') < 3 && amount <= 1;
    amount += 0.02
  )
    dark = mix(color, 255, amount);
  return { light: hex(light), dark: hex(dark) };
}

export function categoryColorStyle(base: string): CSSProperties {
  const palette = categoryPalette(base);
  return {
    '--category-light': palette.light,
    '--category-dark': palette.dark,
  } as CSSProperties;
}
