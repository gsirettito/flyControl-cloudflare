import { DashboardLayout } from '@/components/DashboardLayout';
import { ManagersIndex } from '@/modules/managers/index/index';
import { getSession } from '@/utils/server/getSession';

export const dynamic = 'force-dynamic';

export default async function Users() {
  const { user } = await getSession()
  return (
    <DashboardLayout user={user}>
      <ManagersIndex />
    </DashboardLayout>
  );
}