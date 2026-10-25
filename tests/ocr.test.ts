import { describe, expect, it } from 'vitest';
import sharp from 'sharp';
import fixtures from './fixtures/receipts.json';
import {
  parseReceipt,
  parseRupiah,
  receiptDate,
  lowConfidenceFields,
} from '@/lib/ocr/parser';
import { detectImageMime, prepareImage, MAX_UPLOAD } from '@/lib/ocr/images';
import { normalizeMerchant } from '@/lib/duplicates';
describe('Parser struk Indonesia', () => {
  it.each(fixtures)('%s', (_name, text, total, date, category) => {
    const data = parseReceipt(String(text));
    expect(data.total).toBe(total);
    expect(data.tanggal).toBe(date);
    expect(data.kategori_saran).toBe(category);
  });
  it('menangani ribuan/desimal rupiah', () => {
    expect(parseRupiah('Rp 1.250.000')).toBe(1250000);
    expect(parseRupiah('1.250,00')).toBe(1250);
    expect(parseRupiah('1250.00')).toBe(1250);
    expect(parseRupiah('25,000')).toBe(25000);
    expect(parseRupiah('1,250,000.00')).toBe(1250000);
  });
  it.each([
    [
      'KOPI PAGI\n25.10.2026\nT0TAL Rp 25.OOO\nTUNAI 50.000',
      25000,
      '2026-10-25',
    ],
    ['KOPI PAGI\n2026-10-25\nTOTAL IDR 25,000.00', 25000, '2026-10-25'],
    ['KOPI PAGI\n25-Oct-26\nGRAND TOTAL\nRp\n25.000', 25000, '2026-10-25'],
    ['KOPI PAGI\n25 / 10 / 2026\nTOTAL 25 000', 25000, '2026-10-25'],
  ])(
    'mengenali variasi label, nominal, dan tanggal pada %s',
    (text, total, date) => {
      const data = parseReceipt(String(text));
      expect(data.total).toBe(total);
      expect(data.tanggal).toBe(date);
    },
  );
  it('tidak mengambil uang tunai ketika nominal setelah label total hilang', () => {
    expect(
      parseReceipt('KOPI PAGI\nTOTAL\nTUNAI 50.000\nKEMBALI 25.000').total,
    ).toBe(0);
  });
  it('mengekstrak pajak dan item', () => {
    const data = parseReceipt(String(fixtures[2][1]));
    expect(data.pajak).toBe(5500);
    expect(data.items).toEqual([{ nama: 'Nasi', qty: 2, harga: 25000 }]);
  });
  it('menolak tanggal kalender semu', () =>
    expect(receiptDate('31/02/2026')).toBeNull());
  it('mengarahkan teks kosong atau rusak ke manual tanpa mengarang total', () => {
    expect(parseReceipt('').confidence).toBe(0);
    const data = parseReceipt('teks buram', 0.1);
    expect(data.total).toBe(0);
    expect(lowConfidenceFields(data)).toContain('total');
    expect(data.tanggal).toBeNull();
  });
  it('tidak memilih jumlah uang tunai atau total item', () =>
    expect(
      parseReceipt(
        'TOKO\n01/10/2026\nTOTAL ITEM 99\nTOTAL 35.000\nTUNAI 1.000.000',
      ).total,
    ).toBe(35000));
  it('menormalkan merchant untuk deteksi duplikat', () =>
    expect(normalizeMerchant('  Kopi   PAGI  ')).toBe('kopi pagi'));
});
describe('Validasi foto', () => {
  it('menolak file palsu dan SVG', async () => {
    expect(detectImageMime(Buffer.from('<svg/>'))).toBeNull();
    await expect(
      prepareImage(Buffer.from('bukan foto'), 'image/jpeg'),
    ).rejects.toThrow();
  });
  it('menolak file lebih dari 8 MB', async () =>
    await expect(
      prepareImage(Buffer.alloc(MAX_UPLOAD + 1), 'image/png'),
    ).rejects.toThrow('8 MB'));
  it('memeriksa MIME sebenarnya dan merender ulang foto', async () => {
    const image = await sharp({
      create: { width: 20, height: 20, channels: 3, background: '#fff' },
    })
      .png()
      .toBuffer();
    await expect(prepareImage(image, 'image/jpeg')).rejects.toThrow();
    const result = await prepareImage(image, 'image/png');
    expect(detectImageMime(result.original)).toBe('image/jpeg');
    expect((await sharp(result.processed).metadata()).format).toBe('png');
  });
});
