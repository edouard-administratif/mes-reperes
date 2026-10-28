import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// Run repository SQL against real SQLite without downloading browser dependencies.
export function nativeSQLite(context) {
  const directory = mkdtempSync(join(tmpdir(), 'mes-reperes-test-'));
  const databases = new Set();
  let next = 0;
  context.after(() => {
    for (const database of databases) database.close();
    rmSync(directory, { recursive: true, force: true });
  });
  return bytes => {
    const filename = join(directory, `notebook-${next++}.sqlite`);
    if (bytes) writeFileSync(filename, bytes);
    const database = new DatabaseSync(filename);
    databases.add(database);
    return {
      run(sql, parameters) {
        if (parameters === undefined) database.exec(sql);
        else database.prepare(sql).run(...parameters);
      },
      all: sql => database.prepare(sql).all(),
      export: () => new Uint8Array(readFileSync(filename)),
      close() { if (databases.delete(database)) database.close(); },
    };
  };
}

export function memoryPersistence() {
  let record;
  return {
    fail: false,
    read: async () => record && structuredClone(record),
    async write(bytes, expectedRevision) {
      if (this.fail) throw new Error('Disque indisponible');
      if ((record?.revision ?? 0) !== expectedRevision) throw new Error('Conflit entre onglets');
      record = { bytes: bytes.slice(), revision: expectedRevision + 1 };
      return record.revision;
    },
  };
}

export const food = (id, cat = 'meat', extra = {}) => ({
  id, type: 'food', date: '2026-10-25', text: cat, cat,
  meal: 'Déjeuner', preparation: 'Nature', portions: 1, ...extra,
});
