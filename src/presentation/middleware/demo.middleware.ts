import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { UserModel } from '../../infrastructure/models/User.model';
import { DEMO_USER_EMAIL, DEMO_WRITE_ERROR, isDemoEmail } from '../../config/demo';

/**
 * Rutas de escritura que la demo SÍ puede usar porque no modifican datos
 * del usuario (consultas a la IA, análisis de importación, login).
 */
const ALLOWED_WRITES: Array<{ method: string; path: string }> = [
    { method: 'POST', path: '/api/auth/login' },
    { method: 'POST', path: '/api/auth/demo' },
    { method: 'POST', path: '/api/auth/register' },
    { method: 'POST', path: '/api/auth/google' },
    { method: 'POST', path: '/api/chat' },
    { method: 'POST', path: '/api/chat/stream' },
    { method: 'POST', path: '/api/comparison' },
    { method: 'POST', path: '/api/import/analyze' },
];

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

let cachedDemoId: string | null = null;
let cachedDemoIdAt = 0;

/** Resuelve el `id` del usuario demo (cacheado 10 min) para bloquear escrituras sin token. */
async function getDemoUserId(): Promise<string | null> {
    if (cachedDemoId && Date.now() - cachedDemoIdAt < 10 * 60 * 1000) {
        return cachedDemoId;
    }
    const user = await UserModel.findOne({ email: DEMO_USER_EMAIL }).select('id').lean();
    cachedDemoId = (user as any)?.id ?? null;
    cachedDemoIdAt = Date.now();
    return cachedDemoId;
}

function tokenBelongsToDemo(req: Request): boolean {
    const header = req.headers.authorization;
    const token = header?.startsWith('Bearer ') ? header.slice(7) : header;
    if (!token) return false;
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as {
            email?: string;
        };
        return isDemoEmail(decoded?.email);
    } catch {
        return false;
    }
}

function targetUserId(req: Request): string | undefined {
    const body = req.body as any;
    return body?.userId || (req.query?.userId as string | undefined);
}

/**
 * Middleware global: la cuenta demo es de solo lectura.
 * - Bloquea cualquier método de escritura.
 * - Permite las rutas de consulta/IA listadas en ALLOWED_WRITES.
 * - También bloquea escrituras sin token cuyo `userId` apunte al usuario demo
 *   (algunas rutas del backend no exigen autenticación).
 */

/** Límite simple en memoria (una sola instancia del backend). */
const buckets = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
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

function clientIp(req: Request): string {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string' && forwarded.length > 0) {
        return forwarded.split(',')[0].trim();
    }
    return req.ip || 'unknown';
}

export const DemoReadOnly = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Límite de accesos a la demo por IP (evita minar créditos de IA)
        if (req.method === 'POST' && req.path === '/api/auth/demo') {
            if (!checkRateLimit(`demo-login:${clientIp(req)}`, 10, 10 * 60 * 1000)) {
                return res.status(429).json({
                    message: 'Demasiados accesos a la demo desde esta conexión. Intenta más tarde.',
                    code: 'DEMO_RATE_LIMITED',
                });
            }
        }

        if (SAFE_METHODS.has(req.method)) return next();

        const isAllowed = ALLOWED_WRITES.some(
            (r) => r.method === req.method && req.path.startsWith(r.path),
        );

        // Tope de mensajes de IA para la cuenta demo
        if (isAllowed && req.path.startsWith('/api/chat') && tokenBelongsToDemo(req)) {
            if (!checkRateLimit(`demo-chat:${clientIp(req)}`, 40, 30 * 60 * 1000)) {
                return res.status(429).json({
                    message: 'Alcanzaste el límite de mensajes de la demo (40 cada 30 minutos).',
                    code: 'DEMO_CHAT_LIMITED',
                });
            }
        }

        if (isAllowed) return next();

        if (tokenBelongsToDemo(req)) {
            return res.status(403).json({ message: DEMO_WRITE_ERROR, code: 'DEMO_READ_ONLY' });
        }

        const target = targetUserId(req);
        if (target) {
            const demoId = await getDemoUserId();
            if (demoId && String(target) === String(demoId)) {
                return res.status(403).json({ message: DEMO_WRITE_ERROR, code: 'DEMO_READ_ONLY' });
            }
        }

        return next();
    } catch (error) {
        // Ante cualquier fallo del guard no bloqueamos la app real.
        return next();
    }
};
