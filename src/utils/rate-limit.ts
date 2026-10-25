import { Request } from 'express';

/** Límite simple en memoria (el backend corre en una sola instancia). */
const buckets = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
    const now = Date.now();

    if (buckets.size > 5000) {
        for (const [k, v] of buckets) {
            if (v.resetAt < now) buckets.delete(k);
        }
    }

    const entry = buckets.get(key);
    if (!entry || entry.resetAt < now) {
        buckets.set(key, { count: 1, resetAt: now + windowMs });
        return true;
    }

    entry.count += 1;
    return entry.count <= limit;
}

/**
 * IP real del cliente.
 * Orden: Cloudflare (cf-connecting-ip) → X-Real-IP → X-Forwarded-For → req.ip.
 * Cloudflare envía cada petición desde una IP de borde distinta, así que
 * leer X-Forwarded-For daría una clave nueva por request y el límite no aplicaría.
 */
export function clientIp(req: Request): string {
    const cf = req.headers['cf-connecting-ip'];
    if (typeof cf === 'string' && cf.trim().length > 0) return cf.trim();

    const real = req.headers['x-real-ip'];
    if (typeof real === 'string' && real.trim().length > 0) return real.trim();

    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string' && forwarded.length > 0) {
        return forwarded.split(',')[0].trim();
    }

    return req.ip || 'unknown';
}

export const DEMO_LOGIN_LIMIT = { limit: 10, windowMs: 10 * 60 * 1000 };
export const DEMO_CHAT_LIMIT = { limit: 40, windowMs: 30 * 60 * 1000 };
