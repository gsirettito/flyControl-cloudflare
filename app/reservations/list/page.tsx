// app/page.tsx
import { DashboardLayout } from '@/components/DashboardLayout';
import { ReservationListIndex } from '@/modules/reservations/list';
import { prisma } from '@/utils/prisma';
import { getSession } from '@/utils/server/getSession';
import { redirect } from 'next/navigation';

export default async function ReservationList() {
  const { user } = await getSession();
  const _user = await prisma.user.findUnique({ where: { id: user.id }, select: { companyId: true } })

  if (!_user?.companyId)
    return redirect("/home")

  const company = await prisma.company.findUnique({
    where: {
      id: _user.companyId
    }
  })
  const expiryHours = company?.preReservationExpiryHours || 24

  return (
    <DashboardLayout user={user}>
      <ReservationListIndex expiryHours={expiryHours} />
    </DashboardLayout>
  );
}