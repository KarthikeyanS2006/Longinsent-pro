import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { globalStyles } from '../styles/globalStyles';
import { theme, spacing } from '../styles/theme';
import ExamCard from '../components/ExamCard';
import SearchBar from '../components/SearchBar';
import { fetchExamsByCategory, searchExams } from '../utils/supabase';
import { downloadExam, deleteExamFromStorage } from '../utils/storage';

const EXAM_CATEGORIES = [
  { id: 'tnpsc', label: 'TNPSC', icon: '🇮🇳', color: '#FF6F00' },
  { id: 'group4', label: 'Group 4', icon: '📋', color: '#FF6F00' },
  { id: 'group2', label: 'Group 2', icon: '📋', color: '#FF6F00' },
  { id: 'ssc', label: 'SSC', icon: '🏛️', color: '#2563EB' },
  { id: 'police', label: 'Police', icon: '👮', color: '#16A34A' },
  { id: 'rrb', label: 'Railway', icon: '🚂', color: '#9333EA' },
  { id: 'upsc', label: 'UPSC', icon: '🏛️', color: '#DC2626' },
  { id: 'banking', label: 'Banking', icon: '🏦', color: '#0891B2' },
];

export default function CategoryScreen({ navigation }) {
  const [categories, setCategories] = useState(EXAM_CATEGORIES);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const data = await fetchExamsByCategory();
      
      if (!data || data.length === 0) {
        return;
      }

      const cats = [...new Set(data.map(e => e.subject_category).filter(Boolean))];
      if (cats.length > 0) {
        console.log('Categories:', cats);
      }
    } catch (error) {
      console.error('Load categories error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadExamsByCategory = async (category) => {
    try {
      setLoading(true);
      setSelectedCategory(category);
      const data = await fetchExamsByCategory(category);
      setExams(data || []);
    } catch (error) {
      console.error('Load exams error:', error);
      Alert.alert('Error', 'Failed to load exams');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    if (selectedCategory) {
      loadExamsByCategory(selectedCategory);
    } else {
      loadCategories();
    }
  };

  const handleCategoryPress = (category) => {
    loadExamsByCategory(category);
  };

  const handleExamPress = (exam) => {
    navigation.navigate('Quiz', { exam });
  };

  const handleDownload = async (exam, shouldDownload) => {
    if (!exam?.id) {
      Alert.alert('Error', 'Invalid exam.');
      return;
    }
    try {
      if (shouldDownload) {
        const result = await downloadExam(exam.id, exam);
        if (result.success) {
          Alert.alert('Success', 'Exam saved for offline use!');
        }
      } else {
        const result = await deleteExamFromStorage(exam.id);
        if (result.success) {
          Alert.alert('Removed', 'Exam removed from offline storage');
        }
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const renderExamItem = ({ item }) => (
    <ExamCard
      exam={item}
      onPress={handleExamPress}
      onDownload={handleDownload}
      isDownloading={false}
    />
  );

  const renderCategoryItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.categoryCard,
        selectedCategory === item.id && styles.categoryCardActive,
      ]}
      onPress={() => handleCategoryPress(item.label)}
    >
      <Text style={styles.categoryIcon}>{item.icon}</Text>
      <Text style={[
        styles.categoryText,
        selectedCategory === item.id && styles.categoryTextActive,
      ]}>
        {item.label}
      </Text>
      <Text style={styles.categoryArrow}>→</Text>
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <Text style={styles.title}>Categories</Text>
      
      {selectedCategory && (
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => { setSelectedCategory(null); setExams([]); }}
        >
          <Text style={styles.backText}>← All Categories</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📚</Text>
      <Text style={styles.emptyTitle}>
        {selectedCategory ? 'No Exams Found' : 'Select a Category'}
      </Text>
      <Text style={styles.emptyText}>
        {selectedCategory ? 'Try another category' : 'Tap a category to see exams'}
      </Text>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={globalStyles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={globalStyles.safeArea}>
      <FlatList
        data={selectedCategory ? exams : categories}
        keyExtractor={(item, index) => item.id || item || index}
        renderItem={selectedCategory ? renderExamItem : renderCategoryItem}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.primary}
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
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: theme.text,
    marginBottom: spacing.md,
  },
  backButton: {
    marginBottom: spacing.md,
  },
  backText: {
    color: theme.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  categoryCard: {
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.border,
  },
  categoryCardActive: {
    backgroundColor: theme.primary,
    borderColor: theme.primary,
  },
  categoryText: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.text,
  },
  categoryTextActive: {
    color: theme.background,
  },
  categoryArrow: {
    fontSize: 20,
    color: theme.dimText,
  },
  listContent: {
    padding: spacing.md,
  },
  loadingText: {
    color: theme.dimText,
    marginTop: spacing.md,
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