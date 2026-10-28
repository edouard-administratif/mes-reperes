import { access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = fileURLToPath(new URL('../', import.meta.url));
const cli = fileURLToPath(new URL('../node_modules/@capacitor/cli/bin/capacitor', import.meta.url));
try { await access(cli); }
catch { throw new Error('Capacitor est absent. Exécute npm install.'); }

function cap(...arguments_) {
  const result = spawnSync(process.execPath, [cli, ...arguments_], { cwd: root, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
let androidExists = false;
try { await access(new URL('../android/app/build.gradle', import.meta.url)); androidExists = true; }
catch {}
if (!androidExists) cap('add', 'android');
cap('sync', 'android');
