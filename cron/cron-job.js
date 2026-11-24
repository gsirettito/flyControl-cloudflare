import cron from 'node-cron';
import axios from "axios";
import dotenv from 'dotenv';

// Cargar variables de entorno desde .env
dotenv.config();

export function startCronJob() {
    console.log("✅ CRON JOB INICIADO");

    // Ejecutar cada minuto (patrón: '* * * * *')
    cron.schedule('* * * * *', async () => {
        try {
            console.log("🔵 EJECUTANDO CRON (CADA MINUTO)");
            const endpoint = process.env.NEXTAUTH_URL;

            if (!endpoint) {
                throw new Error("ENDPOINT_FRONTEND no está definido");
            }

            console.log("URL:", `${endpoint}/api/cron-job-execute`);
            await axios.post(`${endpoint}/api/cron-job-execute`, {}, {
                headers: { Authorization: `Bearer ${process.env.CRON_SECRET_TOKEN}` }
            });

        } catch (error) {
            console.error('❌ ERROR EN CRON:', error.message);
        }
    }, {
        scheduled: true,
        timezone: "America/Mexico_City"
    });
}