/**
 * Configuración de la cuenta demo pública.
 * El usuario demo se crea con `scripts/seed-demo.ts` (o el seed de Mongo)
 * y siempre es de SOLO LECTURA: puede ver y consultar la IA, pero no escribir.
 */
export const DEMO_USER_EMAIL = (process.env.DEMO_USER_EMAIL || 'demo@finanzapp.com').toLowerCase();

export const DEMO_WRITE_ERROR =
    'Esta es una cuenta demo de solo lectura. Crea tu propia cuenta para modificar datos.';

export const isDemoEmail = (email?: string | null): boolean =>
    !!email && email.toLowerCase() === DEMO_USER_EMAIL;
