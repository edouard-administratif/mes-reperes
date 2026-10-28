const DATABASE_NAME = 'mes-reperes-sqlite';
const STORE_NAME = 'files';
const FILE_KEY = 'notebook.sqlite';

export async function openBrowserPersistence() {
  const database = await new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error('Ferme les autres onglets du carnet puis réessaie.'));
  });
  database.onversionchange = () => database.close();

  function transact(mode, operation) {
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, mode);
      let value;
      let failure;
      transaction.oncomplete = () => resolve(value);
      transaction.onabort = () => reject(failure ?? transaction.error ?? new Error('Sauvegarde interrompue.'));
      transaction.onerror = () => {};
      operation(transaction.objectStore(STORE_NAME), result => { value = result; }, error => {
        failure = error;
        transaction.abort();
      });
    });
  }

  return {
    read: () => transact('readonly', (store, done) => {
      const request = store.get(FILE_KEY);
      request.onsuccess = () => done(request.result);
    }),
    write: (bytes, expectedRevision) => transact('readwrite', (store, done, fail) => {
      const request = store.get(FILE_KEY);
      request.onsuccess = () => {
        const revision = request.result?.revision ?? 0;
        if (revision !== expectedRevision) {
          fail(new Error('Le carnet a changé dans un autre onglet. Recharge cette page avant de modifier les données.'));
          return;
        }
        store.put({ bytes, revision: revision + 1 }, FILE_KEY);
        done(revision + 1);
      };
    }),
    close: () => database.close(),
  };
}
