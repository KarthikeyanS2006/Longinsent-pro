import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { globalStyles } from '../styles/globalStyles';
import { theme, spacing, borderRadius } from '../styles/theme';
import ExamCard from '../components/ExamCard';
import SearchBar from '../components/SearchBar';
import { fetchExams, fetchExamsByState, searchExams } from '../utils/supabase';
import { downloadExam, deleteExamFromStorage, isExamDownloaded } from '../utils/storage';

const FILTERS = [
  { id: 'all', label: 'All Exams', state: null },
];
const DAILY_QUIZ_KEY = '@daily_quiz_done';

export default function HomeScreen({ navigation }) {
  const [exams, setExams] = useState([]);
  const [filteredExams, setFilteredExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [downloadingId, setDownloadingId] = useState(null);
  const [dailyQuizDone, setDailyQuizDone] = useState(false);

  useEffect(() => {
    loadExams();
    checkDailyQuiz();
  }, []);

  const checkDailyQuiz = async () => {
    try {
      const today = new Date().toDateString();
      const dailyData = await AsyncStorage.getItem(DAILY_QUIZ_KEY);
      if (dailyData) {
        const data = JSON.parse(dailyData);
        setDailyQuizDone(data.date === today && data.done);
      }
    } catch (e) {}
  };

  const loadExams = async () => {
    try {
      setLoading(true);
      const data = await fetchExams();
      
      if (!data || data.length === 0) {
        Alert.alert('No Exams', 'No exams found. Please check your connection.');
        setExams([]);
        setFilteredExams([]);
        return;
      }
      
      console.log('Loaded exams:', data.length);
      setExams(data);
      setFilteredExams(data);
    } catch (error) {
      console.error('Load error:', error);
      Alert.alert(
        'Connection Error',
        'Failed to load exams. Please check your internet connection.',
        [{ text: 'Retry', onPress: () => loadExams() }, { text: 'OK', style: 'cancel' }]
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadExams();
  }, []);

  const handleSearch = async (query) => {
    if (!query.trim()) {
      setFilteredExams(exams);
      return;
    }

    try {
      const results = await searchExams(query);
      setFilteredExams(results);
    } catch (error) {
      console.error('Search error:', error);
      Alert.alert('Search Error', 'Failed to search. Please try again.');
    }
  };

  const handleFilterPress = (filter) => {
    setActiveFilter(filter.id);
    setFilteredExams(exams);
  };

  const handleExamPress = (exam) => {
    if (!exam || !exam.id) {
      Alert.alert('Error', 'Invalid exam selected.');
      return;
    }
    
    Alert.alert(
      'Choose Mode',
      'Select quiz mode',
      [
        { 
          text: 'Practice (No Timer)', 
          onPress: () => navigation.navigate('Quiz', { exam, mode: 'practice' })
        },
        { 
          text: 'Mock Test (15 min)', 
          onPress: () => navigation.navigate('Quiz', { exam, mode: 'mock' })
        },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const handleDownload = async (exam, shouldDownload) => {
    if (!exam || !exam.id) {
      Alert.alert('Error', 'Invalid exam.');
      return;
    }
    setDownloadingId(exam.id);
    try {
      if (shouldDownload) {
        const result = await downloadExam(exam.id, exam);
        if (result.success) {
          Alert.alert('Success', 'Exam saved for offline use!');
        } else {
          Alert.alert('Error', result.error || 'Failed to download');
        }
      } else {
        const result = await deleteExamFromStorage(exam.id);
        if (result.success) {
          Alert.alert('Removed', 'Exam removed from offline storage');
        }
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setDownloadingId(null);
    }
  };

  const renderExamItem = ({ item }) => (
    <ExamCard
      exam={item}
      onPress={handleExamPress}
      onDownload={handleDownload}
      isDownloading={downloadingId === item.id}
    />
  );

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {!dailyQuizDone && (
        <TouchableOpacity 
          style={styles.dailyQuizBanner}
          onPress={() => {
            const exam = exams[0];
            if (exam) {
              navigation.navigate('Quiz', { exam, mode: 'practice' });
            }
          }}
        >
          <Text style={styles.dailyQuizIcon}>🎯</Text>
          <View style={styles.dailyQuizContent}>
            <Text style={styles.dailyQuizTitle}>Daily Quiz</Text>
            <Text style={styles.dailyQuizText}>One question a day keeps failure away!</Text>
          </View>
          <Text style={styles.dailyQuizArrow}>→</Text>
        </TouchableOpacity>
      )}
      {dailyQuizDone && (
        <View style={styles.dailyQuizDoneBanner}>
          <Text style={styles.dailyQuizDoneText}>✅ Daily Quiz Completed!</Text>
          <Text style={styles.dailyQuizStreakText}>Come back tomorrow</Text>
        </View>
      )}

      <View style={styles.titleRow}>
        <View>
          <Text style={styles.title}>LonginsentPro</Text>
          <Text style={styles.subtitle}>All Exams ({filteredExams.length})</Text>
        </View>
      </View>

      <SearchBar
        placeholder="Search TNPSC, UPSC, SSC..."
        onSearch={handleSearch}
        onFilterPress={() => {}}
      />

      <FlatList
        horizontal
        data={FILTERS}
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.filterChip,
              activeFilter === item.id && styles.filterChipActive,
            ]}
            onPress={() => handleFilterPress(item)}
          >
            <Text
              style={[
                styles.filterText,
                activeFilter === item.id && styles.filterTextActive,
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        )}
        style={styles.filterList}
      />
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📚</Text>
      <Text style={styles.emptyTitle}>No Exams Found</Text>
      <Text style={styles.emptyText}>
        {activeFilter !== 'all'
          ? 'Try selecting a different filter'
          : 'Pull down to refresh'}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={globalStyles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={styles.loadingText}>Loading exams...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={globalStyles.safeArea}>
      <FlatList
        data={filteredExams}
        keyExtractor={(item) => item.id}
        renderItem={renderExamItem}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.primary}
            colors={[theme.primary]}
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    marginBottom: spacing.md,
  },
  dailyQuizBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  dailyQuizIcon: {
    fontSize: 28,
    marginRight: spacing.sm,
  },
  dailyQuizContent: {
    flex: 1,
  },
  dailyQuizTitle: {
    color: theme.background,
    fontSize: 16,
    fontWeight: '800',
  },
  dailyQuizText: {
    color: theme.background,
    fontSize: 12,
    opacity: 0.8,
  },
  dailyQuizArrow: {
    color: theme.background,
    fontSize: 20,
    fontWeight: '700',
  },
  dailyQuizDoneBanner: {
    backgroundColor: theme.success,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  dailyQuizDoneText: {
    color: theme.background,
    fontSize: 14,
    fontWeight: '700',
  },
  dailyQuizStreakText: {
    color: theme.background,
    fontSize: 12,
    opacity: 0.8,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: theme.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: theme.dimText,
    marginTop: 2,
  },
  offlineButton: {
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.border,
  },
  offlineIcon: {
    fontSize: 20,
  },
  filterList: {
    marginBottom: spacing.sm,
  },
  filterChip: {
    backgroundColor: theme.surface,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: theme.border,
  },
  filterChipActive: {
    backgroundColor: theme.primary,
    borderColor: theme.primary,
  },
  filterText: {
    color: theme.dimText,
    fontSize: 14,
    fontWeight: '600',
  },
  filterTextActive: {
    color: theme.background,
  },
  listContent: {
    padding: spacing.md,
    paddingTop: 0,
  },
  loadingText: {
    color: theme.dimText,
    marginTop: spacing.md,
    fontSize: 14,
  },
  emptyContainer: {
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
