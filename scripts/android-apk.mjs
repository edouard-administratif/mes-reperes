import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { access } from 'node:fs/promises';

const root = fileURLToPath(new URL('../android/', import.meta.url));
const wrapper = fileURLToPath(new URL(process.platform === 'win32' ? '../android/gradlew.bat' : '../android/gradlew', import.meta.url));
try { await access(wrapper); }
catch { throw new Error('Projet Android absent. Exécute npm run android:sync.'); }
const command = process.platform === 'win32' ? wrapper : 'sh';
const arguments_ = process.platform === 'win32' ? ['assembleDebug'] : [wrapper, 'assembleDebug'];
const result = spawnSync(command, arguments_, { cwd: root, stdio: 'inherit', shell: process.platform === 'win32' });
if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status ?? 1);
console.log('APK de test : android/app/build/outputs/apk/debug/app-debug.apk');
