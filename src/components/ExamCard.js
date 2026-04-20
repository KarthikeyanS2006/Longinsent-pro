import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { theme, spacing, borderRadius } from '../styles/theme';
import { isExamDownloaded } from '../utils/storage';

export default function ExamCard({ exam, onPress, onDownload, isDownloading }) {
  const [downloaded, setDownloaded] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkDownloadStatus();
  }, [exam.id]);

  const checkDownloadStatus = async () => {
    try {
      const status = await isExamDownloaded(exam.id);
      setDownloaded(status);
    } catch (error) {
      console.error('Check error:', error);
    } finally {
      setChecking(false);
    }
  };

  const getStateColor = (state) => {
    const colors = {
      'Tamil Nadu': '#F59E0B',
      'National': '#EF4444',
      'All India': '#EF4444',
      'State': '#38BDF8',
    };
    return colors[state] || theme.primary;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={() => onPress(exam)}
      activeOpacity={0.8}
    >
      <View style={styles.header}>
        <View style={[styles.yearBadge, { backgroundColor: getStateColor(exam.state) }]}>
          <Text style={styles.yearText}>{exam.exam_year}</Text>
        </View>
        <View style={styles.stateBadge}>
          <Text style={styles.stateText}>{exam.state}</Text>
        </View>
      </View>

      <Text style={styles.examName}>{exam.exam_name}</Text>

      {exam.subject_category && (
        <View style={styles.categoryContainer}>
          <Text style={styles.categoryText}>{exam.subject_category}</Text>
        </View>
      )}

      <View style={styles.footer}>
        <View style={styles.metaInfo}>
          <Text style={styles.metaText}>
            Added {formatDate(exam.created_at)}
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.downloadButton,
            downloaded && styles.downloadedButton,
          ]}
          onPress={() => onDownload(exam, !downloaded)}
          disabled={isDownloading || checking}
        >
          {isDownloading ? (
            <ActivityIndicator size="small" color={theme.text} />
          ) : downloaded ? (
            <>
              <Text style={styles.downloadedIcon}>✓</Text>
              <Text style={styles.downloadedText}>Offline</Text>
            </>
          ) : (
            <>
              <Text style={styles.downloadIcon}>⬇</Text>
              <Text style={styles.downloadText}>Save</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: theme.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  yearBadge: {
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    marginRight: spacing.sm,
  },
  yearText: {
    color: theme.background,
    fontSize: 12,
    fontWeight: '800',
  },
  stateBadge: {
    backgroundColor: theme.card,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  stateText: {
    color: theme.dimText,
    fontSize: 12,
  },
  examName: {
    color: theme.text,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.sm,
  },
  categoryText: {
    color: theme.primary,
    fontSize: 13,
    backgroundColor: theme.card,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    marginRight: spacing.xs,
    overflow: 'hidden',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  metaInfo: {
    flex: 1,
  },
  metaText: {
    color: theme.dimText,
    fontSize: 12,
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.primary,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  downloadedButton: {
    backgroundColor: theme.success,
  },
  downloadIcon: {
    fontSize: 14,
    marginRight: spacing.xs,
  },
  downloadText: {
    color: theme.background,
    fontSize: 13,
    fontWeight: '700',
  },
  downloadedIcon: {
    fontSize: 14,
    marginRight: spacing.xs,
    color: theme.text,
  },
  downloadedText: {
    color: theme.text,
    fontSize: 13,
    fontWeight: '700',
  },
});

import { StyleSheet } from 'react-native';
