import type { NextConfig } from "next";

const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      // Scripts: agregar blob: para workers de PDF
      "script-src 'self' https://accounts.google.com https://apis.google.com https://www.google.com https://www.gstatic.com https://cdn.opencollection.com https://lh3.googleusercontent.com https://www.youtube.com https://s.ytimg.com 'unsafe-inline' 'unsafe-eval' blob:",
      // Estilos: sin cambios
      "style-src 'self' https://cdn.opencollection.com https://fonts.googleapis.com https://www.youtube.com https://s.ytimg.com 'unsafe-inline'",
      // Imágenes: sin cambios
      "img-src 'self' data: https://*.googleusercontent.com https://*.ytimg.com https://*.youtube.com https://cdn.jsdelivr.net https://pics.avs.io https://lh3.googleusercontent.com https://minio-api.noxcreation.dev",
      // Fuentes: agregar data: para fuentes incrustadas
      "font-src 'self' data:",
      // Conexiones: agregar data: y blob:
      "connect-src 'self' https://www.youtube.com https://*.youtube.com https://*.ytimg.com data: blob:",
      // Frames: agregar blob: para iframe del PDFViewer
      "frame-src https://accounts.google.com https://www.youtube.com https://www.youtube-nocookie.com blob:",
      // Workers: nueva directiva
      "worker-src 'self' blob:",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
      "upgrade-insecure-requests"
    ].join('; ')
  },
  { key: 'X-Powered-By', value: '' },
];

const nextConfig: NextConfig = {
  allowedDevOrigins: ['127.0.0.1'],
  headers: async () => [{ source: '/(.*)', headers: securityHeaders.filter(h => !['Content-Security-Policy','Strict-Transport-Security','X-Powered-By'].includes(h.key)) }],
  images: { unoptimized: true },
  poweredByHeader: false
};

export default nextConfig;
