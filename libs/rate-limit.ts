/*
TODO:
Actualmente usas un Map en memoria dentro del proceso de Node.js. Si tu VPS ejecuta un solo contenedor (una sola instancia de Next.js), funciona 
perfectamente. Si más adelante escalas a dos contenedores (por balanceo de carga), cada uno tendrá su propio Map, y un usuario podría hacer 5 
peticiones a cada contenedor en 3 segundos → total 10. No es exacto, pero para un dashboard público probablemente sea suficiente. Si necesitas exactitud, 
entonces sí tendrías que usar Redis (como comentamos).
*/

interface RateLimitRecord {
    count: number;
    resetTime: number; // timestamp en ms cuando se reinicia el contador
}

class InMemoryRateLimiter {
    private store: Map<string, RateLimitRecord> = new Map();
    private readonly windowMs: number;
    private readonly maxRequests: number;

    constructor(options: { windowMs: number; maxRequests: number }) {
        this.windowMs = options.windowMs;
        this.maxRequests = options.maxRequests;
        // Limpiar entradas expiradas cada 5 minutos

    }


    async limit(identifier: string): Promise<{
        success: boolean;
        reset: number;
        remaining: number;
        limit: number;
    }> {
        const now = Date.now();
        if (this.store.size > 1000) for (const [k,v] of this.store) if (v.resetTime < now) this.store.delete(k);
        const record = this.store.get(identifier);

        if (!record || now > record.resetTime) {
            // Nuevo período
            const resetTime = now + this.windowMs;
            this.store.set(identifier, {
                count: 1,
                resetTime: resetTime,
            });
            return {
                success: true,
                reset: resetTime,
                remaining: this.maxRequests - 1,
                limit: this.maxRequests,
            };
        }

        // Período activo
        if (record.count < this.maxRequests) {
            record.count++;
            this.store.set(identifier, record);
            return {
                success: true,
                reset: record.resetTime,
                remaining: this.maxRequests - record.count,
                limit: this.maxRequests,
            };
        }

        // Límite excedido
        return {
            success: false,
            reset: record.resetTime,
            remaining: 0,
            limit: this.maxRequests,
        };
    }

    // Opcional: método para obtener estadísticas (para debug)
    getStats() {
        return {
            size: this.store.size,
            keys: Array.from(this.store.keys()),
        };
    }
}

// Configuración: 5 peticiones cada 3 segundos
export const rateLimiter = new InMemoryRateLimiter({
    windowMs: 3 * 1000, // 1 minuto = 60, aca 3 => 3 segundos
    maxRequests: 5,
});