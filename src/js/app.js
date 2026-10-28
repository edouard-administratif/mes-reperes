import '../css/vendor.css';
import '../css/app.css';
import { openPlatformRepository } from './platform.js';
import { createStore } from './store.js';
import { mountUI } from './ui.js';

async function start() {
  const { repository, native } = await openPlatformRepository();
  const options = { native };
  if (native) {
    const [{ Filesystem, Directory, Encoding }, { Share }, { shareNotebook }] = await Promise.all([
      import('@capacitor/filesystem'), import('@capacitor/share'), import('./transfer-native.js'),
    ]);
    options.exportNotebook = notebook => shareNotebook(notebook, { Filesystem, Directory, Encoding, Share });
  }
  mountUI(createStore(repository), options);
}

start().catch(error => {
  const status = document.getElementById('storageStatus');
  status.textContent = `Impossible d’ouvrir le carnet : ${error.message}`;
  status.className = 'storage-status storage-error';
});
