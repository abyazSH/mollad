import { NextResponse } from 'next/server';
import { z } from 'zod';
import { apiUser, apiError, jsonInput, sameOrigin } from '@/lib/http';
import { idSchema } from '@/lib/validation';
import {
  saveWallet,
  saveCategory,
  saveTransaction,
  deleteRecord,
} from '@/lib/mutations';
import { walletList, categoryList, transactionList } from '@/lib/queries';
const resources = z.enum(['wallets', 'categories', 'transactions']);
type Context = { params: Promise<{ resource: string }> };
export async function GET(request: Request, context: Context) {
  try {
    const user = await apiUser();
    const resource = resources.parse((await context.params).resource);
    const result =
      resource === 'wallets'
        ? await walletList(user.id)
        : resource === 'categories'
          ? await categoryList(user.id)
          : await transactionList(
              user.id,
              Object.fromEntries(new URL(request.url).searchParams),
            );
    return NextResponse.json(result);
  } catch (error) {
    return apiError(error);
  }
}
async function mutate(request: Request, context: Context) {
  try {
    sameOrigin(request);
    const user = await apiUser();
    const resource = resources.parse((await context.params).resource);
    const input = await jsonInput(request);
    const id =
      request.method !== 'POST'
        ? z.object({ id: idSchema }).parse(input).id
        : undefined;
    if (request.method === 'DELETE')
      return NextResponse.json(await deleteRecord(user.id, resource, id!));
    const result =
      resource === 'wallets'
        ? await saveWallet(user.id, input, id)
        : resource === 'categories'
          ? await saveCategory(user.id, input, id)
          : await saveTransaction(user.id, input, id);
    return NextResponse.json(result, {
      status: request.method === 'POST' ? 201 : 200,
    });
  } catch (error) {
    return apiError(error);
  }
}
export const POST = mutate;
export const PATCH = mutate;
export const DELETE = mutate;
