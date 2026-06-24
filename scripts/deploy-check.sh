#!/bin/bash

echo "=============================================="
echo "⚙️ CI/CD ZERO TRUST ORCHESTRATION"
echo "=============================================="

# 0. Limpiar estado fantasma
rm -f pipeline-manifest.json integrity-score.json pipeline-report.md

# 1. Ejecutar el pipeline runner (Data Collector)
npx tsx scripts/pipeline.ts
PIPELINE_EXIT_CODE=$?

# 2. Hashing de seguridad para evitar State Spoofing
if [ ! -f pipeline-manifest.json ]; then
  echo "❌ [ENFORCEMENT] ERROR CRÍTICO: No se generó pipeline-manifest.json"
  exit 1
fi

# Generar hash sha256. Windows / Linux compatible con node si no tenemos sha256sum
export MANIFEST_HASH=$(node -e "const fs=require('fs'); const crypto=require('crypto'); console.log(crypto.createHash('sha256').update(fs.readFileSync('pipeline-manifest.json','utf8')).digest('hex'));")

# 3. Ejecutar el policy engine externo (Zero Trust)
npx tsx scripts/ci-policy.ts
POLICY_EXIT_CODE=$?

# 4. Enforcement estricto
if [ $POLICY_EXIT_CODE -ne 0 ]; then
  echo "❌ [ENFORCEMENT] Deploy abortado por el Policy Engine."
  exit 1
fi

exit 0
