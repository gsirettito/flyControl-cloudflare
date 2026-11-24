import { auth } from '@/auth';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/utils/prisma';
import { authenticateAndLimit } from '@/utils/api/authenticateAndLimit';

export async function POST(req: NextRequest) {
    // 1. Autenticación
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const authResult = await authenticateAndLimit(session.user.id);
    if (authResult instanceof NextResponse) return authResult;
    const user = authResult;

    // 2. Verificar si el usuario ya tiene compañía
    if (user.companyId) {
        return NextResponse.json({ error: 'El usuario ya tiene una compañía asignada' }, { status: 400 });
    }

    try {
        const body = await req.json();
        const { commercialName, phone, address } = body;

        // 3. Validaciones básicas
        if (!commercialName || typeof commercialName !== 'string' || commercialName.trim() === '') {
            return NextResponse.json({ error: 'El nombre comercial es obligatorio' }, { status: 400 });
        }
        if (!phone || typeof phone !== 'string') {
            return NextResponse.json({ error: 'El teléfono es obligatorio' }, { status: 400 });
        }
        if (!address || typeof address !== 'string') {
            return NextResponse.json({ error: 'La dirección es obligatoria' }, { status: 400 });
        }

        // 4. Verificar que el nombre comercial no exista ya
        const existingCompany = await prisma.company.findUnique({
            where: { commercialName: commercialName.trim() },
        });
        if (existingCompany) {
            return NextResponse.json({ error: 'Ya existe una compañía con ese nombre comercial' }, { status: 400 });
        }

        // 5. Crear la compañía con valores por defecto
        const newCompany = await prisma.company.create({
            data: {
                commercialName: commercialName.trim(),
                logoUrl: '',
                primaryColor: '#1e3a8a',      // azul por defecto
                secondaryColor: '#f59e0b',    // naranja
                textColor: '#1f2937',
                phone: phone.trim(),
                address: address.trim(),
                ticketPrefix: commercialName.trim().slice(0, 3).toUpperCase(),
                preReservationExpiryHours: 24,
            },
        });

        // 6. Asociar la compañía al usuario
        await prisma.user.update({
            where: { id: user.id },
            data: { companyId: newCompany.id },
        });

        // 7. (Opcional) Actualizar la sesión? No es necesario, el usuario debería volver a autenticarse o recargar.
        //    El middleware lo redirigirá al home después de guardar.

        return NextResponse.json({ success: true, company: newCompany }, { status: 201 });
    } catch (error: any) {
        console.error('Error creando compañía:', error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}