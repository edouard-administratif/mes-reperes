import { access, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import { build } from 'esbuild';

const root = fileURLToPath(new URL('../', import.meta.url));
let executable;
for (const candidate of [process.env.CHROME_BIN, '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'].filter(Boolean)) {
  try { await access(candidate); executable = candidate; break; } catch {}
}
if (!executable) throw new Error('Chromium ou Google Chrome est requis pour le test navigateur.');
const directory = await mkdtemp(join(tmpdir(), 'mes-reperes-browser-'));
try {
  const fixture = await build({
    entryPoints: [join(root, 'test/browser-scenario.js')],
    bundle: true, format: 'iife', platform: 'browser', target: 'chrome109', write: false,
  });
  const source = fixture.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');
  const css = pathToFileURL(join(root, 'dist/js/app.css')).href;
  const template = await readFile(join(root, 'src/index.html'), 'utf8');
  const html = template.replace('./js/app.css', css).replace('<script type="module" src="./js/app.js"></script>', () => `<script>${source}</script>`);
  const path = join(directory, 'test.html');
  await writeFile(path, html);
  const browser = spawnSync(executable, [
    '--headless', '--no-sandbox', '--disable-dev-shm-usage', '--disable-background-networking',
    '--allow-file-access-from-files', '--window-size=390,844', '--virtual-time-budget=10000',
    '--user-data-dir=' + join(directory, 'profile'), '--dump-dom', pathToFileURL(path).href,
  ], { encoding: 'utf8', timeout: 30000, maxBuffer: 4 * 1024 * 1024 });
  if (browser.error) throw browser.error;
  if (browser.status !== 0 || !browser.stdout.includes('data-status="passed"')) {
    const report = browser.stdout.match(/<output id="browser-test-result"[^>]*>[\s\S]*?<\/output>/)?.[0];
    throw new Error(report || browser.stderr.slice(-3000) || 'Le test Chromium ne s’est pas terminé.');
  }
  console.log('Test Chromium réussi : onglets, réglages modaux, maximums, semaines, journal et swipe.');
} finally { await rm(directory, { recursive: true, force: true }); }
