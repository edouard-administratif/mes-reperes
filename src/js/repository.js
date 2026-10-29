import { readNotebook } from './notebook.js';
import { schema } from './schema.js';
import { decodeTables, replacementStatements } from './sqlite-records.js';

export async function openRepository({ openDatabase, persistence }) {
  const saved = await persistence.read();
  let database = openDatabase(saved?.bytes);
  let revision = saved?.revision ?? 0;
  database.run(schema);

  function read() {
    return decodeTables({
      entries: database.all('SELECT * FROM entries ORDER BY position'),
      measurements: database.all('SELECT * FROM measurements'),
      targets: database.all('SELECT * FROM targets'),
      unlimited: database.all('SELECT * FROM unlimited_categories'),
      hidden: database.all('SELECT * FROM hidden_categories'),
    });
  }

  async function write(notebook) {
    const normalized = readNotebook(notebook).notebook;
    // Work on a candidate database: failed disk writes leave the committed state intact.
    const candidate = openDatabase(database.export());
    try {
      candidate.run('PRAGMA foreign_keys = ON; BEGIN TRANSACTION;');
      for (const { statement, values } of replacementStatements(normalized)) {
        candidate.run(statement, values);
      }
      candidate.run('COMMIT;');
      const nextRevision = await persistence.write(candidate.export(), revision);
      database.close();
      database = candidate;
      revision = nextRevision;
      return normalized;
    } catch (error) {
      candidate.close();
      throw error;
    }
  }

  return { read, write, close: () => database.close() };
}
