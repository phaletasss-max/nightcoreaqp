#!/bin/bash
echo "[VALIDATION] Verifying Next.js Application Routes..."
ROUTES=("src/app/page.tsx" "src/app/admin/page.tsx" "src/app/disfraces/page.tsx" "src/app/playlist/page.tsx" "src/app/perfil/page.tsx")

for route in "${ROUTES[@]}"; do
  if [ ! -f "$route" ]; then
    echo "❌ ERROR: Required route $route is missing."
    exit 1
  fi
done
echo "✅ Essential application routes verified."
exit 0
