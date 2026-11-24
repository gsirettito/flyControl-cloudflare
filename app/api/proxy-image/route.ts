import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    try {
        const url = req.nextUrl.searchParams.get('url');

        if (!url) {
            return NextResponse.json({ error: 'Falta el parámetro "url"' }, { status: 400 });
        }

        // Validar que sea una URL absoluta y use http o https
        let parsedUrl: URL;
        try {
            parsedUrl = new URL(url);
        } catch {
            return NextResponse.json({ error: 'URL inválida' }, { status: 400 });
        }
        

        if (parsedUrl.protocol !== 'https:' || parsedUrl.username || parsedUrl.password || parsedUrl.port) {
            return NextResponse.json({ error: 'Protocolo no soportado' }, { status: 400 });
        }

        // Evitar URLs locales o de bucle (para prevenir SSRF limitado)
        const hostname = parsedUrl.hostname;
        const allowed = ['pics.avs.io','cdn.jsdelivr.net','lh3.googleusercontent.com', ...(process.env.IMAGE_PROXY_HOSTS || '').split(',').map(x=>x.trim()).filter(Boolean)];
        if (!allowed.includes(hostname)) return NextResponse.json({error:'Host no permitido'}, {status:403});
        console.log("hostname", hostname)
        if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.endsWith('.local')) {
            return NextResponse.json({ error: 'No se permite acceder a recursos locales' }, { status: 403 });
        }

        // Opcional: permitir solo extensiones de imagen comunes (puedes ajustar)
        const pathname = parsedUrl.pathname.toLowerCase();
        const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp'];
        const isImage = imageExtensions.some(ext => pathname.endsWith(ext));
        if (!isImage && !url.includes('data:image')) {
            // Si no tiene extensión de imagen, aun así intentamos obtenerlo
            // pero podrías devolver error si quieres restringir más.
            // Por ahora lo dejamos pasar.
        }

        // Realizar la petición al servidor externo
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000); // 10 segundos máximo

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; OTP-Cuba-Proxy/1.0)',
            },
            signal: controller.signal, redirect: "error",
        });

        clearTimeout(timeout);

        if (!response.ok) {
            return NextResponse.json(
                { error: `Error al obtener la imagen: ${response.status} ${response.statusText}` },
                { status: response.status }
            );
        }

        // Verificar que el tipo de contenido sea una imagen
        const contentType = response.headers.get('content-type');
        if (!contentType || !['image/png','image/jpeg','image/webp','image/gif'].includes(contentType.split(';')[0])) {
            return NextResponse.json({ error: 'El recurso no es una imagen válida' }, { status: 400 });
        }

        // Leer el buffer de la imagen
        const reader = response.body?.getReader();
        if (!reader) return NextResponse.json({error:'Sin imagen'},{status:400});
        const chunks: Uint8Array[] = []; let size = 0;
        for (;;) { const {done,value} = await reader.read(); if (done) break; size += value.byteLength; if (size > 5*1024*1024) { await reader.cancel(); return NextResponse.json({error:'Imagen demasiado grande'},{status:413}); } chunks.push(value); }
        const buffer = Buffer.concat(chunks);

        // Crear respuesta con los headers adecuados
        return new NextResponse(buffer, {
            status: 200,
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=86400', // cache por 1 día
                'Content-Length': buffer.byteLength.toString(),
            },
        });
    } catch (error: any) {
        console.error('Error en proxy de imagen:', error);
        return NextResponse.json(
            { error: error.message || 'Error interno del servidor' },
            { status: 500 }
        );
    }
}