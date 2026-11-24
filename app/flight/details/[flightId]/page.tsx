import { DashboardLayout } from '@/components/DashboardLayout';
import { FlightsDetailsIndex } from '@/modules/flights/details';
import { FlightType } from '@/types/ModelsType';
import { prisma } from '@/utils/prisma';
import { getSession } from '@/utils/server/getSession';

export const dynamic = 'force-dynamic';

export default async function Flights(context: any) {
  const { user } = await getSession()

  const { flightId } = (await context.params)

  const flight = await prisma.flight.findUnique({
    where: {
      id: flightId
    },
    include: {
      airline: {
        select: {
          displayName: true
        }
      }
    }
  }) as any

  return (
    <DashboardLayout user={user}>
      <FlightsDetailsIndex flight={flight} />
    </DashboardLayout>
  );
}