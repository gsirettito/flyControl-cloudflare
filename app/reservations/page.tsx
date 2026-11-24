// app/page.tsx
import { DashboardLayout } from '@/components/DashboardLayout';
import { ReservationsIndex } from '@/modules/reservations/index';
import { getSession } from '@/utils/server/getSession';

export default async function Home({ searchParams }: any) {
  const { user } = await getSession();
 
  return (
    <DashboardLayout user={user}>
      <ReservationsIndex/>
    </DashboardLayout>
  );
}