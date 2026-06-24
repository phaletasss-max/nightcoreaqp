import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

type FinalStatus = 'SAFE TO DEPLOY' | 'DEPLOY BLOCKED';

const MANDATORY_CHECKS = [
  'verify-env', 'verify-media-service', 'verify-supabase', 'verify-schema',
  'build', 'verify-routes', 'verify-mobile-api', 'verify-ui-contracts', 'playwright'
];

function runPolicy() {
  const manifestPath = path.resolve(process.cwd(), 'pipeline-manifest.json');
  if (!fs.existsSync(manifestPath)) {
    console.error('❌ [POLICY ENGINE] ERROR CRÍTICO: No se encontró pipeline-manifest.json. Ejecución corrupta.');
    process.exit(1);
  }

  const fileContent = fs.readFileSync(manifestPath, 'utf8');
  const actualHash = crypto.createHash('sha256').update(fileContent).digest('hex');
  const expectedHash = process.env.MANIFEST_HASH;

  if (expectedHash && actualHash !== expectedHash) {
    console.error('❌ [POLICY ENGINE] ERROR CRÍTICO: El hash del manifest no coincide. Posible inyección detectada.');
    process.exit(1);
  }

  const manifest = JSON.parse(fileContent);
  const env = manifest.environment;
  const steps = manifest.steps as any[];

  let score = 0;
  let maxScore = 0;
  let finalStatus: FinalStatus = 'DEPLOY BLOCKED';
  const reportLines: string[] = [];
  let policyFailed = false;

  reportLines.push(`# Pipeline Report - SECURE MODE`);
  reportLines.push(`**Date:** ${manifest.timestamp}`);
  reportLines.push(`**Hash Integridad:** ${actualHash}\n`);
  reportLines.push(`## Ejecución de Pasos`);

  const evaluateStep = (stepId: string) => {
    const step = steps.find(s => s.id === stepId);
    maxScore += 1;
    if (!step) {
      reportLines.push(`- ❌ **${stepId}**: MISSING`);
      policyFailed = true;
      return;
    }

    let icon = '❓';
    if (step.status === 'PASS') {
      icon = '✅';
      score += 1;
    } else if (step.status === 'FAIL' || step.status === 'SKIPPED') {
      icon = step.status === 'FAIL' ? '❌' : '⚠️';
      policyFailed = true;
    }

    reportLines.push(`- ${icon} **${step.name}** (${step.status}): ${step.reason || `Completado en ${step.durationMs}ms`}`);
  };

  MANDATORY_CHECKS.forEach(id => evaluateStep(id));

  if (steps.some(s => s.status === 'FAIL')) policyFailed = true;

  finalStatus = policyFailed ? 'DEPLOY BLOCKED' : 'SAFE TO DEPLOY';

  const integrityScore = maxScore > 0 ? (score / maxScore) * 100 : 0;
  
  // Escribir JSON
  fs.writeFileSync(path.resolve(process.cwd(), 'integrity-score.json'), JSON.stringify({
    score: integrityScore,
    status: finalStatus,
    hash: actualHash
  }, null, 2));

  // Escribir Markdown
  reportLines.push(`\n## Integrity Score`);
  reportLines.push(`**${integrityScore.toFixed(2)}%** (${score}/${maxScore} mandatory checks passed)`);
  reportLines.push(`\n## Resultado Final`);
  reportLines.push(`### ${finalStatus}`);

  fs.writeFileSync(path.resolve(process.cwd(), 'pipeline-report.md'), reportLines.join('\n'));

  console.log('==============================================');
  console.log('🛡️ ZERO TRUST POLICY ENGINE');
  console.log('==============================================');
  console.log(`Integrity Score: ${integrityScore.toFixed(2)}%`);
  console.log(`Status: ${finalStatus}`);
  console.log(`Manifest Hash: ${actualHash}`);
  console.log('==============================================');

  if (finalStatus === 'DEPLOY BLOCKED') {
    console.error('❌ VALIDACIÓN FALLIDA: Política estricta de Zero Trust ha bloqueado el despliegue.');
    process.exit(1);
  } else {
    console.log(`✅ VALIDACIÓN EXITOSA: ${finalStatus}`);
    process.exit(0);
  }
}

runPolicy();
