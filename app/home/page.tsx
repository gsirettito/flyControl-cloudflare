import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { DashboardLayout } from '@/components/DashboardLayout';
import { HomeIndex } from '@/modules/home/index/index';
import { prisma } from '@/utils/prisma';
import { getSession } from '@/utils/server/getSession';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);

export default async function Home({ searchParams }: any) {
  const { user } = await getSession();
  const session = await auth();

  // Si no tiene compañía, lo mandamos al wizard
  if (session?.user && !session.user.companyId) {
      redirect('/wizard');
  }

  const _user = (await prisma.user.findUnique({ where: { id: user.id }, select: { company: true, name: true } }))
  const companyId = _user?.company?.id as string;

  // Fechas de referencia
  const now = dayjs.utc();
  const startOfYear = dayjs.utc().startOf('year');
  const endOfYear = dayjs.utc().endOf('year');
  const sevenDaysLater = now.add(7, 'day');
  const fourtyEightHoursLater = now.add(48, 'hour');

  const [
    pendingReservations,
    confirmedReservations,
    rejectedReservations,
    totalClients,
    upcomingFlights,
    activeAirlines
  ] = await prisma.$transaction(async (tx) => [
    // Reservas pendientes del año actual (fecha de creación dentro del año)
    await tx.reservation.count({
      where: {
        status: 'PENDING',
        companyId,
        createdAt: { gte: startOfYear.toDate(), lte: endOfYear.toDate() }
      }
    }),
    // Reservas confirmadas del año actual
    await tx.reservation.count({
      where: {
        status: 'CONFIRMED',
        companyId,
        createdAt: { gte: startOfYear.toDate(), lte: endOfYear.toDate() }
      }
    }),
    // Reservas rechazadas del año actual
    await tx.reservation.count({
      where: {
        status: 'REJECTED',
        companyId,
        createdAt: { gte: startOfYear.toDate(), lte: endOfYear.toDate() }
      }
    }),
    // Clientes de la compañía (sin filtro temporal)
    await tx.client.count({ where: { companyId } }),
    // Vuelos con salida en los próximos 7 días (sin restricción de compañía)
    await tx.flight.count({
      where: {
        companyId,
        departureTime: { gte: now.toDate(), lte: sevenDaysLater.toDate() }
      }
    }),
    // Aerolíneas activas (sin filtro temporal)
    await tx.airline.count({ where: { active: true } })
  ]);

  // Últimas 10 reservas de la compañía (más recientes primero)
  const recentReservations = await prisma.reservation.findMany({
    where: { companyId },
    select: {
      id: true,
      reservationCode: true,
      tripType: true,
      passengerId: true,
      passenger: {
          select: {
              id: true, fullName: true, email: true, passportNumber: true,
              phone: true, nationality: true, birthDate: true,
              passportIssueDate: true, passportExpiryDate: true, type: true, createdAt: true,
          }
      },
      createdByUserId: true,
      createdBy: { select: { name: true, email: true } },
      departureFlights: { select: { flight: { select: { 
          id: true, flightNumber: true, origin: true, originName: true, originTimezone: true,
          destination: true, destinationName: true, destinationTimezone: true,
          departureTime: true, arrivalTime: true, createdAt: true, availableSeats: true, class: true,
          airline: { select: { displayName: true, iata: true, icao: true, logoUrl: true } } 
      } } } },
      returnFlights: { select: { flight: { select: { 
          id: true, flightNumber: true, origin: true, originName: true, originTimezone: true,
          destination: true, destinationName: true, destinationTimezone: true,
          departureTime: true, arrivalTime: true, createdAt: true, availableSeats: true, class: true,
          airline: { select: { displayName: true, iata: true, icao: true, logoUrl: true } } 
      } } } },
      baggage: true, invoiceAmount: true, invoiceCurrency: true, status: true,
      pnr: true, ticketNumber: true, pdfURL: true, createdAt: true, updatedAt: true,
    },
    take: 10,
    orderBy: { createdAt: 'desc' } // ← orden descendente para mostrar las más recientes
  });

  // Vuelos con salida en las próximas 48 horas (sin restricción de compañía)
  const upcomingFlightsList = await prisma.flight.findMany({
    where: {
      companyId, // Añadido para evitar fuga de datos
      departureTime: { gte: now.toDate(), lte: fourtyEightHoursLater.toDate() }
    },
    select: {
        id: true, flightNumber: true, origin: true, originName: true, originTimezone: true,
        destination: true, destinationName: true, destinationTimezone: true,
        departureTime: true, arrivalTime: true, createdAt: true, availableSeats: true, class: true,
        airline: { select: { displayName: true, iata: true, icao: true, logoUrl: true } }
    },
    orderBy: { departureTime: 'asc' }
  });

  return (
    <DashboardLayout user={user}>
      <HomeIndex
        userName={_user?.name as string}
        stats={{
          pendingReservations,
          confirmedReservations,
          rejectedReservations,
          totalClients,
          upcomingFlights,
          activeAirlines
        }}
        recentReservations={recentReservations as any}
        upcomingFlightsList={upcomingFlightsList as any}
      />
    </DashboardLayout>
  );
}