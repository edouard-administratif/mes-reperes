import { mountUI } from '../src/js/ui.js';
import { createStore } from '../src/js/store.js';
import { emptyNotebook, readNotebook } from '../src/js/notebook.js';
import { today, weekRange } from '../src/js/dates.js';

const result = document.createElement('output');
result.id = 'browser-test-result';
document.body.append(result);
const errors = [];
window.addEventListener('error', event => errors.push(event.message));
window.addEventListener('unhandledrejection', event => errors.push(String(event.reason)));
const check = (value, message) => { if (!value) throw new Error(message); };
const byId = id => document.getElementById(id);
const pause = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));
async function settle() {
  for (let i = 0; i < 100 && byId('app').inert; i++) await pause(10);
  check(!byId('app').inert, 'Sauvegarde non terminée');
}
function labeled(label) {
  const node = [...document.querySelectorAll('[aria-label]')].find(node => node.getAttribute('aria-label') === label);
  check(node && node.getClientRects().length, `Contrôle absent ou masqué : ${label}`);
  return node;
}
async function click(label) { labeled(label).click(); await settle(); }
function setDay(day) { byId('day').value = day; byId('day').dispatchEvent(new Event('change')); }
function swipe(dx, dy = 0, target = byId('dayLabel')) {
  const start = new Touch({ identifier: 1, target, clientX: 200, clientY: 150 });
  const end = new Touch({ identifier: 1, target, clientX: 200 + dx, clientY: 150 + dy });
  target.dispatchEvent(new TouchEvent('touchstart', { bubbles: true, touches: [start] }));
  target.dispatchEvent(new TouchEvent('touchmove', { bubbles: true, touches: [end] }));
  target.dispatchEvent(new TouchEvent('touchend', { bubbles: true, touches: [], changedTouches: [end] }));
}

(async () => {
  let persisted = { ...emptyNotebook(), entries: [
    { id: 'existing', date: '2026-10-25', type: 'food', cat: 'poultry', text: 'Volaille', portions: 1, meal: 'Déjeuner', preparation: 'Nature' },
    { id: 'invalid', date: '2026-10-23', type: 'food', cat: 'meat', text: 'Ancien repas vapeur', portions: 1, meal: 'Repas inconnu', preparation: 'Vapeur' },
  ] };
  const store = createStore({ read: () => readNotebook(persisted).notebook, write: async notebook => {
    persisted = readNotebook(notebook).notebook; return persisted;
  } });
  mountUI(store, { native: true });
  check(!byId('app').inert && !byId('notice').hidden, 'Ouverture malgré une entrée invalide');
  await click('Voir le journal du 2026-10-23 : Ancien repas vapeur');
  check(!byId('main-panel-journal').hidden && document.querySelector('#journal .entry-error'), 'Alerte ouvre le journal du jour concerné');
  await click('Supprimer Ancien repas vapeur');
  check(byId('notice').hidden, 'Suppression corrige l’alerte');
  byId('main-tab-meals').click();
  setDay('2026-11-01');
  check(byId('dayLabel').textContent === 'Dimanche', 'Jour de la semaine');
  for (const toggle of document.querySelectorAll('#categories .food-group-toggle')) {
    check(toggle.getAttribute('aria-expanded') === 'false', 'Famille initialement repliée');
    check(!byId(toggle.getAttribute('aria-controls')).getClientRects().length, 'Contenu replié invisible');
  }
  byId('group-toggle-animal').click();
  byId('group-toggle-starters').click();
  check(byId('group-panel-animal').hidden, 'Une seule famille ouverte');
  byId('group-toggle-animal').click();
  await click('En sauce · Viandes et poissons');
  await click('Ajouter : Volaille');
  check(persisted.entries.length === 2 && persisted.entries.at(-1).preparation === 'En sauce', 'Pas de sauce automatique');
  check([...document.querySelectorAll('#categories .name')].every(node => !node.textContent.startsWith('Masquer')), 'Noms des catégories');
  await click('Gérer · Viandes et poissons');
  const dialog = byId('settingsDialog');
  check(dialog.open && dialog.matches(':modal'), 'Réglages dans une fenêtre modale');
  check(!byId('settings-group-panel-animal').hidden && !byId('settings-panel-categories').hidden, 'Bonne famille et bon onglet');
  check(!document.querySelector('[aria-label^="Saisir ·"]'), 'Pas de liens retour dans les réglages');
  byId('day').focus();
  check(dialog.contains(document.activeElement), 'Focus contenu dans la fenêtre');
  swipe(-100, 0, byId('settingsContext'));
  check(byId('day').value === '2026-11-01', 'Un geste dans les réglages ne change pas de jour');
  await click('Masquer : Volaille');
  check(labeled('Afficher : Volaille').querySelector('.ri-eye-off-line'), 'Œil barré');
  check(!document.querySelector('[aria-label="Ajouter : Volaille"]'), 'Catégorie masquée, historique conservé');
  await click('Afficher : Volaille');
  await click('Augmenter le maximum : Volaille');
  check(persisted.targets.poultry === 4, 'Incrément du maximum');
  await click('Diminuer le maximum : Volaille');
  check(persisted.targets.poultry === 3, 'Décrément du maximum');
  let maximum = labeled('Maximum : Volaille');
  maximum.value = '-5'; maximum.dispatchEvent(new Event('input')); maximum.dispatchEvent(new Event('change'));
  await settle();
  check(persisted.targets.poultry === 0, 'Valeur négative bloquée');
  await click('Diminuer le maximum : Volaille');
  check(persisted.targets.poultry === 0, 'Décrément borné à zéro');
  maximum = labeled('Maximum : Volaille'); maximum.value = '2.5'; maximum.dispatchEvent(new Event('change')); await settle();
  await click('Augmenter le maximum : Volaille');
  check(persisted.targets.poultry === 3.5, 'Maximum décimal directement éditable');
  maximum = labeled('Maximum : Volaille'); maximum.value = '3'; maximum.dispatchEvent(new Event('change')); await settle();
  await click('Illimitée : Charcuterie');
  await click('Noter une portion : Charcuterie');
  check(persisted.targets.charcuterie === 0, 'Catégorie plafonnée à zéro');
  byId('settings-group-toggle-extras').click();
  check(labeled('Maximum : Fruit').disabled && labeled('Augmenter le maximum : Fruit').disabled, 'Contrôles désactivés quand illimitée');
  await click('Illimitée : Fruit');
  await click('Augmenter le maximum : Fruit');
  check(persisted.targets.fruit === 1, 'Maximum pour catégorie initialement illimitée');
  await click('Illimitée : Fruit');
  check(persisted.targets.fruit === null, 'Choix illimitée explicite');
  byId('settings-tab-reference').click();
  check(!byId('settings-panel-reference').hidden, 'Onglet Références');
  byId('settings-tab-reference').dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
  check(!byId('settings-panel-backup').hidden && byId('export').getClientRects().length, 'Onglets accessibles au clavier');
  byId('settings-tab-backup').dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
  check(!byId('settings-panel-categories').hidden, 'Home revient au premier onglet');
  byId('closeSettings').click(); await pause(0);
  check(!dialog.open && document.activeElement === byId('group-toggle-animal'), 'Fermeture et restitution du focus');
  byId('group-toggle-starches').click();
  await click('Frit · Féculents et légumes');
  await click('Gérer · Féculents et légumes');
  await click('Noter une portion : Autres féculents');
  check(persisted.entries.at(-1).preparation === 'Frit', 'Première portion qualifiée depuis une famille vide');
  const header = labeled('Noter une portion : Autres féculents').closest('.category-setting-header');
  check(Math.abs(header.getBoundingClientRect().right - header.querySelector('.category-actions').getBoundingClientRect().right) < 2, 'Actions à droite');
  byId('closeSettings').click(); await pause(0);
  byId('group-toggle-starches').click();
  check(!document.querySelector('[aria-label="Gérer · Féculents et légumes"]').getClientRects().length, 'Lien masqué dans une famille repliée');
  byId('main-tab-journal').click();
  check(byId('main-panel-journal').contains(byId('produceSummary')), 'Compteur fruits et légumes dans le journal');
  byId('main-tab-effort').click();
  document.querySelector('[data-effort="M"]').click(); await settle();
  check(persisted.entries.at(-1).date === '2026-11-01' && byId('balance').textContent.startsWith('1 '), 'Effort sur la date commune');
  byId('main-tab-week').click();
  check(byId('day').value === '2026-11-01', 'Passage à Semaine conserve le jour');
  const charcuterie = [...document.querySelectorAll('.weekly-category')].find(node => node.querySelector('strong').textContent === 'Charcuterie');
  check(charcuterie?.textContent.includes('Dépassement : 1'), 'Bilan : dépassement du maximum zéro');
  byId('next').click();
  check(byId('day').value === '2026-11-08', 'Navigation par semaine');
  byId('weight').value = '72.5'; byId('fat').value = '24';
  byId('measureForm').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); await settle();
  check(persisted.measurements['2026-11-02'].weight === 72.5, 'Mesure sur la semaine sélectionnée');
  const actions = byId('deleteMeasure').parentElement;
  check(parseFloat(getComputedStyle(actions).gap) >= 8, 'Espacement des boutons de mesure');
  byId('main-tab-journal').click();
  check(byId('day').value === '2026-11-08', 'Jour conservé entre les onglets');
  byId('prev').click();
  check(byId('day').value === '2026-11-07', 'Navigation quotidienne hors Semaine');
  byId('main-tab-week').click();
  check(byId('weight').value === '72.5', 'Même mesure pour un autre jour de la même semaine');
  byId('today').click();
  check(byId('day').value === today() && weekRange(byId('day').value)[0] === weekRange(today())[0], 'Retour semaine courante synchronisé');
  byId('openSettings').click();
  check(dialog.open, 'Accès aux réglages par la roue crantée');
  byId('closeSettings').click(); await pause(0);
  byId('main-tab-meals').click();
  setDay('2026-11-01');
  swipe(-100); check(byId('day').value === '2026-11-02', 'Swipe lendemain');
  swipe(100); check(byId('day').value === '2026-11-01', 'Swipe veille');
  swipe(10, 100); swipe(100, 0, byId('day'));
  check(byId('day').value === '2026-11-01', 'Contrôles et défilement ignorés');
  check(document.documentElement.scrollWidth <= window.innerWidth, 'Pas de débordement horizontal');
  check(errors.length === 0, errors.join('; '));
  result.dataset.status = 'passed';
  result.textContent = 'Navigation, réglages modaux, maximums, journal et semaines vérifiés dans Chromium.';
})().catch(error => { result.dataset.status = 'failed'; result.textContent = error.stack; });
