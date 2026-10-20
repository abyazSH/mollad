import { requireUser } from '@/lib/auth';
import { walletList, categoryList } from '@/lib/queries';
import { WalletManager } from '@/components/wallet-manager';
import { CategoryManager } from '@/components/category-manager';
export default async function Page() {
  const user = await requireUser();
  const [wallets, categories] = await Promise.all([
    walletList(user.id),
    categoryList(user.id),
  ]);
  return (
    <>
      <WalletManager wallets={wallets} />
      <section
        id="kategori"
        className="mt-12 scroll-mt-6 border-t border-line pt-10"
        aria-label="Kategori transaksi"
      >
        <CategoryManager categories={categories} />
      </section>
    </>
  );
}
