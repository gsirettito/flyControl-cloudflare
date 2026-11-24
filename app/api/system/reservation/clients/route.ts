import { auth } from '@/auth';
import { NextRequest, NextResponse } from 'next/server';
import { getQuerySchema } from '@/utils/api/schema';
import { buildWhere, buildOrderBy, buildGroupBy, getPrismaModel } from '@/utils/api/utils';
import { prisma } from '@/utils/prisma';
import { authenticateAndLimit } from '@/utils/api/authenticateAndLimit';

export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }
        const authResult = await authenticateAndLimit(session.user.id);
        if (authResult instanceof NextResponse) return authResult;

        const prismaModel = getPrismaModel('Client');
        const url = new URL(req.url);
        const searchParams = url.searchParams;
        const validated = getQuerySchema.parse(Object.fromEntries(searchParams.entries()));
        const { page, limit, flightId } = validated;

        const flights = await prisma.flight.findUnique({
            where: {
                id: flightId
            },
            select: {
                reservationDepartureFlights: {
                    select: {
                        reservation: {
                            select: {
                                passengerId: true
                            }
                        }
                    }
                },
                reservationReturnFlights: {
                    select: {
                        reservation: {
                            select: {
                                passengerId: true
                            }
                        }
                    }
                }
            }
        }) as any

        const passengerIdIn = flights.reservationDepartureFlights.map((e: any) => e.reservation.passengerId)
        const passengerIdOut = flights.reservationReturnFlights.map((e: any) => e.reservation.passengerId)
        const passengerIds = [...passengerIdIn, ...passengerIdOut]

        searchParams.delete("flightId")
        let where = buildWhere(searchParams);
        where = {
            ...where,
            id: {
                in: passengerIds
            }
        }

        const orderBy = buildOrderBy(searchParams);
        const groupByFields = buildGroupBy(searchParams);

        const selectFields = {
            id: true,
            fullName: true,
            passportNumber: true,
            email: true,
            phone: true,
            passportIssueDate: true,
            passportExpiryDate: true,
            type: true,
            nationality: true,
            birthDate: true,
            createdAt: true,
            updatedAt: true,
        };

        if (groupByFields && groupByFields.length > 0) {
            const result = await (prismaModel as any).groupBy({
                by: groupByFields,
                where,
                _count: { _all: true },
                orderBy: orderBy || undefined,
                select: selectFields,
            });
            return NextResponse.json({ data: result, pagination: null });
        }

        const skip = (page - 1) * limit;
        const [data, total] = await prisma.$transaction([
            prismaModel.findMany({
                where,
                orderBy,
                skip,
                take: limit,
                select: selectFields,
            }),
            prismaModel.count({ where }),
        ]);

        return NextResponse.json({
            data,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error: any) {
        console.error(error);
        return NextResponse.json({ error: 'Error de consulta' }, { status: 400 });
    }
}
