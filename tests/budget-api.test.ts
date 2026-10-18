import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  category: vi.fn(),
  upsert: vi.fn(),
  updateMany: vi.fn(),
  transaction: vi.fn(),
}));
vi.mock('@/lib/db', () => ({ db: { $transaction: mocks.transaction } }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('@/lib/budgets', () => ({ budgetList: vi.fn() }));
vi.mock('@/lib/http', () => ({
  apiUser: async () => ({ id: 'owner' }),
  sameOrigin: vi.fn(),
  jsonInput: (request: Request) => request.json(),
  HttpError: class extends Error {
    constructor(
      public status: number,
      message: string,
    ) {
      super(message);
    }
  },
  apiError: (error: { name: string; status?: number; message: string }) =>
    Response.json(
      { error: error.message },
      { status: error.name === 'ZodError' ? 400 : error.status || 500 },
    ),
}));
import { POST, PATCH } from '@/app/api/budgets/route';

const categoryId = 'cm123456789012345678901234';
const budgetId = 'cm987654321098765432109876';
function request(body: object, method = 'POST') {
  return new Request('http://localhost:3000/api/budgets', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}
describe('Penyimpanan anggaran persentase', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.category.mockResolvedValue({ id: categoryId });
    mocks.upsert.mockResolvedValue({ id: budgetId });
    mocks.updateMany.mockResolvedValue({ count: 1 });
    mocks.transaction.mockImplementation(async (callback) =>
      callback({
        category: { findFirst: mocks.category },
        budget: { upsert: mocks.upsert, updateMany: mocks.updateMany },
      }),
    );
  });
  it('menyimpan aturan persentase dan mengabaikan nominal/penghasilan dari klien', async () => {
    const response = await POST(
      request({
        mode: 'percentage',
        categoryId,
        month: '2026-10',
        incomePercent: '30',
        amount: 999999,
        income: 999999999,
      }),
    );
    expect(response.status).toBe(200);
    expect(mocks.category).toHaveBeenCalledWith({
      where: { userId: 'owner', id: categoryId },
    });
    expect(mocks.upsert.mock.calls[0][0].create).toEqual({
      userId: 'owner',
      categoryId,
      month: '2026-10',
      amount: 0,
      incomePercent: 30,
    });
  });
  it('menghapus aturan persentase ketika beralih ke nominal tetap dan membatasi pemilik', async () => {
    const response = await PATCH(
      request(
        {
          id: budgetId,
          mode: 'fixed',
          categoryId,
          month: '2026-10',
          amount: 500000,
          incomePercent: 30,
        },
        'PATCH',
      ),
    );
    expect(response.status).toBe(200);
    expect(mocks.updateMany).toHaveBeenCalledWith({
      where: { userId: 'owner', id: budgetId },
      data: {
        categoryId,
        month: '2026-10',
        amount: 500000,
        incomePercent: null,
      },
    });
  });
  it('tetap menerima klien nominal tetap yang belum mengirim mode', async () => {
    expect(
      (await POST(request({ categoryId, month: '2026-10', amount: 100000 })))
        .status,
    ).toBe(200);
    expect(mocks.upsert.mock.calls[0][0].update).toEqual({
      amount: 100000,
      incomePercent: null,
    });
  });
  it('menolak kategori pengguna lain dan anggaran yang tidak dimiliki', async () => {
    mocks.category.mockResolvedValueOnce(null);
    expect(
      (
        await POST(
          request({
            mode: 'percentage',
            categoryId,
            month: '2026-10',
            incomePercent: 30,
          }),
        )
      ).status,
    ).toBe(404);
    expect(mocks.upsert).not.toHaveBeenCalled();
    mocks.updateMany.mockResolvedValueOnce({ count: 0 });
    expect(
      (
        await PATCH(
          request(
            {
              id: budgetId,
              mode: 'percentage',
              categoryId,
              month: '2026-10',
              incomePercent: 30,
            },
            'PATCH',
          ),
        )
      ).status,
    ).toBe(404);
  });
  it('menolak persentase yang melewati batas sebelum menyentuh database', async () => {
    expect(
      (
        await POST(
          request({
            mode: 'percentage',
            categoryId,
            month: '2026-10',
            incomePercent: 101,
          }),
        )
      ).status,
    ).toBe(400);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
});
