import * as DocumentPicker from 'expo-document-picker';
import { useCallback } from 'react';
import { Alert } from 'react-native';

import { useDataActions } from '@/store';

type DataManagement = {
  exportData: () => Promise<void>;
  importData: () => Promise<void>;
  confirmDelete: () => void;
};

export function useDataManagement(): DataManagement {
  const { exportAllData, importBackup, deleteAllData } = useDataActions();

  const exportData = useCallback(async () => {
    try {
      await exportAllData();
    } catch {
      Alert.alert('Export failed', 'Patina could not export your data. Please try again.');
    }
  }, [exportAllData]);

  const importData = useCallback(async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/json',
      copyToCacheDirectory: true,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    if (!asset) return;
    try {
      await importBackup(asset.uri);
    } catch {
      Alert.alert('Import failed', 'That file could not be read as a Patina backup.');
    }
  }, [importBackup]);

  const confirmDelete = useCallback(() => {
    Alert.alert(
      'Delete all data',
      'This permanently removes every account, holding, and note on this device. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete all data',
          style: 'destructive',
          onPress: () => {
            void deleteAllData();
          },
        },
      ],
      { cancelable: true },
    );
  }, [deleteAllData]);

  return { exportData, importData, confirmDelete };
}
