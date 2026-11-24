import { prisma } from "../prisma";

/**
 * Convierte los parámetros de búsqueda en un objeto `where` de Prisma.
 * Soporta operadores: like, in, gt, gte, lt, lte, between, y filtros sobre relaciones (relacion.campo).
 * Los campos de fecha (definidos en dateFields) se convierten a objetos Date UTC.
 */
export function buildWhere(searchParams: URLSearchParams): any {
    const where: any = {};
    const dateFields = ['createdAt', 'updatedAt'];

    const toNumberIfPossible = (val: string): number | string => {
        const num = Number(val);
        return isNaN(num) ? val : num;
    };

    for (const [key, value] of searchParams.entries()) {
        if (['page', 'limit', 'sortBy', 'sortOrder', 'groupBy', 'include'].includes(key)) continue;

        let field = key;
        let operator = 'eq';
        if (key.includes(':')) {
            const parts = key.split(':');
            field = parts[0];
            operator = parts[1];
        }

        let finalValue: any;
        const isDateField = dateFields.includes(field);

        switch (operator) {
            case 'like':
                finalValue = { contains: value, mode: 'insensitive' };
                break;
            case 'in':
                finalValue = { in: value.split(',') };
                break;
            case 'gt':
            case 'gte':
            case 'lt':
            case 'lte':
                if (isDateField) {
                    finalValue = { [operator]: new Date(value) };
                } else {
                    finalValue = { [operator]: toNumberIfPossible(value) };
                }
                break;
            case 'between':
                const [minRaw, maxRaw] = value.split(',');
                if (isDateField) {
                    finalValue = {};
                    if (minRaw) finalValue.gte = new Date(minRaw);
                    if (maxRaw) finalValue.lte = new Date(maxRaw);
                } else {
                    finalValue = {};
                    if (minRaw && minRaw !== '') finalValue.gte = toNumberIfPossible(minRaw);
                    if (maxRaw && maxRaw !== '') finalValue.lte = toNumberIfPossible(maxRaw);
                }
                break;
            default: // 'eq'
                if (value === 'true' || value === 'false') {
                    finalValue = value === 'true';
                } else {
                    finalValue = value;
                }
                break;
        }

        if (field.includes('.')) {
            const [relation, relField] = field.split('.');
            if (!where[relation]) where[relation] = {};
            where[relation][relField] = finalValue;
        } else {
            where[field] = finalValue;
        }
    }
    return where;
}

/**
 * Construye el objeto `orderBy` de Prisma a partir de los parámetros `sortBy` y `sortOrder`.
 * Si no se proporciona `sortBy`, devuelve `undefined`.
 */
export function buildOrderBy(searchParams: URLSearchParams): any | undefined {
    const sortBy = searchParams.get('sortBy');
    const sortOrder = searchParams.get('sortOrder') || 'asc';
    if (!sortBy) return undefined;
    return { [sortBy]: sortOrder };
}

/**
 * Construye el array `by` para `groupBy` de Prisma a partir del parámetro `groupBy`.
 * Si el valor es `undefined`, `"undefined"` o vacío, retorna `undefined`.
 */
export function buildGroupBy(searchParams: URLSearchParams): string[] | undefined {
    const groupBy = searchParams.get('groupBy');
    if (!groupBy || groupBy === 'undefined' || groupBy.trim() === '') return undefined;
    return groupBy.split(',');
}

/**
 * Construye el objeto `include` para relaciones de Prisma a partir del parámetro `include`.
 * Ejemplo: `?include=type,posts` se convierte en `{ type: true, posts: true }`.
 * Si no se proporciona `include`, retorna `undefined`.
 */
export function buildInclude(searchParams: URLSearchParams): any | undefined {
    const includeParam = searchParams.get('include');
    if (!includeParam) return undefined;

    const includes = includeParam.split(',');
    const includeObj: any = {};

    for (const inc of includes) {
        const parts = inc.trim().split('.');
        let current = includeObj;
        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            if (i === parts.length - 1) {
                current[part] = true;
            } else {
                if (!current[part]) current[part] = { include: {} };
                else if (current[part] === true) {
                    // Si ya era true y ahora hay más niveles, convertir a include
                    current[part] = { include: {} };
                }
                current = current[part].include;
            }
        }
    }
    return includeObj;
}

export function getPrismaModel(modelName: string) {
    /* if (!allowedModels.includes(modelName)) {
        throw new Error(`Modelo "${modelName}" no permitido`);
    } */
    const modelKey = modelName.charAt(0).toUpperCase() + modelName.slice(1);
    const model = (prisma as any)[modelKey];
    if (!model) throw new Error(`Modelo "${modelName}" no existe en Prisma`);
    return model;
}