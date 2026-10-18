import sharp from 'sharp';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
const dir = 'public/brand';
async function main() {
  await mkdir(dir, { recursive: true });
  const svg = await readFile(dir + '/logo-mark.svg');
  for (const [name, size] of [
    ['apple-touch-icon', 180],
    ['icon-192', 192],
    ['icon-512', 512],
    ['logo-preview', 320],
  ] as const) {
    await sharp(svg)
      .resize(size, size)
      .png()
      .toFile(dir + '/' + name + '.png');
  }
  const safe = await sharp(svg).resize(288, 288).png().toBuffer();
  await sharp({
    create: { width: 512, height: 512, channels: 4, background: '#E7F7F4' },
  })
    .composite([{ input: safe, left: 112, top: 112 }])
    .png()
    .toFile(dir + '/icon-maskable-512.png');
  // ICO directory with PNG payloads; supported by modern Windows and browsers.
  const sizes = [16, 32, 48];
  const payloads = await Promise.all(
    sizes.map((size) => sharp(svg).resize(size, size).png().toBuffer()),
  );
  const header = Buffer.alloc(6 + sizes.length * 16);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(sizes.length, 4);
  let offset = header.length;
  payloads.forEach((png, i) => {
    const p = 6 + i * 16;
    header[p] = sizes[i];
    header[p + 1] = sizes[i];
    header.writeUInt16LE(1, p + 4);
    header.writeUInt16LE(32, p + 6);
    header.writeUInt32LE(png.length, p + 8);
    header.writeUInt32LE(offset, p + 12);
    offset += png.length;
  });
  await writeFile(dir + '/favicon.ico', Buffer.concat([header, ...payloads]));
  const logo = await sharp(await readFile(dir + '/logo-full.svg'))
    .resize(625, 160)
    .png()
    .toBuffer();
  const type = Buffer.from(
    '<svg width="1200" height="630"><rect x="90" y="410" width="620" height="76" rx="24" fill="#FFF0F2"/><text x="90" y="375" font-family="Arial,sans-serif" font-size="48" fill="#385A55">Atur uang, tanpa ribet.</text><text x="118" y="458" font-family="Arial,sans-serif" font-size="24" fill="#385A55">Dompet, transaksi, dan anggaran dalam satu tempat.</text></svg>',
  );
  await sharp({
    create: { width: 1200, height: 630, channels: 4, background: '#E7F7F4' },
  })
    .composite([{ input: logo, left: 90, top: 120 }, { input: type }])
    .png()
    .toFile(dir + '/og-image.png');
  console.log('Aset mollad berhasil dibuat.');
}
main().catch(() => {
  console.error('Gagal membuat ikon mollad.');
  process.exitCode = 1;
});
