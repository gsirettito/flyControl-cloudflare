import { DashboardLayout } from '@/components/DashboardLayout';
import { ClientsIndex } from '@/modules/clients/index';
import { getSession } from '@/utils/server/getSession';

export const dynamic = 'force-dynamic';

export default async function Clients() {
  const { user } = await getSession()
  return (
    <DashboardLayout user={user}>
      <ClientsIndex />
    </DashboardLayout>
  );
}