import { z } from 'zod';
export function today() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}
export const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Tanggal tidak valid.')
  .refine((v) => {
    const date = new Date(v + 'T00:00:00.000Z');
    return (
      !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === v
    );
  }, 'Tanggal tidak valid.');
export const monthSchema = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Bulan tidak valid.');
export function formatDate(value: string | Date) {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(value));
}
export function monthRange(month: string) {
  monthSchema.parse(month);
  const start = new Date(month + '-01T00:00:00.000Z');
  const end = new Date(start);
  end.setUTCMonth(end.getUTCMonth() + 1);
  return { gte: start, lt: end };
}
