#!/bin/bash
echo "[VALIDATION] Verifying Build & Linting..."
npm run lint && npm run build
if [ $? -eq 0 ]; then
  echo "✅ Build and Lint verified successfully."
  exit 0
else
  echo "❌ ERROR: Build or Linting failed."
  exit 1
fi
