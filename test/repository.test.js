import test from 'node:test';
import assert from 'node:assert/strict';
import { openRepository } from '../src/js/repository.js';
import { createStore } from '../src/js/store.js';
import { emptyNotebook } from '../src/js/notebook.js';
import { nativeSQLite, memoryPersistence, food } from './helpers.js';

async function setup(context) {
  const openDatabase = nativeSQLite(context);
  const persistence = memoryPersistence();
  const repository = await openRepository({ openDatabase, persistence });
  return { openDatabase, persistence, repository, store: createStore(repository) };
}

test('persistance SQLite réelle : repas, mesures, limites et catégories masquées après réouverture', async context => {
  const { openDatabase, persistence, repository } = await setup(context);
  const notebook = emptyNotebook();
  notebook.entries = [food('sauce', 'richsauce'), food('parent'),
    { id: 'effort', date: '2026-10-25', type: 'physical', text: 'Effort S', level: 'S' },
    { id: 'choc', date: '2026-10-25', type: 'chocolate', text: 'Carré' }];
  notebook.measurements['2026-10-19'] = { weight: 72.5, fat: 24 };
  notebook.targets = { meat: 2, charcuterie: 0 };
  notebook.hidden = ['dessert'];
  await repository.write(notebook);
  const saved = await persistence.read();
  assert.equal(Buffer.from(saved.bytes).subarray(0, 16).toString(), 'SQLite format 3\0');
  const connection = openDatabase(saved.bytes);
  assert.equal(connection.all('SELECT count(*) AS count FROM entries')[0].count, 4);
  connection.close();
  const reopened = await openRepository({ openDatabase, persistence });
  assert.deepEqual(reopened.read(), notebook);
  await reopened.write(emptyNotebook());
  assert.deepEqual(reopened.read(), emptyNotebook());
});

test('sauvegarde en échec : ni le carnet affiché ni SQLite ne sont remplacés', async context => {
  const { store, repository, persistence } = await setup(context);
  await store.update(draft => { draft.entries.push(food('saved')); });
  persistence.fail = true;
  await assert.rejects(store.update(draft => { draft.entries.push(food('lost')); }), /Disque/);
  assert.deepEqual(store.snapshot().entries.map(entry => entry.id), ['saved']);
  assert.deepEqual(repository.read().entries.map(entry => entry.id), ['saved']);
  persistence.fail = false;
  await store.update(draft => { draft.entries.push(food('retry')); });
  assert.equal(store.snapshot().entries.length, 2);
});

test('modifications concurrentes mises en file sans perte de repas', async context => {
  const { store } = await setup(context);
  await Promise.all([
    store.update(draft => { draft.entries.push(food('first')); }),
    store.update(draft => { draft.entries.push(food('second')); }),
  ]);
  assert.deepEqual(store.snapshot().entries.map(entry => entry.id), ['first', 'second']);
});

test('conflit entre onglets : la deuxième écriture ne remplace pas les données récentes', async context => {
  const { openDatabase, persistence, store } = await setup(context);
  const other = await openRepository({ openDatabase, persistence });
  await store.update(draft => { draft.entries.push(food('tab-1')); });
  const stale = emptyNotebook();
  stale.entries.push(food('tab-2'));
  await assert.rejects(other.write(stale), /Conflit/);
  const reopened = await openRepository({ openDatabase, persistence });
  assert.equal(reopened.read().entries[0].id, 'tab-1');
});

test('import remplace atomiquement le carnet et conserve l’ancien si la sauvegarde échoue', async context => {
  const { store, persistence } = await setup(context);
  await store.update(draft => { draft.entries.push(food('before')); });
  const imported = { ...emptyNotebook(), entries: [food('after')] };
  persistence.fail = true;
  await assert.rejects(store.update(draft => { Object.assign(draft, imported); }));
  assert.equal(store.snapshot().entries[0].id, 'before');
  persistence.fail = false;
  await store.update(draft => { Object.assign(draft, imported); });
  assert.equal(store.snapshot().entries[0].id, 'after');
});
