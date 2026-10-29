import test from 'node:test';
import assert from 'node:assert/strict';
import { nativeSQLite, food } from './helpers.js';
import { emptyNotebook } from '../src/js/notebook.js';
import { openNativeRepository } from '../src/js/repository-native.js';
import { createStore } from '../src/js/store.js';
import { shareNotebook } from '../src/js/transfer-native.js';

// Exercise the bridge's async connection contract against actual SQLite SQL.
function connectionFixture(context) {
  const open = nativeSQLite(context);
  let database = open();
  let failAt = -1;
  const calls = [];
  return {
    calls,
    failAfter(index) { failAt = index; },
    connection: {
      async execute(sql, transaction) {
        calls.push(['execute', transaction]);
        database.run(sql);
        return { changes: { changes: 0 } };
      },
      async query(sql) { return { values: database.all(sql) }; },
      async executeSet(statements, transaction) {
        assert.equal(transaction, true);
        calls.push(['executeSet', statements.length]);
        database.run('BEGIN TRANSACTION');
        try {
          for (const [index, { statement, values }] of statements.entries()) {
            if (index === failAt) throw new Error('Échec natif simulé');
            database.run(statement, values);
          }
          database.run('COMMIT');
          return { changes: { changes: statements.length } };
        } catch (error) {
          database.run('ROLLBACK');
          throw error;
        }
      },
    },
    async restart() {
      const bytes = database.export();
      database.close();
      database = open(bytes);
    },
  };
}

test('SQLite natif : sauvegarde de toutes les tables et réouverture sans stockage Web', async context => {
  const fixture = connectionFixture(context);
  const repository = await openNativeRepository({ connection: fixture.connection, close: async () => {} });
  const notebook = emptyNotebook();
  notebook.entries = [food('sauce', 'richsauce'), food('meat'),
    { id: 's', type: 'physical', date: '2026-10-25', text: 'Effort S', level: 'S' }];
  notebook.measurements['2026-10-19'] = { weight: 72, fat: 24 };
  notebook.targets = { charcuterie: 0, starter: 7 };
  notebook.hidden = ['dessert'];
  await repository.write(notebook);
  await fixture.restart();
  const reopened = await openNativeRepository({ connection: fixture.connection, close: async () => {} });
  assert.deepEqual(reopened.read(), notebook);
  assert.equal(fixture.calls.filter(call => call[0] === 'executeSet').length, 1);
});

test('échec natif au milieu du remplacement : rollback SQLite et état affiché conservé', async context => {
  const fixture = connectionFixture(context);
  const repository = await openNativeRepository({ connection: fixture.connection, close: async () => {} });
  const store = createStore(repository);
  await store.update(draft => { draft.entries.push(food('original')); });
  fixture.failAfter(4);
  await assert.rejects(store.update(draft => { draft.entries.push(food('nouveau')); }), /Échec natif/);
  assert.deepEqual(store.snapshot().entries.map(entry => entry.id), ['original']);
  const reopened = await openNativeRepository({ connection: fixture.connection, close: async () => {} });
  assert.deepEqual(reopened.read().entries.map(entry => entry.id), ['original']);
});

test('import natif remplace le carnet et la lecture renvoie une copie indépendante', async context => {
  const fixture = connectionFixture(context);
  const repository = await openNativeRepository({ connection: fixture.connection, close: async () => {} });
  const store = createStore(repository);
  await store.update(draft => { draft.entries.push(food('avant')); });
  await store.update(draft => { Object.assign(draft, { ...emptyNotebook(), entries: [food('apres')] }); });
  const copy = repository.read();
  copy.entries.length = 0;
  assert.equal(repository.read().entries[0].id, 'apres');
});

test('export Android : JSON dans le cache privé, puis partage du fichier natif', async () => {
  const notebook = { ...emptyNotebook(), entries: [food('a')] };
  const calls = [];
  await shareNotebook(notebook, {
    Directory: { Cache: 'CACHE' }, Encoding: { UTF8: 'utf8' },
    Filesystem: { async writeFile(options) { calls.push(options); return { uri: 'file:///cache/carnet.json' }; } },
    Share: { async share(options) { calls.push(options); } },
  });
  assert.deepEqual(JSON.parse(calls[0].data), notebook);
  assert.equal(calls[0].directory, 'CACHE');
  assert.deepEqual(calls[1].files, ['file:///cache/carnet.json']);
});
