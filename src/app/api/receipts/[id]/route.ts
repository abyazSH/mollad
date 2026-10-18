import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { apiError, apiUser, HttpError } from '@/lib/http';
import { db } from '@/lib/db';
import { idSchema } from '@/lib/validation';
export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const user = await apiUser();
    const id = idSchema.parse((await context.params).id);
    const receipt = await db.receipt.findFirst({
      where: { id, userId: user.id },
    });
    if (!receipt || !/^[0-9a-f-]{36}\.jpg$/.test(receipt.path))
      throw new HttpError(404, 'Struk tidak ditemukan.');
    let file: Buffer;
    try {
      file = await readFile(path.join(process.cwd(), 'uploads', receipt.path));
    } catch {
      throw new HttpError(404, 'Foto struk tidak ditemukan.');
    }
    return new Response(new Uint8Array(file), {
      headers: {
        'Content-Type': 'image/jpeg',
        'Content-Disposition': 'inline; filename="struk.jpg"',
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
