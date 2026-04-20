import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme, spacing, borderRadius } from '../styles/theme';

const QUIZ_RESULTS_KEY = '@quiz_results';
const BOOKMARKS_KEY = '@bookmarks';

export default function HistoryScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [activeTab, setActiveTab] = useState('results');

  useEffect(() => {
    loadData();
  }, []);
  
  const handleRefresh = () => {
    loadData();
  };

  const loadData = async () => {
    try {
      setLoading(true);
      
      const resultsData = await AsyncStorage.getItem(QUIZ_RESULTS_KEY);
      if (resultsData) {
        setResults(JSON.parse(resultsData));
      }
      
      const bookmarksData = await AsyncStorage.getItem(BOOKMARKS_KEY);
      if (bookmarksData) {
        setBookmarks(JSON.parse(bookmarksData));
      }
    } catch (e) {
      console.error('Load error:', e);
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    total: results.length,
    avgScore: results.length > 0 
      ? Math.round(results.reduce((sum, r) => sum + (r.percentage || 0), 0) / results.length)
      : 0
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-IN', { 
      day: 'numeric', 
      month: 'short' 
    });
  };

  const renderResult = ({ item }) => (
    <View style={styles.resultCard}>
      <View style={styles.resultHeader}>
        <Text style={styles.resultExam}>{item.examName || 'Quiz'}</Text>
        <Text style={styles.resultDate}>{formatDate(item.completedAt)}</Text>
      </View>
      <View style={styles.resultScore}>
        <Text style={styles.scoreCorrect}>{item.score}</Text>
        <Text style={styles.scoreSlash}>/</Text>
        <Text style={styles.scoreTotal}>{item.total}</Text>
        <Text style={styles.scorePercent}>{item.percentage}%</Text>
      </View>
    </View>
  );

  const renderBookmark = ({ item }) => (
    <View style={styles.bookmarkCard}>
      <Text style={styles.bookmarkQ} numberOfLines={2}>{item.question}</Text>
      <Text style={styles.bookmarkExam}>{item.examName}</Text>
    </View>
  );

  const renderEmpty = (type) => (
    <View style={styles.empty}>
      <Text style={styles.emptyIcon}>{type === 'results' ? '📝' : '🔖'}</Text>
      <Text style={styles.emptyTitle}>
        {type === 'results' ? 'No quizzes taken' : 'No saved questions'}
      </Text>
      <Text style={styles.emptyText}>
        {type === 'results' ? 'Take a quiz to see results' : 'Save questions while practicing'}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>History</Text>
        <TouchableOpacity onPress={handleRefresh}>
          <Text style={styles.refreshBtn}>🔄</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>{stats.total}</Text>
          <Text style={styles.statLabel}>Quizzes</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>{stats.avgScore}%</Text>
          <Text style={styles.statLabel}>Avg Score</Text>
        </View>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'results' && styles.tabActive]} 
          onPress={() => setActiveTab('results')}
        >
          <Text style={[styles.tabText, activeTab === 'results' && styles.tabTextActive]}>
            Results
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'bookmarks' && styles.tabActive]} 
          onPress={() => setActiveTab('bookmarks')}
        >
          <Text style={[styles.tabText, activeTab === 'bookmarks' && styles.tabTextActive]}>
            Saved ({bookmarks.length})
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={activeTab === 'results' ? results : bookmarks}
        keyExtractor={(item, i) => i.toString()}
        renderItem={activeTab === 'results' ? renderResult : renderBookmark}
        ListEmptyComponent={() => renderEmpty(activeTab)}
        contentContainerStyle={styles.list}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
    padding: spacing.md,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: theme.text,
  },
  refreshBtn: {
    fontSize: 24,
    padding: spacing.sm,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  statBox: {
    flex: 1,
    backgroundColor: theme.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
  },
  statNum: {
    fontSize: 32,
    fontWeight: '800',
    color: theme.primary,
  },
  statLabel: {
    fontSize: 14,
    color: theme.dimText,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: theme.surface,
    borderRadius: borderRadius.md,
    padding: 4,
    marginBottom: spacing.md,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: borderRadius.sm,
  },
  tabActive: {
    backgroundColor: theme.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.dimText,
  },
  tabTextActive: {
    color: theme.background,
  },
  list: {
    paddingTop: spacing.sm,
  },
  resultCard: {
    backgroundColor: theme.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  resultExam: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.text,
    flex: 1,
  },
  resultDate: {
    fontSize: 12,
    color: theme.dimText,
  },
  resultScore: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  scoreCorrect: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.success,
  },
  scoreSlash: {
    fontSize: 16,
    color: theme.dimText,
    marginHorizontal: 4,
  },
  scoreTotal: {
    fontSize: 16,
    color: theme.text,
  },
  scorePercent: {
    fontSize: 16,
    color: theme.primary,
    fontWeight: '700',
    marginLeft: spacing.sm,
  },
  bookmarkCard: {
    backgroundColor: theme.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: theme.warning,
  },
  bookmarkQ: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text,
    marginBottom: spacing.xs,
  },
  bookmarkExam: {
    fontSize: 12,
    color: theme.dimText,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.text,
    marginBottom: spacing.xs,
  },
  emptyText: {
    fontSize: 14,
    color: theme.dimText,
  },
});

import { StyleSheet } from 'react-native';