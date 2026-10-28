import { Capacitor } from '@capacitor/core';

export async function openPlatformRepository() {
  if (Capacitor.isNativePlatform()) {
    const { CapacitorSQLite, SQLiteConnection } = await import('@capacitor-community/sqlite');
    if (!Capacitor.isPluginAvailable('CapacitorSQLite')) {
      throw new Error('Le plugin SQLite natif est absent. Exécute npm run android:sync puis reconstruis l’application.');
    }
    const { openNativeRepository } = await import('./repository-native.js');
    const sqlite = new SQLiteConnection(CapacitorSQLite);
    const name = 'mes_reperes';
    await sqlite.checkConnectionsConsistency();
    const connection = await sqlite.createConnection(name, false, 'no-encryption', 1, false);
    try {
      await connection.open();
      const repository = await openNativeRepository({
        connection,
        close: () => sqlite.closeConnection(name, false),
      });
      return { repository, native: true };
    } catch (error) {
      await sqlite.closeConnection(name, false).catch(() => {});
      throw error;
    }
  }
  const [{ loadSQLite }, { openBrowserPersistence }, { openRepository }] = await Promise.all([
    import('./sqlite-browser.js'), import('./browser-storage.js'), import('./repository.js'),
  ]);
  const openDatabase = await loadSQLite();
  const persistence = await openBrowserPersistence();
  return { repository: await openRepository({ openDatabase, persistence }), native: false };
}
