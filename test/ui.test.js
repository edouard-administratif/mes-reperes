import test from 'node:test';
import assert from 'node:assert/strict';
import { mountUI } from '../src/js/ui.js';
import { createStore } from '../src/js/store.js';
import { emptyNotebook } from '../src/js/notebook.js';

class Node {
  constructor(tag = 'div') {
    this.tagName = tag;
    this.children = [];
    this.className = '';
    this.style = {};
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
}

function walk(node, result = []) {
  result.push(node);
  for (const child of node.children ?? []) walk(child, result);
  return result;
}

// This checks controller wiring without pretending to validate browser layout.
test('interface : attente de la sauvegarde, sauce associée et erreur persistante sans faux succès', async context => {
  const nodes = new Map();
  const previous = globalThis.document;
  context.after(() => { globalThis.document = previous; });
  globalThis.document = {
    getElementById: id => { if (!nodes.has(id)) nodes.set(id, new Node()); return nodes.get(id); },
    createElement: tag => new Node(tag),
    createTextNode: text => ({ textContent: text }),
    querySelectorAll: () => [],
  };
  let persisted = emptyNotebook();
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
  assert.equal(persisted.entries[1].cat, 'richsauce');
  assert.equal(nodes.get('app').inert, false);
  assert.match(nodes.get('storageStatus').textContent, /enregistré/);
  fail = true;
  await click('Ajouter : Volaille');
  assert.equal(persisted.entries.length, 2);
  assert.match(nodes.get('storageStatus').textContent, /non enregistrée/);
  assert.match(nodes.get('storageStatus').textContent, /Stockage indisponible/);
  assert.equal(nodes.get('app').inert, false);
});
