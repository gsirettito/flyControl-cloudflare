import { z } from 'zod';

export const getQuerySchema = z.object({
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().positive().max(100).optional().default(10),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
    groupBy: z.string().optional(),
    include: z.string().optional(),
}).catchall(z.string());

export const createBodySchema = z.object({
    data: z.record(z.string(), z.any()),
});

export const updateBodySchema = z.object({
    id: z.string(),
    data: z.record(z.string(), z.any()),
});

export const deleteBodySchema = z.object({
    id: z.string(),
});