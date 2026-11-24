// utils/emailTemplate.ts
import { emailTemplates } from './emailTemplates.generated';

interface EmailTemplateContext {
    [key: string]: string | number | null | undefined;
}

// 🔥 Caché en memoria para no leer el disco duro en cada envío de correo


/**
 * Carga y procesa una plantilla de email desde public/emails/
 */
export async function loadEmailTemplate(
    templateName: string,
    context?: EmailTemplateContext
): Promise<string> {
    const baseUrl = process.env.NEXTAUTH_URL || process.env.BASE_URL || 'http://localhost:3000';
    let html: string;

    html = emailTemplates[templateName];
    if (!html) throw new Error('Plantilla no encontrada');

    // 3. Reemplazar variables del contexto
    if (context) {
        html = replaceVariables(html, context);
    }

    // 4. Ajustar rutas de imágenes para que sean absolutas
    html = replaceImagePaths(html, templateName, baseUrl);

    return html;
}

/**
 * Reemplaza todas las ocurrencias de {variable} por su valor
 */
function replaceVariables(html: string, context: EmailTemplateContext): string {
    return html.replace(/\{(\w+)\}/g, (match, key) => {
        // Si la variable no existe en el contexto, la dejamos tal cual o la vaciamos.
        // Aquí la vaciamos para que no salga "{variable}" en el correo.
        return context[key] != null ? (key === 'content' ? String(context[key]) : String(context[key]).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')) : '';
    });
}

/**
 * Convierte rutas relativas de imágenes (src="images/...") a URLs absolutas
 */
function replaceImagePaths(html: string, templateName: string, baseUrl: string): string {
    const imagesBaseUrl = `${baseUrl}/emails/${templateName}/images`;

    // 🔥 FIX: Retorna dinámicamente si era 'src' o 'href' en lugar de forzar siempre 'src'
    html = html.replace(/(src|href)="(images\/[^"]+)"/g, (_, attr, relativePath) => {
        return `${attr}="${imagesBaseUrl}/${relativePath.replace('images/', '')}"`;
    });

    return html;
}