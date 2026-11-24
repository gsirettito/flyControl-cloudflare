// utils/storage.ts
import { s3 } from '@/utils/minio';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs/promises';
import path from 'path';

export async function uploadFile(
    buffer: Buffer,
    key: string,
    contentType: string
): Promise<string> {
    // Si estamos en desarrollo, o si en el .env pusiste STORAGE_MODE="local", guardamos en disco
    const isLocal = process.env.FLYCONTROL_WORKERS !== 'true' && (process.env.STORAGE_MODE === 'local' || process.env.NODE_ENV === 'development');

    if (isLocal) {
        // Guarda el archivo en la carpeta public/
        const filePath = path.join(process.cwd(), 'public', key);

        // Crea la carpeta si no existe (ej. public/uploads o public/invoices)
        await fs.mkdir(path.dirname(filePath), { recursive: true });
        await fs.writeFile(filePath, buffer);

        // Next.js sirve la carpeta public automáticamente en la raíz
        return `/${key}`;
    }

    // --- LÓGICA DE PRODUCCIÓN (MINIO / AWS S3) ---
    // Esta parte del código es exactamente la misma que ya tenías
    if (!process.env.MINIO_URL || !process.env.MINIO_ACCESS_KEY || !process.env.MINIO_SECRET_KEY) throw new Error("Almacenamiento remoto no configurado");
    const BUCKET = process.env.BUCKET_MEDIA || "flycontrol";
    await s3.send(new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: buffer,
        ContentType: contentType,
    }));

    const MINIO_PUBLIC_URL = process.env.MINIO_PUBLIC_URL || process.env.MINIO_URL;
    return `${MINIO_PUBLIC_URL}/${BUCKET}/${key}`;
}