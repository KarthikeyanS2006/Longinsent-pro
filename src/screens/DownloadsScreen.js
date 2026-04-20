import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { globalStyles } from '../styles/globalStyles';
import { theme, spacing, borderRadius } from '../styles/theme';
import { getDownloadIndex, getStorageInfo, clearAllDownloads, deleteExamFromStorage } from '../utils/storage';

export default function DownloadsScreen({ navigation }) {
  const [downloads, setDownloads] = useState([]);
  const [storageInfo, setStorageInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDownloads();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadDownloads();
    });
    return unsubscribe;
  }, [navigation]);

  const loadDownloads = async () => {
    try {
      setLoading(true);
      const index = await getDownloadIndex();
      const info = await getStorageInfo();
      setDownloads(index);
      setStorageInfo(info);
    } catch (error) {
      console.error('Load error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (examId, examName) => {
    Alert.alert(
      'Remove Download',
      `Are you sure you want to remove "${examName}" from offline storage?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteExamFromStorage(examId);
              await loadDownloads();
              Alert.alert('Success', 'Exam removed from offline storage');
            } catch (error) {
              Alert.alert('Error', 'Failed to remove exam');
            }
          },
        },
      ]
    );
  };

  const handleClearAll = () => {
    Alert.alert(
      'Clear All Downloads',
      'This will remove all offline exams. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearAllDownloads();
              await loadDownloads();
              Alert.alert('Success', 'All downloads cleared');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear downloads');
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const renderDownloadItem = ({ item }) => (
    <View style={styles.downloadItem}>
      <View style={styles.downloadInfo}>
        <Text style={styles.downloadName}>{item.examName}</Text>
        <Text style={styles.downloadMeta}>
          {item.year} • Downloaded {formatDate(item.downloadedAt)}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDelete(item.examId, item.examName)}
      >
        <Text style={styles.deleteIcon}>🗑️</Text>
      </TouchableOpacity>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.titleRow}>
        <View>
          <Text style={styles.title}>Offline Exams</Text>
          <Text style={styles.subtitle}>Your downloaded study materials</Text>
        </View>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
      </View>

      {storageInfo && (
        <View style={styles.storageCard}>
          <View style={styles.storageRow}>
            <Text style={styles.storageLabel}>Storage Used</Text>
            <Text style={styles.storageValue}>{storageInfo.totalSizeMB} MB</Text>
          </View>
          <View style={styles.storageRow}>
            <Text style={styles.storageLabel}>Exams Saved</Text>
            <Text style={styles.storageValue}>{storageInfo.fileCount}</Text>
          </View>
          <View style={styles.storageBar}>
            <View
              style={[
                styles.storageFill,
                { width: `${Math.min((storageInfo.totalSize / (50 * 1024 * 1024)) * 100, 100)}%` },
              ]}
            />
          </View>
          <Text style={styles.storageHint}>
            50 MB free tier limit
          </Text>
        </View>
      )}

      {downloads.length > 0 && (
        <View style={styles.clearContainer}>
          <TouchableOpacity style={styles.clearButton} onPress={handleClearAll}>
            <Text style={styles.clearButtonText}>Clear All</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📥</Text>
      <Text style={styles.emptyTitle}>No Offline Exams</Text>
      <Text style={styles.emptyText}>
        Download exams from the home screen to study without internet
      </Text>
      <TouchableOpacity
        style={styles.browseButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.browseButtonText}>Browse Exams</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={globalStyles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={globalStyles.safeArea}>
      <FlatList
        data={downloads}
        keyExtractor={(item) => item.examId}
        renderItem={renderDownloadItem}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    marginBottom: spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.text,
  },
  subtitle: {
    fontSize: 14,
    color: theme.dimText,
    marginTop: 2,
  },
  backButton: {
    paddingVertical: spacing.xs,
  },
  backText: {
    color: theme.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  storageCard: {
    backgroundColor: theme.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: theme.border,
  },
  storageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  storageLabel: {
    color: theme.dimText,
    fontSize: 14,
  },
  storageValue: {
    color: theme.text,
    fontSize: 14,
    fontWeight: '600',
  },
  storageBar: {
    height: 6,
    backgroundColor: theme.card,
    borderRadius: 3,
    marginVertical: spacing.sm,
    overflow: 'hidden',
  },
  storageFill: {
    height: '100%',
    backgroundColor: theme.primary,
    borderRadius: 3,
  },
  storageHint: {
    color: theme.dimText,
    fontSize: 12,
    textAlign: 'center',
  },
  clearContainer: {
    alignItems: 'flex-end',
    marginBottom: spacing.sm,
  },
  clearButton: {
    backgroundColor: theme.error,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  clearButtonText: {
    color: theme.text,
    fontSize: 13,
    fontWeight: '600',
  },
  listContent: {
    padding: spacing.md,
    flexGrow: 1,
  },
  downloadItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: theme.border,
  },
  downloadInfo: {
    flex: 1,
  },
  downloadName: {
    color: theme.text,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  downloadMeta: {
    color: theme.dimText,
    fontSize: 12,
  },
  deleteButton: {
    padding: spacing.sm,
  },
  deleteIcon: {
    fontSize: 18,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.text,
    marginBottom: spacing.sm,
  },
  emptyText: {
    color: theme.dimText,
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  browseButton: {
    backgroundColor: theme.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  browseButtonText: {
    color: theme.background,
    fontSize: 16,
    fontWeight: '700',
  },
});

import { StyleSheet } from 'react-native';
