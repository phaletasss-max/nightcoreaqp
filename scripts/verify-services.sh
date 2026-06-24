#!/bin/bash
echo "[VALIDATION] Verifying External Services (Media-Service)..."

if [ -f .env.local ]; then
  source .env.local
fi

URL="${NEXT_PUBLIC_MEDIA_SERVICE_URL:-http://localhost:8787}/health"
echo "Testing $URL..."

RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$URL")
if [ "$RESPONSE" == "200" ]; then
  echo "✅ Media-Service is reachable and healthy."
  exit 0
else
  echo "❌ ERROR: Media-Service unreachable at $URL (HTTP $RESPONSE)."
  exit 1
fi
