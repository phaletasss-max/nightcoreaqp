#!/bin/bash
echo "[VALIDATION] Verifying Database Connection (Supabase)..."

if [ -f .env.local ]; then
  source .env.local
fi

URL="$NEXT_PUBLIC_SUPABASE_URL/rest/v1/"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$URL" -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY")

if [ "$RESPONSE" == "200" ] || [ "$RESPONSE" == "404" ] || [ "$RESPONSE" == "401" ]; then
  # 404 or 401 on base route still means Supabase API is resolving correctly, not a DNS failure.
  echo "✅ Database connection is responding."
  exit 0
else
  echo "❌ ERROR: Database unreachable at $URL (HTTP $RESPONSE)."
  exit 1
fi
