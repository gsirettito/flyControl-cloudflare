// app/api/auth/register/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/utils/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import crypto from 'crypto';
import { sendEmail } from '@/utils/email';

const registerSchema = z.object({
    name: z.string().trim().max(100).min(2, "El nombre debe tener al menos 2 caracteres"),
    email: z.string().trim().toLowerCase().max(254).email("Correo inválido"),
    password: z.string().max(72).min(6, "La contraseña debe tener al menos 6 caracteres"),
});

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { name, email, password } = registerSchema.parse(body);
        if (Buffer.byteLength(password, 'utf8') > 72) return NextResponse.json({error:'Contraseña demasiado larga'}, {status:400});
        const base = process.env.NEXTAUTH_URL || process.env.AUTH_URL;
        if (!base) return NextResponse.json({error:'Servicio de activación no configurado'}, {status:503});
        const origin = new URL(base);
        if (origin.protocol !== 'https:' && process.env.NODE_ENV === 'production') return NextResponse.json({error:'Servicio de activación no configurado'}, {status:503});
        const safeName = name.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c] || c));

        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser && (existingUser.emailVerified || !existingUser.password || !await bcrypt.compare(password, existingUser.password))) {
            return NextResponse.json({error:'No se pudo registrar. Si ya tienes cuenta, inicia sesión.'}, {status:400});
        }
        const hashedPassword = existingUser ? null : await bcrypt.hash(password, 10);
        const token = crypto.randomUUID();
        const expires = new Date(Date.now() + 86400000);
        const issued = await prisma.$transaction(async tx => {
            const [lock] = await tx.$queryRaw<{locked:boolean}[]>`SELECT pg_try_advisory_xact_lock(hashtextextended(${email}, 0)) AS locked`;
            if (!lock?.locked) return false;
            const current = await tx.user.findUnique({where:{email}});
            if (!current && !hashedPassword) return false;
            if (current && (!existingUser || current.id !== existingUser.id || current.emailVerified || current.password !== existingUser.password)) return false;
            const recent = await tx.verificationToken.findFirst({where:{identifier:email, expires:{gt:new Date(Date.now()+86400000-60000)}}});
            if (recent) return false;
            if (!current && hashedPassword) await tx.user.create({data:{name,email,password:hashedPassword,isAdmin:false}});
            await tx.verificationToken.deleteMany({where:{identifier:email}});
            await tx.verificationToken.create({data:{identifier:email,token,expires}});
            return true;
        });
        if (!issued) return NextResponse.json({error:'Espera un minuto antes de volver a solicitar la activación.'},{status:429});

        // 3. Enviar correo de verificación
        const verifyLink = new URL(`/api/auth/verify-email?token=${encodeURIComponent(token)}`, origin).toString();
        
        const sent = await sendEmail({
            to: email,
            subject: "Verifica tu cuenta en FlyControl",
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
                    <h2 style="color: #333;">¡Bienvenido a FlyControl!</h2>
                    <p>Hola <strong>${safeName}</strong>,</p>
                    <p>Gracias por registrarte. Para activar tu cuenta y poder iniciar sesión, por favor verifica tu correo electrónico haciendo clic en el siguiente botón:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${verifyLink}" style="background-color: #e5b012; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Verificar mi cuenta</a>
                    </div>
                    <p style="color: #666; font-size: 12px;">Si el botón no funciona, copia y pega este enlace en tu navegador: <br> ${verifyLink}</p>
                    <p style="color: #666; font-size: 12px;">Este enlace expirará en 24 horas.</p>
                </div>
            `,
        });

        if (!sent) return NextResponse.json({error:'La cuenta se guardó, pero no se pudo enviar el correo. Reintenta el registro con el mismo correo y contraseña en un minuto.'}, {status:503});
        return NextResponse.json({ success: true, message: 'Revisa tu correo para activar la cuenta.' });
    } catch (error: any) {
        console.error("Error en registro");
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
        }
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}