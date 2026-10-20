import { requireUser } from '@/lib/auth';
import { walletList, categoryList } from '@/lib/queries';
import { ProfileClient } from '@/components/profile-client';
export default async function Page() {
  const user = await requireUser();
  const [wallets, categories] = await Promise.all([
    walletList(user.id),
    categoryList(user.id),
  ]);
  return (
    <ProfileClient
      user={{ name: user.name, email: user.email }}
      wallets={wallets}
      categories={categories}
    />
  );
}
