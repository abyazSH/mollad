import { describe, expect, it } from 'vitest';
import {
  categoryColorStyle,
  categoryPalette,
  colorContrast,
} from '@/lib/category-colors';

describe('Warna kategori sesuai tema', () => {
  it.each([
    '#000000',
    '#FFFFFF',
    '#193932',
    '#46B4A0',
    '#FFA6C1',
    '#FFFF00',
    '#0000FF',
    '#8B5CF6',
    '#3B82F6',
    '#64748B',
  ])('menjaga kontras penanda minimal 3:1 untuk %s', (base) => {
    const palette = categoryPalette(base);
    expect(colorContrast(palette.light, '#FFFFFF')).toBeGreaterThanOrEqual(3);
    expect(colorContrast(palette.dark, '#193932')).toBeGreaterThanOrEqual(3);
    expect(colorContrast(palette.dark, '#102D28')).toBeGreaterThanOrEqual(3);
    expect(colorContrast(palette.dark, '#151316')).toBeGreaterThanOrEqual(3);
    expect(colorContrast(palette.dark, '#09090B')).toBeGreaterThanOrEqual(3);
    expect(palette.light).toMatch(/^#[0-9A-F]{6}$/);
    expect(palette.dark).toMatch(/^#[0-9A-F]{6}$/);
  });
  it('mencerahkan warna gelap dan memakai fallback untuk input tidak valid', () => {
    expect(categoryPalette('#193932').dark).not.toBe('#193932');
    expect(categoryPalette('invalid')).toEqual(categoryPalette('#46B4A0'));
    expect(categoryPalette('#46b4a0')).toEqual(categoryPalette('#46B4A0'));
  });
  it('memakai satu pasangan warna yang konsisten untuk diagram dan penanda', () => {
    const base = '#8B5CF6';
    const palette = categoryPalette(base);
    expect(categoryColorStyle(base)).toEqual({
      '--category-light': palette.light,
      '--category-dark': palette.dark,
    });
    expect(base).toBe('#8B5CF6');
  });
});
