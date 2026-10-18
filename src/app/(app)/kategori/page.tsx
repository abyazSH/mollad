import { requireUser } from '@/lib/auth';
import { categoryList } from '@/lib/queries';
import { CategoryManager } from '@/components/category-manager';
export default async function Page() {
  const user = await requireUser();
  return <CategoryManager categories={await categoryList(user.id)} />;
}
