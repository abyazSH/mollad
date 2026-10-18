import type { TransactionType } from '@prisma/client';
export type Movement = {
  walletId: string;
  destinationWalletId: string | null;
  type: TransactionType;
  amount: number;
};
export function walletBalance(
  wallet: { id: string; initialBalance: number },
  transactions: Movement[],
) {
  return transactions.reduce((balance, tx) => {
    if (tx.walletId === wallet.id)
      balance += tx.type === 'INCOME' ? tx.amount : -tx.amount;
    if (tx.type === 'TRANSFER' && tx.destinationWalletId === wallet.id)
      balance += tx.amount;
    return balance;
  }, wallet.initialBalance);
}
export function cashFlow(
  transactions: { type: TransactionType; amount: number }[],
) {
  return transactions.reduce(
    (sum, tx) => {
      if (tx.type === 'INCOME') sum.income += tx.amount;
      if (tx.type === 'EXPENSE') sum.expense += tx.amount;
      return sum;
    },
    { income: 0, expense: 0 },
  );
}
export const typeLabels = {
  INCOME: 'Pemasukan',
  EXPENSE: 'Pengeluaran',
  TRANSFER: 'Transfer',
};
export const walletLabels = {
  CASH: 'Tunai',
  BANK: 'Bank',
  EWALLET: 'E-wallet',
};
