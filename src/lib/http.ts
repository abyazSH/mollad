import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { currentUser } from './auth';
import { db } from './db';
import { createHash } from 'node:crypto';

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
  ) {
    super(message);
  }
}
export async function apiUser() {
  const user = await currentUser();
  if (!user) throw new HttpError(401, 'Silakan masuk terlebih dahulu.');
  return user;
}
export function sameOrigin(request: Request) {
  const origin = request.headers.get('origin');
  const expected = new URL(process.env.APP_URL || request.url).origin;
  if (!origin || origin !== expected)
    throw new HttpError(403, 'Permintaan tidak diizinkan. Muat ulang halaman.');
}
export async function jsonInput(request: Request) {
  if (Number(request.headers.get('content-length') || 0) > 32_768)
    throw new HttpError(413, 'Data terlalu besar.');
  const text = await request.text();
  if (text.length > 32_768) throw new HttpError(413, 'Data terlalu besar.');
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new HttpError(400, 'Format data tidak valid.');
  }
}
export function apiError(error: unknown) {
  if (error instanceof HttpError)
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: error.status },
    );
  if (error instanceof ZodError)
    return NextResponse.json(
      { error: error.issues[0]?.message || 'Periksa data yang diisi.' },
      { status: 400 },
    );
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002')
      return NextResponse.json(
        { error: 'Data tersebut sudah digunakan.' },
        { status: 409 },
      );
    if (error.code === 'P2003')
      return NextResponse.json(
        { error: 'Data masih digunakan oleh transaksi.' },
        { status: 409 },
      );
  }
  let databaseDiagnostic: Record<string, string> | undefined;
  if (error instanceof Prisma.PrismaClientInitializationError) {
    const rawUrl = process.env.NEON_DATABASE_URL;
    let databaseUrlState = rawUrl ? 'invalid' : 'missing';
    if (rawUrl) {
      try {
        const url = new URL(rawUrl);
        if (
          ['postgres:', 'postgresql:'].includes(url.protocol) &&
          url.hostname &&
          url.pathname.length > 1
        )
          databaseUrlState = 'configured';
      } catch {
        /* Report only a classification, never the connection string. */
      }
    }
    databaseDiagnostic = {
      databaseUrlState,
      prismaCode: /^P\d{4}$/.test(error.errorCode || '')
        ? error.errorCode!
        : 'UNSPECIFIED',
      engineIssue:
        /query engine|query_engine|could not locate|cached dependencies/i.test(
          error.message,
        )
          ? 'possible'
          : 'not_identified',
    };
  }
  console.error(
    '[mollad] Permintaan gagal',
    error instanceof Error ? error.name : 'UnknownError',
    ...(databaseDiagnostic ? [databaseDiagnostic] : []),
  );
  return NextResponse.json(
    { error: 'Terjadi kendala. Silakan coba lagi.' },
    { status: 500 },
  );
}
export async function rateLimit(
  identity: string,
  limit: number,
  windowMs = 900_000,
) {
  const key = createHash('sha256').update(identity).digest('hex');
  const now = new Date();
  await db.rateLimit.deleteMany({ where: { key, expiresAt: { lte: now } } });
  const entry = await db.rateLimit.upsert({
    where: { key },
    create: { key, count: 1, expiresAt: new Date(now.getTime() + windowMs) },
    update: { count: { increment: 1 } },
  });
  if (entry.count > limit)
    throw new HttpError(
      429,
      'Terlalu banyak percobaan. Coba lagi dalam 15 menit.',
    );
}
