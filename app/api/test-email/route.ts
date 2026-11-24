import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { authenticateAndLimit } from '@/utils/api/authenticateAndLimit';
import { sendEmail } from '@/utils/email';

export async function POST(req: NextRequest) {
    // 1. Validar que el usuario esté logueado
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const user = await authenticateAndLimit(session.user.id);
    if (user instanceof NextResponse) return user;
    if (!user.isSuperAdmin) return NextResponse.json({error:'No autorizado'},{status:403});
    try {
        const body = await req.json();
        const { email } = body;

        if (!email) {
            return NextResponse.json({ error: 'El correo es obligatorio' }, { status: 400 });
        }

        // 2. Enviar el correo usando nuestra función (Nodemailer)
        const success = await sendEmail({
            to: email,
            subject: '🚀 Prueba de Correo - FlyControl',
            html: `
                <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px; max-width: 500px; margin: auto;">
                    <h2 style="color: #1e3a8a;">¡Hola!</h2>
                    <p>Este es un correo de prueba enviado desde tu sistema <strong>FlyControl</strong>.</p>
                    <p>Si estás leyendo esto, significa que tu configuración de SMTP (Nodemailer) está funcionando perfectamente.</p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                    <p style="color: #666; font-size: 12px;">Enviado a: ${email}</p>
                </div>
            `,
        });

        if (!success) {
            return NextResponse.json({ error: 'El servidor de correo rechazó el envío. Revisa tus credenciales SMTP en el .env' }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: 'Correo enviado correctamente' });

    } catch (error: any) {
        console.error('Error en test-email:', error);
        return NextResponse.json({ error: error.message || 'Error interno' }, { status: 500 });
    }
}