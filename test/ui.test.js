import test from 'node:test';
import assert from 'node:assert/strict';
import { mountUI } from '../src/js/ui.js';
import { createStore } from '../src/js/store.js';
import { emptyNotebook } from '../src/js/notebook.js';
import { food } from './helpers.js';
import { today, weekdayLabel } from '../src/js/dates.js';

class Node {
  constructor(tag = 'div') {
    this.tagName = tag;
    this.children = [];
    this.className = '';
    this.style = {};
    this.listeners = new Map();
    this.validity = { valid: true };
    this.classList = {
      contains: name => this.className.split(' ').includes(name),
      add: name => { this.className += ` ${name}`; },
    };
  }
  append(...children) { this.children.push(...children); }
  replaceChildren(...children) { this.children = children; }
  setAttribute(name, value) { this[name] = value; }
  reportValidity() { return true; }
  addEventListener(name, handler) { this.listeners.set(name, handler); }
  removeEventListener(name) { this.listeners.delete(name); }
}

function walk(node, result = []) {
  result.push(node);
  for (const child of node.children ?? []) walk(child, result);
  return result;
}

// This checks controller wiring without pretending to validate browser layout.
test('interface : attente de la sauvegarde, sauce indépendante et erreur persistante sans faux succès', async context => {
  const nodes = new Map();
  const previous = globalThis.document;
  context.after(() => { globalThis.document = previous; });
  globalThis.document = {
    getElementById: id => { if (!nodes.has(id)) nodes.set(id, new Node()); return nodes.get(id); },
    createElement: tag => new Node(tag),
    createTextNode: text => ({ textContent: text }),
    querySelectorAll: () => [],
  };
  let persisted = { ...emptyNotebook(), entries: [food('existing', 'poultry')] };
  let fail = false;
  const store = createStore({
    read: () => persisted,
    async write(notebook) {
      if (fail) throw new Error('Stockage indisponible');
      persisted = structuredClone(notebook);
      return persisted;
    },
  });
  mountUI(store);
  const root = nodes.get('categories');
  const click = label => walk(root).find(node => node['aria-label'] === label).onclick();
  const sauce = walk(root).find(node => node['aria-label'] === 'En sauce · Viandes et poissons');
  sauce.onclick();
  await click('Ajouter : Volaille');
  assert.equal(persisted.entries.length, 2);
  assert.equal(persisted.entries[1].preparation, 'En sauce');
  assert.equal(nodes.get('app').inert, false);
  assert.match(nodes.get('storageStatus').textContent, /enregistré/);
  fail = true;
  await click('Ajouter : Volaille');
  assert.equal(persisted.entries.length, 2);
  assert.match(nodes.get('storageStatus').textContent, /non enregistrée/);
  assert.match(nodes.get('storageStatus').textContent, /Stockage indisponible/);
  assert.equal(nodes.get('app').inert, false);
});

test('familles repliées au démarrage, une seule ouverte et état conservé après saisie', async context => {
  const nodes = new Map();
  const previous = globalThis.document;
  context.after(() => { globalThis.document = previous; });
  globalThis.document = {
    getElementById: id => { if (!nodes.has(id)) nodes.set(id, new Node()); return nodes.get(id); },
    createElement: tag => new Node(tag),
    createTextNode: text => ({ textContent: text }),
    querySelectorAll: () => [],
  };
  let persisted = { ...emptyNotebook(), entries: [food('existing', 'poultry')] };
  const store = createStore({
    read: () => persisted,
    async write(notebook) { persisted = structuredClone(notebook); return persisted; },
  });
  mountUI(store);
  const root = nodes.get('categories');
  const find = id => walk(root).find(node => node.id === id);
  const toggles = walk(root).filter(node => node.className === 'food-group-toggle');
  assert.equal(toggles.length, 7);
  for (const toggle of toggles) {
    assert.equal(toggle['aria-expanded'], 'false');
    const panel = find(toggle['aria-controls']);
    assert.equal(panel.hidden, true);
    assert.equal(panel['aria-labelledby'], toggle.id);
  }
  find('group-toggle-animal').onclick();
  assert.equal(find('group-panel-animal').hidden, false);
  find('group-toggle-starters').onclick();
  assert.equal(find('group-panel-animal').hidden, true);
  assert.equal(find('group-panel-starters').hidden, false);
  find('group-toggle-starters').onclick();
  assert.equal(find('group-panel-starters').hidden, true);
  find('group-toggle-animal').onclick();
  await walk(root).find(node => node['aria-label'] === 'Ajouter : Volaille').onclick();
  assert.equal(find('group-toggle-animal')['aria-expanded'], 'true');
  assert.equal(find('group-panel-animal').hidden, false);
  nodes.get('next').onclick();
  assert.equal(find('group-panel-animal').hidden, false);
  assert(!walk(root).some(node => node['aria-label'] === 'Ajouter : Verre de vin'));
  const settings = nodes.get('categorySettings');
  await walk(settings).find(node => node['aria-label'] === 'Noter une portion : Verre de vin').onclick();
  assert(walk(root).some(node => node['aria-label'] === 'Ajouter : Verre de vin'));
  assert.equal(persisted.entries.at(-1).cat, 'wine');
  const findSettings = id => walk(settings).find(node => node.id === id);
  walk(root).find(node => node['aria-label'] === 'Gérer · Viandes et poissons').onclick();
  assert.equal(nodes.get('categoryManagement').open, true);
  assert.equal(findSettings('settings-group-panel-animal').hidden, false);
  const checkbox = walk(settings).find(node => node['aria-label'] === 'Masquer : Volaille');
  await checkbox.onclick();
  assert(persisted.hidden.includes('poultry'));
  assert(!walk(root).some(node => node['aria-label'] === 'Ajouter : Volaille'));
  assert.equal(persisted.entries.length, 3);
  walk(settings).find(node => node['aria-label'] === 'Saisir · Fruits et desserts').onclick();
  assert.equal(find('group-panel-extras').hidden, false);
  assert.equal(find('group-panel-animal').hidden, true);
  const restore = walk(settings).find(node => node['aria-label'] === 'Afficher : Volaille');
  await restore.onclick();
  assert(walk(root).some(node => node['aria-label'] === 'Ajouter : Volaille'));
  const dairy = find('group-panel-dairy');
  assert(!walk(dairy).some(node => node.className === 'prep-picker'));
});


test('jour de semaine actualisé par date, flèches, aujourd’hui et swipes natifs', context => {
  const nodes = new Map();
  const previous = globalThis.document;
  context.after(() => { globalThis.document = previous; });
  globalThis.document = {
    getElementById: id => { if (!nodes.has(id)) nodes.set(id, new Node()); return nodes.get(id); },
    createElement: tag => new Node(tag),
    createTextNode: text => ({ textContent: text }),
    querySelectorAll: () => [],
  };
  let persisted = { ...emptyNotebook(), entries: [food('existing', 'poultry')] };
  const store = createStore({
    read: () => persisted,
    async write(notebook) { persisted = structuredClone(notebook); return persisted; },
  });
  mountUI(store, { native: true });
  const day = nodes.get('day');
  const label = nodes.get('dayLabel');
  day.value = '2026-11-01';
  day.onchange();
  assert.equal(label.textContent, 'Dimanche');
  nodes.get('next').onclick();
  assert.equal(day.value, '2026-11-02');
  assert.equal(label.textContent, 'Lundi');
  nodes.get('prev').onclick();
  assert.equal(label.textContent, 'Dimanche');
  const app = nodes.get('app');
  const target = { closest: () => false };
  app.listeners.get('touchstart')({ target, touches: [{ identifier: 1, clientX: 250, clientY: 100 }] });
  app.listeners.get('touchend')({ touches: [], changedTouches: [{ identifier: 1, clientX: 100, clientY: 102 }] });
  assert.equal(day.value, '2026-11-02');
  assert.equal(label.textContent, 'Lundi');
  nodes.get('today').onclick();
  assert.equal(day.value, today());
  assert.equal(label.textContent, weekdayLabel(today()));
});
