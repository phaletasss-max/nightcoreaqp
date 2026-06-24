#!/bin/bash
echo "[VALIDATION] Verifying Internal API Endpoints structure..."
API_ROUTES=("src/app/api/crate/download/route.ts" "src/app/api/cron/cleanup/route.ts")

for route in "${API_ROUTES[@]}"; do
  if [ ! -f "$route" ]; then
    echo "❌ ERROR: Required API route $route is missing."
    exit 1
  fi
done
echo "✅ Essential API routes verified."
exit 0
