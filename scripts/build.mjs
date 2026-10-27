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
  // sql.js has a Node-only branch; browsers use Web Crypto and the supplied WASM bytes.
  external: ['fs', 'path', 'crypto'],
  target: ['chrome109'],
  outbase: 'src/js',
  loader: { '.wasm': 'binary', '.svg': 'file', '.png': 'file', '.woff2': 'file', '.woff': 'file', '.ttf': 'file', '.eot': 'file' },
  logLevel: 'info',
});
await cp(resolve(root, 'src/index.html'), resolve(output, 'index.html'));
// Copy notices for the libraries shipped with the app.
const notices = [];
for (const name of ['@capacitor/core', '@capacitor/filesystem', '@capacitor/share', '@capacitor/synapse', '@capacitor-community/sqlite', 'remixicon', 'sql.js']) {
  for (const filename of ['LICENSE', 'LICENSE.md', 'LICENSE.txt', 'License']) {
    try {
      const text = await readFile(resolve(root, 'node_modules', name, filename), 'utf8');
      notices.push(`${name}\n${text}`);
      break;
    } catch {}
  }
}
await writeFile(resolve(output, 'THIRD_PARTY_NOTICES.txt'), notices.join('\n\n---\n\n'));
console.log('Application Web et ressources locales préparées dans dist/.');

// Single-file distribution: no module imports, external fonts or WASM requests.
const standalone = await build({
  absWorkingDir: root,
  entryPoints: ['src/js/app.js'],
  outfile: 'standalone.js',
  bundle: true,
  splitting: false,
  format: 'iife',
  platform: 'browser',
  // sql.js has a Node-only branch; browsers use Web Crypto and the supplied WASM bytes.
  external: ['fs', 'path', 'crypto'],
  target: ['chrome109'],
  minify: true,
  write: false,
  loader: { '.wasm': 'binary', '.svg': 'dataurl', '.png': 'dataurl', '.woff2': 'dataurl', '.woff': 'dataurl', '.ttf': 'dataurl', '.eot': 'dataurl' },
});
const javascript = standalone.outputFiles.find(file => file.path.endsWith('.js')).text;
const css = standalone.outputFiles.find(file => file.path.endsWith('.css')).text;
const template = await readFile(resolve(root, 'src/index.html'), 'utf8');
const html = template
  .replace('<link rel="stylesheet" href="./js/app.css">', () => `<style>${css.replace(/<\/style/gi, '<\\/style')}</style>`)
  .replace('</head>', () => `<script type="text/plain" id="third-party-notices">${notices.join('\n\n---\n\n').replace(/<\/script/gi, '<\\/script')}</script></head>`)
  .replace('<script type="module" src="./js/app.js"></script>', () => `<script>${javascript.replace(/<\/script/gi, '<\\/script')}</script>`);
await writeFile(resolve(output, 'mes-reperes-hors-ligne.html'), html);
console.log('HTML autonome : dist/mes-reperes-hors-ligne.html');
