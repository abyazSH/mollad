import { afterEach, expect, it, vi } from 'vitest';
import { Prisma } from '@prisma/client';
vi.mock('@/lib/db', () => ({ db: {} }));
vi.mock('@/lib/auth', () => ({ currentUser: vi.fn() }));
import { apiError } from '@/lib/http';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

it('melaporkan environment yang hilang tanpa membocorkan pesan Prisma', async () => {
  vi.stubEnv('NEON_DATABASE_URL', '');
  const log = vi.spyOn(console, 'error').mockImplementation(() => {});
  const response = apiError(
    new Prisma.PrismaClientInitializationError(
      'private details',
      '6.19.3',
      'P1012',
    ),
  );
  expect(response.status).toBe(500);
  expect(await response.json()).toEqual({
    error: 'Terjadi kendala. Silakan coba lagi.',
  });
  expect(log.mock.calls[0][2]).toMatchObject({
    databaseUrlState: 'missing',
    prismaCode: 'P1012',
  });
  expect(JSON.stringify(log.mock.calls)).not.toContain('private details');
});

it('membedakan URL invalid dari URL terisi dan hanya mencetak kode aman', () => {
  const secretUrl =
    'postgresql://private-user:private-password@private-host.example/neondb';
  vi.stubEnv('NEON_DATABASE_URL', secretUrl);
  const log = vi.spyOn(console, 'error').mockImplementation(() => {});
  apiError(
    new Prisma.PrismaClientInitializationError(secretUrl, '6.19.3', 'P1001'),
  );
  expect(log.mock.calls[0][2]).toMatchObject({
    databaseUrlState: 'configured',
    prismaCode: 'P1001',
  });
  expect(JSON.stringify(log.mock.calls)).not.toContain('private-');
  vi.stubEnv('NEON_DATABASE_URL', 'file:./dev.db');
  apiError(
    new Prisma.PrismaClientInitializationError(
      'Query engine could not locate private-path',
      '6.19.3',
      'private-code',
    ),
  );
  expect(log.mock.calls[1][2]).toMatchObject({
    databaseUrlState: 'invalid',
    prismaCode: 'UNSPECIFIED',
    engineIssue: 'possible',
  });
  expect(JSON.stringify(log.mock.calls)).not.toContain('private-');
});
