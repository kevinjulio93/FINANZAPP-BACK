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

/** IP real del cliente (detrás de Traefik/Dokploy). */
export function clientIp(req: Request): string {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string' && forwarded.length > 0) {
        return forwarded.split(',')[0].trim();
    }
    return req.ip || 'unknown';
}

export const DEMO_LOGIN_LIMIT = { limit: 10, windowMs: 10 * 60 * 1000 };
export const DEMO_CHAT_LIMIT = { limit: 40, windowMs: 30 * 60 * 1000 };
