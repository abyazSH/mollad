import { requireUser } from '@/lib/auth';
import { Shell } from '@/components/shell';
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  return <Shell name={user.name}>{children}</Shell>;
}
