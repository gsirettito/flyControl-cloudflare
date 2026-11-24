// app/api/upload-image/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { authenticateAndLimit } from '@/utils/api/authenticateAndLimit';
import { randomUUID } from 'node:crypto';
import { uploadFile } from '@/utils/storage';

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({error:'No autorizado'}, {status:401});
    const user = await authenticateAndLimit(session.user.id);
    if (user instanceof NextResponse) return user;
    try {
        const formData = await req.formData();
        const file = formData.get('image') as File;
        if (!(file instanceof File) || file.size > 5*1024*1024 || !["image/png","image/jpeg","image/webp"].includes(file.type)) return NextResponse.json({ error: 'No file' }, { status: 400 });

        const buffer = Buffer.from(await file.arrayBuffer());
        const key = `uploads/${randomUUID()}.${file.type.split("/")[1]}`;

        // Llamamos a nuestra utilidad mágica
        const url = await uploadFile(buffer, key, file.type);

        return NextResponse.json({ url });
    } catch (error: any) {
        console.error("Error subiendo imagen:", error);
        return NextResponse.json({ error: 'Error al subir imagen' }, { status: 500 });
    }
}