import { today } from './dates.js';

// Share a cache file: no permission to the user's shared storage is needed.
export async function shareNotebook(notebook, { Filesystem, Directory, Encoding, Share }) {
  const file = await Filesystem.writeFile({
    path: `exports/mes-reperes-${today()}.json`,
    data: JSON.stringify(notebook, null, 2),
    directory: Directory.Cache,
    encoding: Encoding.UTF8,
    recursive: true,
  });
  await Share.share({
    title: 'Mon carnet Mes repères',
    dialogTitle: 'Exporter le carnet',
    files: [file.uri],
  });
}
