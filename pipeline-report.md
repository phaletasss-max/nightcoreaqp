# Pipeline Report - SECURE MODE
**Date:** 2026-07-06T21:44:08.674Z
**Hash Integridad:** 9b342e613d71b5f4a556374a22d2213125c93ef9fb68f840ecd4d6298df1853c

## Ejecución de Pasos
- ❌ **Variables de Entorno** (FAIL): Command failed: npx tsx scripts/verify-env.ts
- ❌ **Media Service** (FAIL): Command failed: npx tsx scripts/verify-media-service.ts
- ❌ **Conexión Supabase** (FAIL): Command failed: npx tsx scripts/verify-supabase.ts
- ❌ **Esquema de BD** (FAIL): Command failed: npx tsx scripts/verify-schema.ts
- ✅ **Compilación Next.js** (PASS): Completado en 12568ms
- ✅ **Rutas HTTP** (PASS): Completado en 1243ms
- ✅ **API Móvil** (PASS): Completado en 955ms
- ✅ **Contratos UI** (PASS): Completado en 1071ms
- ✅ **Smoke Tests** (PASS): Completado en 4773ms

## Integrity Score
**55.56%** (5/9 mandatory checks passed)

## Resultado Final
### DEPLOY BLOCKED