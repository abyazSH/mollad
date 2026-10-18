import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({
  token: '',
  set: vi.fn(),
  findUnique: vi.fn(),
}));
vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: () => (mocks.token ? { value: mocks.token } : undefined),
    set: mocks.set,
  }),
}));
vi.mock('@/lib/db', () => ({ db: { user: { findUnique: mocks.findUnique } } }));
import { createSession, currentUser } from '@/lib/auth';
import { sameOrigin } from '@/lib/http';
describe('Autentikasi dan batas origin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.token = '';
    process.env.NEXTAUTH_SECRET =
      'test-only-secret-with-at-least-thirty-two-characters';
    process.env.APP_URL = 'http://localhost:3000';
  });
  it('menolak kunjungan tanpa sesi', async () => {
    expect(await currentUser()).toBeNull();
    expect(mocks.findUnique).not.toHaveBeenCalled();
  });
  it('menerbitkan cookie HTTP-only dan memverifikasi pemilik sesi', async () => {
    await createSession('user-a');
    expect(mocks.set.mock.calls[0][2]).toMatchObject({
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
    });
    mocks.token = mocks.set.mock.calls[0][1];
    mocks.findUnique.mockResolvedValue({
      id: 'user-a',
      name: 'A',
      email: 'a@example.test',
    });
    expect((await currentUser())?.id).toBe('user-a');
    expect(mocks.findUnique.mock.calls[0][0].where).toEqual({ id: 'user-a' });
  });
  it('menolak token yang dimodifikasi', async () => {
    await createSession('user-a');
    mocks.token = mocks.set.mock.calls[0][1] + 'invalid';
    expect(await currentUser()).toBeNull();
    expect(mocks.findUnique).not.toHaveBeenCalled();
  });
  it('memblokir mutasi dari origin lain dan tanpa origin', () => {
    expect(() =>
      sameOrigin(
        new Request('http://localhost:3000/api/auth/login', {
          headers: { origin: 'https://other.test' },
        }),
      ),
    ).toThrow();
    expect(() =>
      sameOrigin(new Request('http://localhost:3000/api/auth/login')),
    ).toThrow();
    expect(() =>
      sameOrigin(
        new Request('http://localhost:3000/api/auth/login', {
          headers: { origin: 'http://localhost:3000' },
        }),
      ),
    ).not.toThrow();
  });
});
