import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { hash, compare } from 'bcryptjs';
import { z } from 'zod';
import { db } from '@/lib/db';
import { createSession, currentUser } from '@/lib/auth';
import {
  apiError,
  HttpError,
  jsonInput,
  rateLimit,
  sameOrigin,
} from '@/lib/http';
import { defaultCategories } from '@/lib/defaults';

const credentials = z.object({
  email: z
    .string()
    .trim()
    .email('Email tidak valid.')
    .max(254)
    .transform((v) => v.toLowerCase()),
  password: z
    .string()
    .min(8, 'Kata sandi minimal 8 karakter.')
    .max(72, 'Kata sandi maksimal 72 karakter.'),
  name: z.string().trim().min(2, 'Nama minimal 2 karakter.').max(60).optional(),
});
export async function POST(
  request: Request,
  context: { params: Promise<{ action: string }> },
) {
  try {
    sameOrigin(request);
    const { action } = await context.params;
    if (action === 'logout') {
      (await cookies()).delete('m-session');
      return NextResponse.json({ ok: true });
    }
    if (action !== 'login' && action !== 'register')
      throw new HttpError(404, 'Halaman tidak ditemukan.');
    if (await currentUser())
      throw new HttpError(
        409,
        'Kamu sudah masuk. Buka dashboard untuk melanjutkan.',
        'ALREADY_AUTHENTICATED',
      );
    const data = credentials.parse(await jsonInput(request));
    // A shared bucket also limits registration with rotating email addresses on a single installation.
    await rateLimit('auth:global', 100);
    await rateLimit('auth:' + data.email, 10);
    if (Buffer.byteLength(data.password, 'utf8') > 72)
      throw new HttpError(400, 'Kata sandi maksimal 72 byte.');
    if (action === 'register') {
      if (!data.name) throw new HttpError(400, 'Nama wajib diisi.');
      const user = await db.user.create({
        data: {
          name: data.name,
          email: data.email,
          passwordHash: await hash(data.password, 12),
          categories: {
            create: defaultCategories.map(([name, color]) => ({ name, color })),
          },
        },
      });
      await createSession(user.id);
    } else {
      const user = await db.user.findUnique({ where: { email: data.email } });
      const valid = await compare(
        data.password,
        user?.passwordHash ||
          '$2b$12$1hYS2L.T4ULXjtbXpHt16edFT.tWXSG.gEi/Y.TMXDjKQBoQPiElS',
      );
      if (!user || !valid)
        throw new HttpError(401, 'Email atau kata sandi tidak cocok.');
      await createSession(user.id);
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
