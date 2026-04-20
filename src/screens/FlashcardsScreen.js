import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme, spacing, borderRadius } from '../styles/theme';

const FLASHCARDS_KEY = '@flashcards';

export default function FlashcardsScreen({ navigation }) {
  const [flashcards, setFlashcards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newCard, setNewCard] = useState({ question: '', answer: '' });
  const [editingId, setEditingId] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [mode, setMode] = useState('list');

  useEffect(() => {
    loadFlashcards();
  }, []);

  const loadFlashcards = async () => {
    try {
      setLoading(true);
      const data = await AsyncStorage.getItem(FLASHCARDS_KEY);
      setFlashcards(data ? JSON.parse(data) : []);
    } catch (e) {
      console.log('Load error:', e);
    } finally {
      setLoading(false);
    }
  };

  const saveFlashcard = async () => {
    if (!newCard.question.trim() || !newCard.answer.trim()) {
      Alert.alert('Error', 'Question and Answer are required');
      return;
    }

    try {
      let updated = [...flashcards];
      if (editingId) {
        updated = updated.map(f => f.id === editingId ? { ...newCard, id: editingId } : f);
      } else {
        updated.unshift({ ...newCard, id: Date.now().toString(), createdAt: new Date().toISOString() });
      }
      await AsyncStorage.setItem(FLASHCARDS_KEY, JSON.stringify(updated));
      setFlashcards(updated);
      setNewCard({ question: '', answer: '' });
      setShowForm(false);
      setEditingId(null);
      Alert.alert('Success', editingId ? 'Flashcard updated!' : 'Flashcard created!');
    } catch (e) {
      Alert.alert('Error', 'Could not save');
    }
  };

  const deleteFlashcard = async (id) => {
    Alert.alert('Delete', 'Delete this flashcard?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const updated = flashcards.filter(f => f.id !== id);
          await AsyncStorage.setItem(FLASHCARDS_KEY, JSON.stringify(updated));
          setFlashcards(updated);
        },
      },
    ]);
  };

  const editFlashcard = (card) => {
    setNewCard({ question: card.question, answer: card.answer });
    setEditingId(card.id);
    setShowForm(true);
  };

  const handleNext = () => {
    setShowAnswer(false);
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setCurrentIndex(0);
    }
  };

  const handlePrevious = () => {
    setShowAnswer(false);
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    } else {
      setCurrentIndex(flashcards.length - 1);
    }
  };

  const handleFlip = () => {
    setShowAnswer(!showAnswer);
  };

  const importFromBookmarks = async () => {
    try {
      const BOOKMARKS_KEY = '@bookmarks';
      const bookmarksData = await AsyncStorage.getItem(BOOKMARKS_KEY);
      const bookmarks = bookmarksData ? JSON.parse(bookmarksData) : [];

      if (bookmarks.length === 0) {
        Alert.alert('No Bookmarks', 'Save some questions first to import!');
        return;
      }

      let imported = 0;
      const updated = [...flashcards];
      for (const b of bookmarks) {
        if (b.question && !updated.some(f => f.question === b.question)) {
          updated.unshift({
            id: Date.now().toString() + Math.random(),
            question: b.question,
            answer: b.examName || 'Imported from bookmarks',
            createdAt: new Date().toISOString(),
          });
          imported++;
        }
      }

      if (imported > 0) {
        await AsyncStorage.setItem(FLASHCARDS_KEY, JSON.stringify(updated));
        setFlashcards(updated);
        Alert.alert('Success', `${imported} flashcards imported!`);
      } else {
        Alert.alert('Info', 'No new questions to import');
      }
    } catch (e) {
      Alert.alert('Error', 'Could not import');
    }
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (flashcards.length === 0 && !showForm) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>📚 Flashcards</Text>
        
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🗃️</Text>
          <Text style={styles.emptyTitle}>No Flashcards Yet</Text>
          <Text style={styles.emptyText}>
            Create flashcards or import from your bookmarks
          </Text>
          
          <TouchableOpacity style={styles.emptyButton} onPress={() => setShowForm(true)}>
            <Text style={styles.emptyButtonText}>+ Create New</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.importButton} onPress={importFromBookmarks}>
            <Text style={styles.importButtonText}>📥 Import from Bookmarks</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (showForm) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.formHeader}>
          <TouchableOpacity onPress={() => { setShowForm(false); setNewCard({ question: '', answer: '' }); setEditingId(null); }}>
            <Text style={styles.backBtn}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.formTitle}>{editingId ? 'Edit' : 'New'} Flashcard</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.label}>Question</Text>
          <TextInput
            style={styles.input}
            value={newCard.question}
            onChangeText={(text) => setNewCard({ ...newCard, question: text })}
            placeholder="Enter question..."
            placeholderTextColor={theme.dimText}
            multiline
          />

          <Text style={styles.label}>Answer</Text>
          <TextInput
            style={[styles.input, styles.answerInput]}
            value={newCard.answer}
            onChangeText={(text) => setNewCard({ ...newCard, answer: text })}
            placeholder="Enter answer..."
            placeholderTextColor={theme.dimText}
            multiline
          />

          <TouchableOpacity style={styles.saveButton} onPress={saveFlashcard}>
            <Text style={styles.saveButtonText}>
              {editingId ? 'Update' : 'Save'} Flashcard
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (mode === 'study' && flashcards.length > 0) {
    const card = flashcards[currentIndex];
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.studyHeader}>
          <TouchableOpacity onPress={() => { setMode('list'); setShowAnswer(false); }}>
            <Text style={styles.backBtn}>← Exit</Text>
          </TouchableOpacity>
          <Text style={styles.studyProgress}>
            {currentIndex + 1} / {flashcards.length}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        <TouchableOpacity style={styles.flipCard} onPress={handleFlip}>
          <View style={styles.flipContent}>
            <Text style={styles.flipQuestion}>{card.question}</Text>
            {showAnswer && (
              <View style={styles.answerSection}>
                <Text style={styles.answerDivider}>↓ Answer ↓</Text>
                <Text style={styles.flipAnswer}>{card.answer}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>

        {!showAnswer && (
          <Text style={styles.tapHint}>Tap card to reveal answer</Text>
        )}

        <View style={styles.studyNav}>
          <TouchableOpacity style={styles.navBtn} onPress={handlePrevious}>
            <Text style={styles.navBtnText}>← Previous</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.navBtn, styles.flipBtn]} onPress={handleFlip}>
            <Text style={styles.flipBtnText}>{showAnswer ? 'Hide' : 'Show'} Answer</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navBtn} onPress={handleNext}>
            <Text style={styles.navBtnText}>Next →</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>📚 Flashcards</Text>
      
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>{flashcards.length}</Text>
          <Text style={styles.statLabel}>Cards</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>{flashcards.filter(f => f.question?.length > 50).length}</Text>
          <Text style={styles.statLabel}>Long</Text>
        </View>
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.studyButton} onPress={() => { setMode('study'); setCurrentIndex(0); setShowAnswer(false); }}>
          <Text style={styles.studyButtonText}>📖 Study Mode</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.addButton} onPress={() => setShowForm(true)}>
          <Text style={styles.addButtonText}>+ New</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.importBtn} onPress={importFromBookmarks}>
          <Text style={styles.importBtnText}>📥</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={flashcards}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <TouchableOpacity style={styles.cardItem} onPress={() => editFlashcard(item)}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardNum}>#{index + 1}</Text>
              <TouchableOpacity onPress={() => deleteFlashcard(item.id)}>
                <Text style={styles.deleteBtn}>🗑️</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.cardQuestion} numberOfLines={2}>{item.question}</Text>
            <Text style={styles.cardAnswer} numberOfLines={1}>{item.answer}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No flashcards yet</Text>
          </View>
        }
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
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: theme.text,
    marginBottom: spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  statBox: {
    flex: 1,
    backgroundColor: theme.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
  },
  statNum: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.primary,
  },
  statLabel: {
    fontSize: 12,
    color: theme.dimText,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  studyButton: {
    flex: 1,
    backgroundColor: theme.primary,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  studyButtonText: {
    color: theme.background,
    fontWeight: '700',
  },
  addButton: {
    backgroundColor: theme.success,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
  },
  addButtonText: {
    color: theme.text,
    fontWeight: '700',
  },
  importBtn: {
    backgroundColor: theme.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: theme.border,
  },
  importBtnText: {
    fontSize: 16,
  },
  cardItem: {
    backgroundColor: theme.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  cardNum: {
    fontSize: 12,
    color: theme.primary,
    fontWeight: '700',
  },
  deleteBtn: {
    fontSize: 16,
  },
  cardQuestion: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text,
    marginBottom: spacing.xs,
  },
  cardAnswer: {
    fontSize: 12,
    color: theme.dimText,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.text,
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontSize: 14,
    color: theme.dimText,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  emptyButton: {
    backgroundColor: theme.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  emptyButtonText: {
    color: theme.background,
    fontWeight: '700',
  },
  importButton: {
    backgroundColor: theme.surface,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: theme.border,
  },
  importButtonText: {
    color: theme.text,
    fontWeight: '600',
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  backBtn: {
    fontSize: 16,
    color: theme.primary,
    fontWeight: '600',
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.text,
  },
  formContainer: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: theme.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: 16,
    color: theme.text,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: theme.border,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  answerInput: {
    minHeight: 80,
  },
  saveButton: {
    backgroundColor: theme.primary,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  saveButtonText: {
    color: theme.background,
    fontWeight: '700',
  },
  studyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  studyProgress: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.text,
  },
  flipCard: {
    flex: 1,
    backgroundColor: theme.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  flipContent: {
    alignItems: 'center',
  },
  flipQuestion: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.text,
    textAlign: 'center',
  },
  answerSection: {
    marginTop: spacing.xl,
    alignItems: 'center',
  },
  answerDivider: {
    fontSize: 12,
    color: theme.dimText,
    marginBottom: spacing.sm,
  },
  flipAnswer: {
    fontSize: 18,
    color: theme.primary,
    fontWeight: '600',
    textAlign: 'center',
  },
  tapHint: {
    textAlign: 'center',
    color: theme.dimText,
    fontSize: 14,
    marginVertical: spacing.md,
  },
  studyNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  navBtn: {
    backgroundColor: theme.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: theme.border,
    flex: 1,
    alignItems: 'center',
    marginHorizontal: spacing.xs,
  },
  navBtnText: {
    color: theme.text,
    fontWeight: '600',
  },
  flipBtn: {
    backgroundColor: theme.primary,
    borderColor: theme.primary,
  },
  flipBtnText: {
    color: theme.background,
    fontWeight: '700',
  },
});

import { StyleSheet } from 'react-native';