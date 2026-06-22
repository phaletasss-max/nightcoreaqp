// ── Logger central ───────────────────────────────────────────────────────────
// Logs con prefijo [NQ][scope] para diagnosticar más rápido en consola.
// logError SIEMPRE imprime (también en prod) — clave para depurar Supabase/RLS.
// logInfo solo en desarrollo. Devuelve el error para poder encadenar.

const isDev = process.env.NODE_ENV !== 'production';

function fmt(scope: string, msg: string) {
  return `[NQ][${scope}] ${msg}`;
}

export function logError(scope: string, err: unknown, extra?: Record<string, unknown>): unknown {
  const msg = err instanceof Error ? err.message : (typeof err === 'string' ? err : JSON.stringify(err));
  // Supabase devuelve { message, code, details, hint } — los exponemos para diagnóstico.
  const detail = (err && typeof err === 'object') ? err as Record<string, unknown> : undefined;
  console.error(fmt(scope, msg), { ...(detail ? { code: detail.code, details: detail.details, hint: detail.hint } : {}), ...(extra || {}) });
  return err;
}

export function logWarn(scope: string, msg: string, extra?: Record<string, unknown>) {
  console.warn(fmt(scope, msg), extra || '');
}

export function logInfo(scope: string, msg: string, extra?: Record<string, unknown>) {
  if (isDev) console.log(fmt(scope, msg), extra || '');
}
