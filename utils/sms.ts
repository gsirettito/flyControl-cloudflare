// utils/sms.ts

export async function sendSMS({
    to,
    message,
}: {
    to: string;
    message: string;
}): Promise<boolean> {
    const token = process.env.OTP_SMS_TOKEN_SECRET;

    if (!token) {
        console.warn('⚠️ OTP_SMS_TOKEN_SECRET no está configurado en el .env');
        return false;
    }

    let cleanPhone = to.replace(/\D/g, '');
    if (!cleanPhone.startsWith('53')) {
        cleanPhone = '53' + cleanPhone;
    }
    cleanPhone = '+' + cleanPhone;

    const cubanPhoneRegex = /^\+53\d{8}$/;
    if (!cubanPhoneRegex.test(cleanPhone)) {
        console.error(`❌ Formato de teléfono inválido: ${to}. Se esperaba un número de Cuba válido (+53XXXXXXXX).`);
        return false;
    }

    try {
        const response = await fetch('https://otp.noxcreation.dev/api/v2/sms/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-token-secret': token,
            },
            body: JSON.stringify({
                phoneNumber: cleanPhone,
                message: message,
                // Eliminamos el parámetro sandbox de aquí
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            if (response.status === 402) {
                console.error('❌ Error SMS: Saldo insuficiente.');
            } else if (response.status === 429) {
                console.error('❌ Error SMS: Límite de peticiones excedido.');
            } else {
                console.error(`❌ Error al enviar SMS:`, data.error || data.message || 'Error desconocido');
            }
            return false;
        }

        // Verificamos si la API nos responde que fue un sandbox a pesar de todo
        if (data.isSandbox) {
            console.warn(`⚠️ El SMS a ${cleanPhone} fue SIMULADO. Revisa si el modo Sandbox sigue activo en tu cuenta de OTP Cuba.`);
            return false;
        }

        console.log(`✅ SMS real enviado a ${cleanPhone}. Saldo restante: ${data.balanceAfter} CUP`);
        return true;

    } catch (error) {
        console.error('❌ Error de red al intentar enviar el SMS:', error);
        return false;
    }
}