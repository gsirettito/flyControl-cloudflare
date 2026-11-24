// app/page.tsx
import { DashboardLayout } from '@/components/DashboardLayout';
import { ReservationDiscoveryIndex } from '@/modules/reservations/discovery';
import { getSession } from '@/utils/server/getSession';

export default async function ReservationList() {
  const { user } = await getSession();

  return (
    <DashboardLayout user={user}>
      <ReservationDiscoveryIndex />
    </DashboardLayout>
  );
}