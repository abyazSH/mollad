import { requireUser } from '@/lib/auth';
import { walletList, categoryList } from '@/lib/queries';
import { ScanClient } from '@/components/scan-client';
export default async function Page() {
  const user = await requireUser();
  const [wallets, categories] = await Promise.all([
    walletList(user.id),
    categoryList(user.id),
  ]);
  return (
    <ScanClient
      wallets={wallets}
      categories={categories}
      provider={
        process.env.OCR_PROVIDER === 'vision' && process.env.VISION_API_KEY
          ? 'vision'
          : 'tesseract'
      }
    />
  );
}
