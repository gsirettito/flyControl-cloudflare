import { Metadata } from 'next';

export function getMetadata({ 
    title = "FlyControl - ....",
    description = "...",
    image = "/social.webp",
    keywords = [] as string[],
}): Metadata {
    const baseUrl = process.env.NEXTAUTH_URL || 'https://flycontrol.toursofgracellc.com';
    const _title = `FlyControl | ${title}`;
    const _description = description || "...";
    const _image = image || "/social.webp";
    const fullImageUrl = _image.startsWith('http') ? _image : `${baseUrl}${_image}`;

    // Keywords por defecto para la plataforma OTP
    const defaultKeywords = [
        "OTP", "códigos de un solo uso", "verificación SMS", "autenticación en dos pasos",
        "2FA", "envío de OTP", "SMS API", "email OTP", "seguridad en transacciones",
        "Cuba", "NOX Creation"
    ];
    const finalKeywords = keywords.length ? keywords : defaultKeywords;

    return {
        title: _title,
        description: _description,
        keywords: finalKeywords,
        openGraph: {
            title: _title,
            description: _description,
            url: baseUrl,
            type: 'website',
            images: [{ url: fullImageUrl }],
        },
        twitter: {
            card: 'summary_large_image',
            title: _title,
            description: _description,
            images: [fullImageUrl],
        }
    };
}