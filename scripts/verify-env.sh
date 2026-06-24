#!/bin/bash
echo "[VALIDATION] Verifying Environment Variables..."
REQUIRED_VARS=("NEXT_PUBLIC_SUPABASE_URL" "NEXT_PUBLIC_SUPABASE_ANON_KEY")

if [ -f .env.local ]; then
  source .env.local
fi

for var in "${REQUIRED_VARS[@]}"; do
  if [ -z "${!var}" ]; then
    echo "❌ ERROR: Variable $var is missing."
    exit 1
  fi
done
echo "✅ Environment variables verified."
exit 0
