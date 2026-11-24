import { DashboardLayout } from '@/components/DashboardLayout';
import { CompaniesIndex } from '@/modules/companies/index';
import { getSession } from '@/utils/server/getSession';

export const dynamic = 'force-dynamic';

export default async function Users() {
  const { user } = await getSession()
  return (
    <DashboardLayout user={user}>
      <CompaniesIndex />
    </DashboardLayout>
  );
}