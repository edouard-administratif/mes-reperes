import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const { build } = await import('esbuild').catch(() => {
  throw new Error('Dépendances absentes. Exécute npm install avant de construire l’application.');
});
const output = resolve(root, 'dist');
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await build({
  absWorkingDir: root,
  entryPoints: ['src/js/app.js'],
  outdir: 'dist',
  entryNames: 'js/[name]',
  chunkNames: 'js/[name]-[hash]',
  assetNames: 'assets/[name]-[hash]',
  bundle: true,
  splitting: true,
  format: 'esm',
  platform: 'browser',
  target: ['chrome109'],
  // Keep every JS chunk next to app.js: its import.meta.url resolves bundled SQLite assets.
  outbase: 'src/js',
  loader: { '.svg': 'file', '.png': 'file', '.woff2': 'file', '.woff': 'file', '.ttf': 'file', '.eot': 'file' },
  logLevel: 'info',
});
await cp(resolve(root, 'src/index.html'), resolve(output, 'index.html'));
const sqliteDirectory = resolve(output, 'vendor/sqlite');
await mkdir(sqliteDirectory, { recursive: true });
for (const name of ['sql-wasm.js', 'sql-wasm.wasm']) {
  await cp(resolve(root, 'node_modules/sql.js/dist', name), resolve(sqliteDirectory, name));
}
// Copy notices for the libraries shipped with the app.
const notices = [];
for (const name of ['@capacitor/core', '@capacitor-community/sqlite', '@gouvfr/dsfr', 'remixicon', 'sql.js']) {
  for (const filename of ['LICENSE', 'LICENSE.md', 'LICENSE.txt']) {
    try {
      const text = await readFile(resolve(root, 'node_modules', name, filename), 'utf8');
      notices.push(`${name}\n${text}`);
      break;
    } catch {}
  }
}
await writeFile(resolve(output, 'THIRD_PARTY_NOTICES.txt'), notices.join('\n\n---\n\n'));
console.log('Application Web et ressources locales préparées dans dist/.');
