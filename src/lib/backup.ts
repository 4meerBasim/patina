import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import {
  assertPriceable,
  parseCsvBackup,
  parseJson,
  serializeCsv,
  serializeJson,
  type BackupData,
} from '@/lib/backup-codec';

export { BACKUP_VERSION, type BackupData } from '@/lib/backup-codec';

function freshFile(name: string): File {
  const file = new File(Paths.cache, name);
  if (file.exists) file.delete();
  file.create();
  return file;
}

export async function writeAndShareBackup(
  data: BackupData,
): Promise<{ jsonUri: string; csvUri: string }> {
  const jsonFile = freshFile('patina-backup.json');
  jsonFile.write(serializeJson(data));
  const csvFile = freshFile('patina-backup.csv');
  csvFile.write(serializeCsv(data));

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(jsonFile.uri, {
      mimeType: 'application/json',
      dialogTitle: 'Export Patina data',
      UTI: 'public.json',
    });
  }
  return { jsonUri: jsonFile.uri, csvUri: csvFile.uri };
}

export async function readBackup(uri: string): Promise<BackupData> {
  const file = new File(uri);
  const text = await file.text();
  const data = file.extension.toLowerCase() === '.csv' ? parseCsvBackup(text) : parseJson(text);
  assertPriceable(data);
  return data;
}
