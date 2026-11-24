// utils/email.ts
import nodemailer from 'nodemailer';

// Configuramos el transporte de Nodemailer
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 465,
    secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === 'true' : (Number(process.env.SMTP_PORT) || 465) === 465, // true para puerto 465, false para 587
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
    // 🔥 Timeout para evitar que la API se quede congelada si el correo falla
    connectionTimeout: 10000, // 10 segundos
});

const DEFAULT_FROM = process.env.SMTP_FROM || `"FlyControl" <${process.env.SMTP_USER}>`;

export async function sendEmail({
    to,
    subject,
    html,
    text,
    from,
    attachments,
}: {
    to: string | string[];
    subject: string;
    html?: string;
    text?: string;
    from?: string;
    attachments?: Array<{ filename: string; content: Buffer | string; contentType?: string }>;
}): Promise<boolean> {
    try {
        // Validar que al menos haya un destinatario
        if (!to || (Array.isArray(to) && to.length === 0)) {
            console.warn('⚠️ No se envió el correo: No hay destinatario.');
            return false;
        }

        if (process.env.RESEND_API_KEY) {
            const sender = from || process.env.RESEND_FROM || process.env.SMTP_FROM;
            if (!sender) return false;
            const response = await fetch('https://api.resend.com/emails', {
                method: 'POST', signal: AbortSignal.timeout(15000),
                headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ from: sender, to: Array.isArray(to) ? to : [to], subject, html: html || '', text,
                    attachments: attachments?.map(a => ({ filename: a.filename, content: Buffer.isBuffer(a.content) ? a.content.toString('base64') : Buffer.from(a.content).toString('base64') })) })
            });
            if (!response.ok) console.error('Resend HTTP', response.status);
            return response.ok;
        }
        if (process.env.FLYCONTROL_WORKERS === 'true') return false;
        const info = await transporter.sendMail({
            from: from || DEFAULT_FROM,
            to: Array.isArray(to) ? to.join(', ') : to,
            subject: subject,
            html: html || '',
            text: text,
            // Formatear los adjuntos para Nodemailer
            attachments: attachments?.map(att => ({
                filename: att.filename,
                content: att.content,
                contentType: att.contentType,
            })),
        });

        console.log("Correo aceptado por SMTP");
        return true;
    } catch (error) {
        console.error('❌ Error enviando email con Nodemailer:', error);
        return false;
    }
}