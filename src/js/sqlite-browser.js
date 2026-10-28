const SQL_JS_BASE = new URL('../vendor/sqlite/', import.meta.url).href;

function loadScript(source) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    const timeout = setTimeout(() => {
      script.remove();
      reject(new Error('Le chargement de SQLite a expiré. Recharge la page ou reconstruis les ressources de l’application.'));
    }, 15000);
    script.src = source;
    script.onload = () => { clearTimeout(timeout); resolve(); };
    script.onerror = () => { clearTimeout(timeout); reject(new Error('Impossible de charger SQLite. Recharge la page ou reconstruis les ressources de l’application.')); };
    document.head.append(script);
  });
}

export async function loadSQLite() {
  await loadScript(`${SQL_JS_BASE}sql-wasm.js`);
  let timeout;
  const SQL = await Promise.race([
    window.initSqlJs({ locateFile: file => `${SQL_JS_BASE}${file}` }),
    new Promise((_, reject) => {
      timeout = setTimeout(() => reject(new Error('Le chargement du moteur SQLite a expiré. Recharge la page.')), 15000);
    }),
  ]).finally(() => clearTimeout(timeout));

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
