import { schema } from './schema.js';
import { readNotebook } from './notebook.js';
import { decodeTables, replacementStatements } from './sqlite-records.js';

function checkChanges(result) {
  if (result?.changes?.changes === -1) throw new Error('SQLite n’a pas pu enregistrer la transaction.');
}

// The injected connection is a native SQLiteDBConnection, never the Web plugin.
export async function openNativeRepository({ connection, close }) {
  checkChanges(await connection.execute(schema, false));
  const tables = {};
  for (const [key, query] of [
    ['entries', 'SELECT * FROM entries ORDER BY position'],
    ['measurements', 'SELECT * FROM measurements'],
    ['targets', 'SELECT * FROM targets'],
    ['hidden', 'SELECT * FROM hidden_categories'],
  ]) {
    tables[key] = (await connection.query(query)).values ?? [];
  }
  let notebook = decodeTables(tables);

  async function write(candidate) {
    const normalized = readNotebook(candidate).notebook;
    // executeSet(true) uses one native transaction: a rejected write rolls back.
    checkChanges(await connection.executeSet(replacementStatements(normalized), true));
    notebook = normalized;
    return structuredClone(notebook);
  }

  return { read: () => structuredClone(notebook), write, close };
}
