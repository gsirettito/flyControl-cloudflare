// app/api/test-sms/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { authenticateAndLimit } from '@/utils/api/authenticateAndLimit';
import { sendSMS } from '@/utils/sms';

export async function POST(req: NextRequest) {
    // 1. Verificar que el usuario esté logueado
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const user = await authenticateAndLimit(session.user.id);
    if (user instanceof NextResponse) return user;
    if (!user.isSuperAdmin) return NextResponse.json({error:'No autorizado'},{status:403});
    try {
        const { phone, message } = await req.json();

        if (!phone || !message) {
            return NextResponse.json({ error: 'Teléfono y mensaje son obligatorios' }, { status: 400 });
        }

        // 2. Llamar a la utilidad de SMS
        const success = await sendSMS({
            to: phone,
            message: message
        });

        if (!success) {
            return NextResponse.json({ error: 'La API de SMS rechazó el envío. Revisa los logs de la consola.' }, { status: 400 });
        }

        return NextResponse.json({ success: true, message: 'SMS procesado correctamente' });
    } catch (error: any) {
        console.error('Error en Test SMS:', error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}