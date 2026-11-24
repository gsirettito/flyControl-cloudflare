import { DashboardLayout } from '@/components/DashboardLayout';
import { FlightsIndex } from '@/modules/flights/index';
import { getSession } from '@/utils/server/getSession';

export const dynamic = 'force-dynamic';

export default async function Flights() {
  const { user } = await getSession()
  return (
    <DashboardLayout user={user}>
      <FlightsIndex />
    </DashboardLayout>
  );
}