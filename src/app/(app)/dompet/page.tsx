import { requireUser } from '@/lib/auth';
import { walletList } from '@/lib/queries';
import { WalletManager } from '@/components/wallet-manager';
export default async function Page() {
  const user = await requireUser();
  return <WalletManager wallets={await walletList(user.id)} />;
}
