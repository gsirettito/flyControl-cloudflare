// app/page.tsx
import { DashboardLayout } from '@/components/DashboardLayout';
import { ReservationsCalendarIndex } from '@/modules/reservations/calendar';
import { getSession } from '@/utils/server/getSession';

export default async function ReservationList() {
  const { user } = await getSession();

  return (
    <DashboardLayout user={user}>
      <ReservationsCalendarIndex />
    </DashboardLayout>
  );
}