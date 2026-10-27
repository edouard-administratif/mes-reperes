import { spawnSync } from 'node:child_process';
import { mkdir, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
// Pin the SDK image so successive builds use the same Java and Android tools.
const image = 'ghcr.io/cirruslabs/android-sdk:36@sha256:f9b3ea9ed2b5fc9522adae82c7b4622ab7aa54207ef532c8e615a347dca08f31';
const cache = resolve(root, '.cache/android-docker');

function run(command, args) {
  const result = spawnSync(command, args, { cwd: root, stdio: 'inherit' });
  if (result.error?.code === 'ENOENT') throw new Error(`${command} est absent. Installe Docker avant de lancer cette commande.`);
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

// Fail before rebuilding the Web bundle if Docker is unavailable.
run('docker', ['info', '--format', '{{.ServerVersion}}']);
run(process.execPath, [resolve(root, 'scripts/build.mjs')]);
run(process.execPath, [resolve(root, 'scripts/android-sync.mjs')]);

for (const directory of ['gradle', 'android', 'home']) {
  await mkdir(resolve(cache, directory), { recursive: true });
}

const args = ['run', '--rm', '--init'];
if (process.getuid && process.getgid) args.push('--user', `${process.getuid()}:${process.getgid()}`);
args.push(
  '--mount', `type=bind,source=${resolve(root, 'android')},target=/workspace/android`,
  '--mount', `type=bind,source=${resolve(root, 'node_modules')},target=/workspace/node_modules`,
  '--mount', `type=bind,source=${cache},target=/build-cache`,
  '--workdir', '/workspace/android',
  '--env', 'GRADLE_USER_HOME=/build-cache/gradle',
  '--env', 'ANDROID_USER_HOME=/build-cache/android',
  '--env', 'JAVA_TOOL_OPTIONS=-Duser.home=/build-cache/home',
  image, 'sh', 'gradlew', '--no-daemon', '--console=plain', 'assembleDebug',
);
run('docker', args);

const apk = resolve(root, 'android/app/build/outputs/apk/debug/app-debug.apk');
if (!(await stat(apk)).size) throw new Error('La compilation n’a pas produit un APK valide.');
console.log(`APK de test : ${apk}`);
