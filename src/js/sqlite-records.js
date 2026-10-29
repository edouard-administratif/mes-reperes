import { emptyNotebook, readNotebook } from './notebook.js';

export function decodeTables(tables) {
  const notebook = emptyNotebook();
  notebook.entries = tables.entries.map(row => {
    const entry = { id: row.id, date: row.date, type: row.type, text: row.text };
    if (row.type === 'food') {
      Object.assign(entry, { cat: row.category, portions: row.portions, meal: row.meal, preparation: row.preparation });
    }
    if (row.type === 'physical') entry.level = row.level;
    return entry;
  });
  for (const row of tables.measurements) notebook.measurements[row.week] = { weight: row.weight, fat: row.fat };
  for (const row of tables.targets) notebook.targets[row.category] = row.value;
  notebook.hidden = tables.hidden.map(row => row.category);
  return readNotebook(notebook).notebook;
}

// Each statement is independent, with bound values; the adapter owns the transaction.
export function replacementStatements(notebook) {
  const statements = ['entries', 'measurements', 'targets', 'hidden_categories'].map(table => ({
    statement: `DELETE FROM ${table}`, values: [],
  }));
  for (const [position, entry] of notebook.entries.entries()) {
    statements.push({
      statement: `INSERT INTO entries
        (id, position, date, type, text, category, portions, meal, preparation, level, linked_to)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      values: [entry.id, position, entry.date, entry.type, entry.text, entry.cat ?? null,
        entry.portions ?? null, entry.meal ?? null, entry.preparation ?? null,
        entry.level ?? null, null],
    });
  }
  for (const [week, measure] of Object.entries(notebook.measurements)) {
    statements.push({ statement: 'INSERT INTO measurements VALUES (?, ?, ?)', values: [week, measure.weight, measure.fat] });
  }
  for (const [category, value] of Object.entries(notebook.targets)) {
    statements.push({ statement: 'INSERT INTO targets VALUES (?, ?)', values: [category, value] });
  }
  for (const category of notebook.hidden) {
    statements.push({ statement: 'INSERT INTO hidden_categories VALUES (?)', values: [category] });
  }
  return statements;
}
