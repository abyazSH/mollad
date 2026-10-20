import { beforeEach, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  currentUser: vi.fn(),
  createSession: vi.fn(),
  createUser: vi.fn(),
  limit: vi.fn(),
}));
vi.mock('@/lib/auth', () => ({
  currentUser: mocks.currentUser,
  createSession: mocks.createSession,
}));
vi.mock('@/lib/db', () => ({ db: { user: { create: mocks.createUser } } }));
vi.mock('@/lib/http', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/http')>()),
  rateLimit: mocks.limit,
}));
import { POST } from '@/app/api/auth/[action]/route';

beforeEach(() => {
  vi.clearAllMocks();
  mocks.currentUser.mockResolvedValue({ id: 'owner' });
});

it.each(['login', 'register'])(
  'menolak API %s saat sesi sudah aktif sebelum menulis database',
  async (action) => {
    vi.stubEnv('APP_URL', 'http://localhost:3000');
    try {
      const response = await POST(
        new Request('http://localhost:3000/api/auth/' + action, {
          method: 'POST',
          headers: {
            Origin: 'http://localhost:3000',
            'Content-Type': 'application/json',
          },
          body: '{}',
        }),
        { params: Promise.resolve({ action }) },
      );
      expect(response.status).toBe(409);
      expect(await response.json()).toMatchObject({
        code: 'ALREADY_AUTHENTICATED',
      });
      expect(mocks.createUser).not.toHaveBeenCalled();
      expect(mocks.createSession).not.toHaveBeenCalled();
      expect(mocks.limit).not.toHaveBeenCalled();
    } finally {
      vi.unstubAllEnvs();
    }
  },
);

it('tetap memvalidasi input pendaftaran tamu tanpa membuat akun', async () => {
  vi.stubEnv('APP_URL', 'http://localhost:3000');
  mocks.currentUser.mockResolvedValue(null);
  try {
    const response = await POST(
      new Request('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: {
          Origin: 'http://localhost:3000',
          'Content-Type': 'application/json',
        },
        body: '{}',
      }),
      { params: Promise.resolve({ action: 'register' }) },
    );
    expect(response.status).toBe(400);
    expect(mocks.createUser).not.toHaveBeenCalled();
  } finally {
    vi.unstubAllEnvs();
  }
});
