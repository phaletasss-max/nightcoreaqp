#!/bin/bash
echo "[VALIDATION] Verifying Auth Mechanisms..."
if grep -q "SupabaseClient" src/lib/data.ts && grep -q "createClient" src/lib/data.ts; then
  echo "✅ Authentication & Supabase bindings are present."
  exit 0
else
  echo "❌ ERROR: Supabase Auth bindings missing in src/lib/data.ts"
  exit 1
fi
