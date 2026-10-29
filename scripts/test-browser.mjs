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
    stdin: {
      resolveDir: root,
      contents: `
        import { mountUI } from './src/js/ui.js';
        import { createStore } from './src/js/store.js';
        import { emptyNotebook } from './src/js/notebook.js';
        const result = document.createElement('output');
        result.id = 'browser-test-result';
        document.body.append(result);
        const errors = [];
        window.addEventListener('error', event => errors.push(event.message));
        window.addEventListener('unhandledrejection', event => errors.push(String(event.reason)));
        const check = (condition, message) => { if (!condition) throw new Error(message); };
        const byId = id => document.getElementById(id);
        const settle = async () => {
          for (let i = 0; i < 100 && byId('app').inert; i++) await new Promise(resolve => setTimeout(resolve, 10));
          check(!byId('app').inert, 'Sauvegarde non terminée');
        };
        (async () => {
          let persisted = { ...emptyNotebook(), entries: [{ id: 'existing', date: '2026-10-25', type: 'food', cat: 'poultry', text: 'Volaille', portions: 1, meal: 'Déjeuner', preparation: 'Nature' }] };
          const store = createStore({
            read: () => persisted,
            write: async notebook => { persisted = structuredClone(notebook); return persisted; },
          });
          mountUI(store, { native: true });
          const toggles = [...document.querySelectorAll('#categories .food-group-toggle')];
          check(toggles.length === 7, 'Sept familles attendues');
          for (const toggle of toggles) {
            check(toggle.getAttribute('aria-expanded') === 'false', 'Famille ouverte au démarrage');
            check(getComputedStyle(byId(toggle.getAttribute('aria-controls'))).display === 'none', 'Panneau replié visible');
          }
          byId('day').value = '2026-11-01';
          byId('day').dispatchEvent(new Event('change'));
          check(byId('dayLabel').textContent === 'Dimanche', 'Libellé dimanche');
          byId('group-toggle-animal').click();
          check(!byId('group-panel-animal').hidden, 'Ouverture des viandes');
          byId('group-toggle-starters').click();
          check(byId('group-panel-animal').hidden, 'Fermeture de la famille précédente');
          byId('group-toggle-starters').click();
          check(byId('group-panel-starters').hidden, 'Fermeture par second clic');
          byId('group-toggle-animal').click();
          document.querySelector('[aria-label="En sauce · Viandes et poissons"]').click();
          document.querySelector('[aria-label="Ajouter : Volaille"]').click();
          await settle();
          check(persisted.entries.length === 2, 'Aliment seul, sans sauce automatique');
          check(!byId('group-panel-animal').hidden, 'État conservé après sauvegarde');
          document.querySelector('[aria-label="Gérer · Viandes et poissons"]').click();
          check(byId('categoryManagement').open && !byId('settings-group-panel-animal').hidden, 'Lien vers les réglages dépliés');
          document.querySelector('[aria-label="Masquer : Volaille"]').click();
          await settle();
          check(!document.querySelector('[aria-label="Ajouter : Volaille"]'), 'Catégorie décochée masquée');
          check(persisted.entries.length === 2, 'Historique conservé');
          document.querySelector('[aria-label="Saisir · Fruits et desserts"]').click();
          check(!byId('group-panel-extras').hidden && byId('group-panel-animal').hidden, 'Retour vers la saisie dépliée');
          document.querySelector('[aria-label="Masquer : Volaille"]').click();
          await settle();
          check(document.querySelector('[aria-label="Ajouter : Volaille"]'), 'Catégorie restaurée');
          check(!document.querySelector('[aria-label="Ajouter : Verre de vin"]'), 'Catégorie jamais consommée absente');
          document.querySelector('[aria-label="Noter une portion : Verre de vin"]').click();
          await settle();
          check(document.querySelector('[aria-label="Ajouter : Verre de vin"]'), 'Première consommation rend la catégorie disponible');
          const swipe = (dx, dy = 0, target = byId('produceSummary')) => {
            const start = new Touch({ identifier: 1, target, clientX: 200, clientY: 150 });
            const end = new Touch({ identifier: 1, target, clientX: 200 + dx, clientY: 150 + dy });
            target.dispatchEvent(new TouchEvent('touchstart', { bubbles: true, touches: [start] }));
            target.dispatchEvent(new TouchEvent('touchmove', { bubbles: true, touches: [end] }));
            target.dispatchEvent(new TouchEvent('touchend', { bubbles: true, touches: [], changedTouches: [end] }));
          };
          swipe(-100);
          check(byId('day').value === '2026-11-02' && byId('dayLabel').textContent === 'Lundi', 'Swipe vers le lendemain');
          swipe(100);
          check(byId('day').value === '2026-11-01', 'Swipe vers la veille');
          swipe(10, 100);
          swipe(100, 0, byId('day'));
          check(byId('day').value === '2026-11-01', 'Défilement et contrôles doivent être ignorés');
          byId('next').click();
          check(byId('dayLabel').textContent === 'Lundi', 'Libellé après flèche');
          check(document.documentElement.scrollWidth <= window.innerWidth, 'Débordement horizontal');
          check(errors.length === 0, errors.join('; '));
          result.dataset.status = 'passed';
          result.textContent = 'Accordéons, calendrier, gestes tactiles et saisie vérifiés dans Chromium.';
        })().catch(error => { result.dataset.status = 'failed'; result.textContent = error.stack; });
      `,
    },
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
    '--allow-file-access-from-files', '--window-size=390,844', '--virtual-time-budget=5000',
    '--user-data-dir=' + join(directory, 'profile'), '--dump-dom', pathToFileURL(path).href,
  ], { encoding: 'utf8', timeout: 30000, maxBuffer: 4 * 1024 * 1024 });
  if (browser.error) throw browser.error;
  if (browser.status !== 0 || !browser.stdout.includes('data-status="passed"')) {
    const report = browser.stdout.match(/<output id="browser-test-result"[^>]*>[\s\S]*?<\/output>/)?.[0];
    throw new Error(report || browser.stderr.slice(-3000) || 'Le test Chromium ne s’est pas terminé.');
  }
  console.log('Test Chromium réussi : accordéons, jours, swipe, saisie et absence de débordement.');
} finally { await rm(directory, { recursive: true, force: true }); }
