import initSqlJs from 'sql.js';
import wasmBinary from 'sql.js/dist/sql-wasm.wasm';

// Bundled bytes avoid fetch(), including when opening the standalone HTML via file://.
export async function loadSQLite() {
  const SQL = await initSqlJs({ wasmBinary });

  return bytes => {
    const database = bytes ? new SQL.Database(bytes) : new SQL.Database();
    return {
      run: (sql, parameters) => database.run(sql, parameters),
      all(sql) {
        const statement = database.prepare(sql);
        try {
          const rows = [];
          while (statement.step()) rows.push(statement.getAsObject());
          return rows;
        } finally { statement.free(); }
      },
      export: () => database.export(),
      close: () => database.close(),
    };
  };
}
