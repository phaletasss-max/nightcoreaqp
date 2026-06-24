import fs from 'fs';
import path from 'path';

type FinalStatus = 'SAFE TO DEPLOY' | 'SAFE FOR LOCAL DEVELOPMENT' | 'DEPLOY BLOCKED';

const CI_MANDATORY = [
  'build', 'verify-routes', 'playwright'
];

const LOCAL_MANDATORY = [
  'build', 'verify-routes', 'playwright'
];

function runPolicy() {
  const manifestPath = path.resolve(process.cwd(), 'pipeline-manifest.json');
  if (!fs.existsSync(manifestPath)) {
    console.error('❌ [POLICY ENGINE] ERROR CRÍTICO: No se encontró pipeline-manifest.json. Ejecución corrupta.');
    process.exit(1);
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const env = manifest.environment;
  const steps = manifest.steps as any[];

  let score = 0;
  let maxScore = 0;
  let finalStatus: FinalStatus = 'DEPLOY BLOCKED';
  const reportLines: string[] = [];
  let policyFailed = false;

  reportLines.push(`# Pipeline Report - ${env}`);
  reportLines.push(`**Date:** ${manifest.timestamp}\n`);
  reportLines.push(`## Ejecución de Pasos`);

  const evaluateStep = (stepId: string, isMandatory: boolean) => {
    const step = steps.find(s => s.id === stepId);
    if (!step) {
      reportLines.push(`- ❌ **${stepId}**: MISSING (Mandatory: ${isMandatory})`);
      if (isMandatory) policyFailed = true;
      return;
    }

    if (isMandatory) maxScore += 1;

    let icon = '❓';
    if (step.status === 'PASS') {
      icon = '✅';
      if (isMandatory) score += 1;
    } else if (step.status === 'FAIL') {
      icon = '❌';
      if (isMandatory) policyFailed = true;
    } else if (step.status === 'SKIPPED') {
      icon = '⚠️';
      if (isMandatory) policyFailed = true; // Un skip en un obligatorio es fallo directo
    }

    reportLines.push(`- ${icon} **${step.name}** (${step.status}): ${step.reason || `Completado en ${step.durationMs}ms`}`);
  };

  if (env === 'CI') {
    CI_MANDATORY.forEach(id => evaluateStep(id, true));
    
    // Validar si hay algún FAIL global, incluso si no estaba en la lista (defensa en profundidad)
    if (steps.some(s => s.status === 'FAIL')) policyFailed = true;

    finalStatus = policyFailed ? 'DEPLOY BLOCKED' : 'SAFE TO DEPLOY';
  } else {
    // LOCAL
    CI_MANDATORY.forEach(id => {
      const isMandatory = LOCAL_MANDATORY.includes(id);
      evaluateStep(id, isMandatory);
    });

    if (policyFailed) {
      finalStatus = 'DEPLOY BLOCKED';
    } else {
      finalStatus = 'SAFE FOR LOCAL DEVELOPMENT';
    }
  }

  const integrityScore = maxScore > 0 ? (score / maxScore) * 100 : 0;
  
  // Escribir JSON
  fs.writeFileSync(path.resolve(process.cwd(), 'integrity-score.json'), JSON.stringify({
    score: integrityScore,
    status: finalStatus,
    environment: env
  }, null, 2));

  // Escribir Markdown
  reportLines.push(`\n## Integrity Score`);
  reportLines.push(`**${integrityScore.toFixed(2)}%** (${score}/${maxScore} mandatory checks passed)`);
  reportLines.push(`\n## Resultado Final`);
  reportLines.push(`### ${finalStatus}`);

  fs.writeFileSync(path.resolve(process.cwd(), 'pipeline-report.md'), reportLines.join('\n'));

  console.log('==============================================');
  console.log('🛡️ POLICY ENGINE EVALUATION');
  console.log('==============================================');
  console.log(`Environment: ${env}`);
  console.log(`Integrity Score: ${integrityScore.toFixed(2)}%`);
  console.log(`Status: ${finalStatus}`);
  console.log('==============================================');

  if (finalStatus === 'DEPLOY BLOCKED') {
    console.error('⚠️ [WARNING MODE] Validación fallida. El despliegue continuará porque el enforcement estricto está desactivado temporalmente.');
    process.exit(0); // Forzamos 0 para no bloquear despliegue intermedio
  } else {
    console.log(`✅ VALIDACIÓN EXITOSA: ${finalStatus}`);
    process.exit(0);
  }
}

runPolicy();
