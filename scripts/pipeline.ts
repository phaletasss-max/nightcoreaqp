import { execSync, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

type StepStatus = 'PENDING' | 'PASS' | 'FAIL' | 'SKIPPED';

interface Step {
  id: string;
  name: string;
  command: string;
  abortPipelineOnFail: boolean; // Solo para el runner: si falla, no tiene sentido seguir
  status: StepStatus;
  reason?: string;
  durationMs?: number;
}

const isCI = !!process.env.CI;
const environment = isCI ? 'CI' : 'LOCAL';

let pipelineSteps: Step[] = [
  { id: 'verify-env', name: 'Variables de Entorno', command: 'npx tsx scripts/verify-env.ts', abortPipelineOnFail: false, status: 'PENDING' },
  { id: 'verify-media-service', name: 'Media Service', command: 'npx tsx scripts/verify-media-service.ts', abortPipelineOnFail: false, status: 'PENDING' },
  { id: 'verify-supabase', name: 'Conexión Supabase', command: 'npx tsx scripts/verify-supabase.ts', abortPipelineOnFail: false, status: 'PENDING' },
  { id: 'verify-schema', name: 'Esquema de BD', command: 'npx tsx scripts/verify-schema.ts', abortPipelineOnFail: false, status: 'PENDING' },
  { id: 'build', name: 'Compilación Next.js', command: 'npm run build', abortPipelineOnFail: true, status: 'PENDING' },
  { id: 'verify-routes', name: 'Rutas HTTP', command: 'npx tsx scripts/verify-routes.ts', abortPipelineOnFail: true, status: 'PENDING' },
  { id: 'verify-mobile-api', name: 'API Móvil', command: 'npx tsx scripts/verify-mobile-api.ts', abortPipelineOnFail: true, status: 'PENDING' },
  { id: 'verify-ui-contracts', name: 'Contratos UI', command: 'npx tsx scripts/verify-ui-contracts.ts', abortPipelineOnFail: true, status: 'PENDING' },
  { id: 'playwright', name: 'Smoke Tests', command: 'npx playwright test', abortPipelineOnFail: true, status: 'PENDING' },
];

let pipelineAborted = false;
let skipExternal = false;
const startTime = Date.now();

function dumpManifest() {
  const manifest = {
    timestamp: new Date().toISOString(),
    environment,
    totalDurationMs: Date.now() - startTime,
    steps: pipelineSteps.map(s => ({
      id: s.id,
      name: s.name,
      status: s.status,
      reason: s.reason,
      durationMs: s.durationMs
    }))
  };

  fs.writeFileSync(path.resolve(process.cwd(), 'pipeline-manifest.json'), JSON.stringify(manifest, null, 2));
}

async function waitOn(url: string, timeoutMs: number): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return true;
    } catch { /* ignore */ }
    await new Promise(r => setTimeout(r, 1000));
  }
  return false;
}

async function runPipeline() {
  console.log('==============================================');
  console.log(`🚀 PIPELINE RUNNER - Recolección de datos - ENTORN: ${environment}`);
  console.log('==============================================\n');

  let serverProcess: any = null;

  for (let i = 0; i < pipelineSteps.length; i++) {
    const step = pipelineSteps[i];

    if (pipelineAborted) {
      step.status = 'SKIPPED';
      step.reason = 'Pipeline runner abortado por un fallo crítico de ejecución.';
      continue;
    }

    // No external dependencies to skip in this intermediate version


    if (step.id === 'verify-routes') {
      console.log('>>> Levantando servidor de pruebas HTTP en el puerto 3092...');
      serverProcess = spawn('npm', ['run', 'start:test'], { stdio: 'ignore', shell: true });
      const isUp = await waitOn('http://localhost:3092/api/health', 30000);
      if (!isUp) {
        console.error('❌ El servidor temporal no levantó.');
        step.status = 'FAIL';
        step.reason = 'Time-out esperando a que localhost:3092 responda.';
        pipelineAborted = true;
        continue;
      }
    }

    console.log(`>>> Ejecutando [${step.id}]: ${step.name}...`);
    const stepStart = Date.now();
    try {
      execSync(step.command, { stdio: 'inherit' });
      step.status = 'PASS';
    } catch (error: any) {
      step.status = 'FAIL';
      step.reason = error.message || 'El comando retornó código de salida no cero.';

      if (step.abortPipelineOnFail) {
        pipelineAborted = true; // No podemos compilar o correr tests
      }
    }
    step.durationMs = Date.now() - stepStart;
  }

  if (serverProcess) {
    serverProcess.kill();
  }

  dumpManifest();
  console.log('\n✅ [RUNNER] Recolección completada. Manifest guardado en pipeline-manifest.json');
  console.log('✅ [RUNNER] Delegando decisión al Policy Engine (ci-policy.ts)...\n');
  process.exit(0); // El runner SIEMPRE sale con 0 si logra escribir el manifest.
}

runPipeline();
