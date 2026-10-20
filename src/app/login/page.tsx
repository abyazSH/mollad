import { AuthForm } from '@/components/auth-form';
import { requireGuest } from '@/lib/auth';
export default async function Page() {
  await requireGuest();
  return <AuthForm />;
}
