import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import { redirect } from 'next/navigation';
import { db } from './db';

function key() {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret || secret.length < 32)
    throw new Error('NEXTAUTH_SECRET harus minimal 32 karakter.');
  return new TextEncoder().encode(secret);
}
export async function createSession(userId: string) {
  const token = await new SignJWT({})
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(key());
  (await cookies()).set('m-session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
}
export async function currentUser() {
  const token = (await cookies()).get('m-session')?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key(), {
      algorithms: ['HS256'],
    });
    if (!payload.sub) return null;
    return await db.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, name: true, email: true },
    });
  } catch {
    return null;
  }
}
export async function requireUser() {
  const user = await currentUser();
  if (!user) redirect('/login');
  return user;
}
