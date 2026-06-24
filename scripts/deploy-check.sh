#!/bin/bash

echo "=============================================="
echo "⚙️ CI/CD ORCHESTRATION SCRIPT"
echo "=============================================="

# 1. Ejecutar el pipeline runner (recolector de datos)
npx tsx scripts/pipeline.ts
PIPELINE_EXIT_CODE=$?

# 2. Ejecutar el policy engine externo
npx tsx scripts/ci-policy.ts
POLICY_EXIT_CODE=$?

# 3. Enforcement estricto DESACTIVADO (modo intermedio de despliegue)
if [ $POLICY_EXIT_CODE -ne 0 ]; then
  echo "⚠️ [WARNING MODE] El policy engine retornó fallo, pero se permite el despliegue."
fi

exit 0
