import { DashboardLayout } from '@/components/DashboardLayout';
import { AirlinesIndex } from '@/modules/airlines/index';
import { getSession } from '@/utils/server/getSession';

export const dynamic = 'force-dynamic';

export default async function Airlines() {
  const { user } = await getSession()
  return (
    <DashboardLayout user={user}>
      <AirlinesIndex />
    </DashboardLayout>
  );
}