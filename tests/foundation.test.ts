import { describe, it, expect } from 'vitest';
import { formatRupiah } from '@/lib/money';
import { defaultCategories } from '@/lib/defaults';
describe('Fondasi mollad', () => {
  it('memformat rupiah tanpa pecahan', () => {
    expect(formatRupiah(1250000).replace(/\s/g, '')).toBe('Rp1.250.000');
  });
  it('menyediakan sembilan kategori unik', () => {
    expect(new Set(defaultCategories.map((c) => c[0])).size).toBe(9);
  });
});
