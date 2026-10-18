import { loadEnvConfig } from '@next/env';
import { PrismaClient } from '@prisma/client';
loadEnvConfig(process.cwd());
const db = new PrismaClient();
async function main() {
  const pooled = new URL(process.env.NEON_DATABASE_URL || '');
  const direct = new URL(process.env.NEON_DIRECT_URL || '');
  if (
    !pooled.hostname.includes('-pooler') ||
    direct.hostname.includes('-pooler') ||
    pooled.hostname.replace('-pooler', '') !== direct.hostname ||
    pooled.pathname !== direct.pathname ||
    pooled.username !== direct.username ||
    pooled.searchParams.get('sslmode') !== 'require' ||
    direct.searchParams.get('sslmode') !== 'require'
  ) {
    throw new Error('InvalidConnectionPair');
  }
  const rows = await db.$queryRaw<
    { connected: number }[]
  >`SELECT 1 AS connected`;
  if (rows[0]?.connected !== 1) throw new Error('ConnectionFailed');
  await db.$transaction([
    db.user.count(),
    db.wallet.count(),
    db.category.count(),
    db.transaction.count(),
    db.budget.count(),
    db.receipt.count(),
    db.rateLimit.count(),
  ]);
  console.log('Koneksi PostgreSQL Neon berhasil.');
  console.log('Seluruh tabel mollad dapat diakses.');
}
main()
  .catch((error: unknown) => {
    console.error('Loại lỗi:', error instanceof Error ? error.name : 'Unknown');
    console.error(
      'Koneksi Neon gagal. Periksa URL pooled/direct, SSL, dan akses jaringan. Kredensial tidak ditampilkan.',
    );
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
