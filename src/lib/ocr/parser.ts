import { isoDate } from '@/lib/dates';
import { MAX_AMOUNT } from '@/lib/money';
import { emptyReceipt, receiptSchema, type ReceiptData } from './schema';
export function parseRupiah(text: string): number {
  let clean = text.replace(/Rp\.?/gi, '').replace(/[^\d.,]/g, '');
  if (clean.includes(',')) clean = clean.split(',')[0].replace(/\./g, '');
  else if (/\.\d{2}$/.test(clean) && !/\.\d{3}\./.test(clean))
    clean = clean.slice(0, -3).replace(/\./g, '');
  else clean = clean.replace(/\./g, '');
  const value = Number(clean);
  return Number.isSafeInteger(value) && value >= 0 && value <= MAX_AMOUNT
    ? value
    : 0;
}
export function suggestCategory(text: string) {
  const value = text.toLowerCase();
  if (/pertamina|shell|bensin|spbu|parkir|gojek|grabcar|tol\b/.test(value))
    return 'Transportasi';
  if (
    /indomaret|alfamart|superindo|supermarket|hypermart|tokopedia|shopee/.test(
      value,
    )
  )
    return 'Belanja';
  if (
    /restoran|resto|kopi|coffee|warung|makan|bakso|ayam|gofood|grabfood/.test(
      value,
    )
  )
    return 'Makanan';
  if (/apotek|kimia farma|klinik|rumah sakit|obat/.test(value))
    return 'Kesehatan';
  if (/pln|listrik|internet|telkom|pdam|pulsa/.test(value)) return 'Tagihan';
  if (/bioskop|cinema|netflix|spotify/.test(value)) return 'Hiburan';
  if (/sekolah|kursus|gramedia|buku/.test(value)) return 'Pendidikan';
  return 'Lainnya';
}
export function receiptDate(text: string): string | null {
  const numeric = text.match(/\b(\d{1,2})[\/-](\d{1,2})[\/-](\d{4}|\d{2})\b/);
  const months = [
    'jan',
    'feb',
    'mar',
    'apr',
    'mei',
    'jun',
    'jul',
    'agu',
    'sep',
    'okt',
    'nov',
    'des',
  ];
  const named = text
    .toLowerCase()
    .match(
      /\b(\d{1,2})\s+(jan\w*|feb\w*|mar\w*|apr\w*|mei|jun\w*|jul\w*|agu\w*|sep\w*|okt\w*|nov\w*|des\w*)\s+(\d{4})\b/,
    );
  let result: string | null = null;
  if (numeric)
    result =
      (numeric[3].length === 2 ? '20' : '') +
      numeric[3] +
      '-' +
      numeric[2].padStart(2, '0') +
      '-' +
      numeric[1].padStart(2, '0');
  else if (named)
    result =
      named[3] +
      '-' +
      String(months.indexOf(named[2].slice(0, 3)) + 1).padStart(2, '0') +
      '-' +
      named[1].padStart(2, '0');
  return result && isoDate.safeParse(result).success ? result : null;
}
function amounts(line: string) {
  const clean = line.replace(/\b\d+(?:[.,]\d+)?\s*%/g, '');
  return [...clean.matchAll(/(?:Rp\.?\s*)?\d[\d.,]*(?!\d)/gi)]
    .map((m) => parseRupiah(m[0]))
    .filter((n) => n > 0);
}
export function parseReceipt(text: string, ocrConfidence = 1): ReceiptData {
  const lines = text
    .slice(0, 100000)
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (!lines.length) return { ...emptyReceipt };
  const merchant = (
    lines
      .slice(0, 5)
      .find(
        (l) =>
          /[a-zA-Z]{3}/.test(l) &&
          !/^(struk|nota|receipt|invoice|tanggal|tgl|jl\.?|telp|no\.?\s)/i.test(
            l,
          ),
      ) || ''
  ).slice(0, 120);
  const tanggal = receiptDate(text);
  const candidates: { value: number; score: number }[] = [];
  let pajak = 0,
    diskon = 0,
    subtotal = 0;
  const items: ReceiptData['items'] = [];
  lines.forEach((line, index) => {
    const values = amounts(line);
    const value = values.at(-1) || 0;
    if (/ppn|pajak|tax/i.test(line) && !/^\s*(grand\s+)?total\b/i.test(line))
      pajak = value;
    if (/diskon|discount|potongan/i.test(line)) diskon = value;
    if (/sub\s*total/i.test(line)) subtotal = value;
    const isTotal =
      /\b(grand\s*total|total\s*(bayar|pembayaran|belanja)?|jumlah\s*(bayar|pembayaran)?|tagihan\s*akhir)\b/i.test(
        line,
      );
    if (
      isTotal &&
      !/sub\s*total|total\s*(item|qty|barang|diskon|hemat)|kembali|tunai|cash/i.test(
        line,
      )
    ) {
      // Some thermal printers put the amount on the next line.
      const candidate =
        value ||
        (/^(?:Rp\.?\s*)?[\d.,\s]+$/i.test(lines[index + 1] || '')
          ? amounts(lines[index + 1]).at(-1) || 0
          : 0);
      if (candidate)
        candidates.push({
          value: candidate,
          score:
            (/grand|bayar|pembayaran|akhir/i.test(line) ? 5 : 3) +
            index / Math.max(lines.length, 1),
        });
    }
    if (
      !/total|jumlah|ppn|pajak|tax|diskon|tunai|cash|kembali|saldo|tanggal/i.test(
        line,
      )
    ) {
      const match = line.match(
        /^(.+?)\s+(\d+(?:[.,]\d+)?)\s*[xX@]\s*(?:Rp\.?\s*)?([\d.,]+)/,
      );
      if (match && /[a-z]/i.test(match[1])) {
        const qty = Number(match[2].replace(',', '.')),
          harga = parseRupiah(match[3]);
        if (qty > 0 && qty <= 100000 && harga > 0)
          items.push({ nama: match[1].slice(0, 160), qty, harga });
      }
    }
  });
  // Prioritize explicit grand totals and the lower part of the receipt, then the larger plausible value.
  candidates.sort(
    (a, b) =>
      Math.floor(b.score) - Math.floor(a.score) ||
      b.value - a.value ||
      b.score - a.score,
  );
  const total =
    candidates[0]?.value ||
    (subtotal > 0 ? Math.max(0, subtotal + pajak - diskon) : 0);
  const method =
    text
      .match(
        /\b(qris|gopay|ovo|dana|shopeepay|debit|kredit|tunai|cash|transfer)\b/i,
      )?.[0]
      ?.toUpperCase() || '';
  const confidence = Math.min(
    1,
    (candidates.length ? 0.5 : total ? 0.2 : 0) +
      (tanggal ? 0.2 : 0) +
      (merchant ? 0.15 : 0) +
      Math.max(0, Math.min(1, ocrConfidence)) * 0.15,
  );
  return receiptSchema.parse({
    merchant,
    tanggal,
    total,
    pajak,
    diskon,
    metode_bayar: method,
    items: items.slice(0, 200),
    kategori_saran: suggestCategory(merchant + ' ' + text),
    confidence: Math.round(confidence * 100) / 100,
  });
}
export function lowConfidenceFields(data: ReceiptData) {
  return [
    !data.merchant || data.confidence < 0.55 ? 'merchant' : '',
    !data.tanggal || data.confidence < 0.55 ? 'tanggal' : '',
    !data.total || data.confidence < 0.75 ? 'total' : '',
  ].filter(Boolean);
}
