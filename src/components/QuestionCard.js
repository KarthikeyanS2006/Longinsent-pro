import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { theme, spacing, borderRadius } from '../styles/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BOOKMARKS_KEY = '@bookmarks';

export default function QuestionCard({ question, index, total, showExplanation = true, examName, onBookmark, selectedAnswer, onSelectAnswer }) {
  const [bookmarked, setBookmarked] = useState(false);

  const hasSelected = selectedAnswer !== undefined && selectedAnswer !== null;

  if (!question) {
    return (
      <View style={styles.container}>
        <Text style={styles.questionText}>Question not available</Text>
      </View>
    );
  }

  const handleSelectOption = (optionIndex) => {
    if (hasSelected) return;
    onSelectAnswer?.(optionIndex);
  };

  const handleBookmark = async () => {
    try {
      const existing = await AsyncStorage.getItem(BOOKMARKS_KEY);
      const bookmarks = existing ? JSON.parse(existing) : [];
      
      const newBookmark = {
        id: Date.now().toString(),
        question: question.question_text || question.question,
        examName: examName || 'Quiz',
        questionId: question.id,
        createdAt: new Date().toISOString(),
      };
      
      bookmarks.unshift(newBookmark);
      await AsyncStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
      setBookmarked(true);
      Alert.alert('Saved', 'Question saved to bookmarks!');
    } catch (e) {
      Alert.alert('Error', 'Could not save bookmark');
    }
  };

  const getOptionStyle = (optionIndex) => {
    if (!hasSelected) {
      return styles.optionButton;
    }
    
    const opt = question.options[optionIndex];
    const isCorrect = opt && opt.is_correct === true;
    const isSelected = selectedAnswer === optionIndex;
    
    if (isCorrect) {
      return { ...styles.optionButton, ...styles.optionCorrect };
    }
    
    if (isSelected && !isCorrect) {
      return { ...styles.optionButton, ...styles.optionWrong };
    }
    
    return styles.optionButton;
  };

  const getOptionTextStyle = (optionIndex) => {
    if (!hasSelected) {
      return styles.optionText;
    }
    
    const opt = question.options[optionIndex];
    const isCorrect = opt && opt.is_correct === true;
    const isSelected = selectedAnswer === optionIndex;
    
    if (isCorrect || (isSelected && !isCorrect)) {
      return { ...styles.optionText, ...styles.optionTextSelected };
    }
    
    return styles.optionText;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.badgeContainer}>
          <Text style={styles.badgeText}>Question {index + 1}/{total}</Text>
        </View>
        <TouchableOpacity onPress={handleBookmark} style={styles.bookmarkBtn}>
          <Text style={styles.bookmarkIcon}>{bookmarked ? '🔖' : '📑'}</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.questionText}>{question.question_text || question.question || question.question_text}</Text>

      <View style={styles.optionsContainer}>
        {question.options.map((option, idx) => (
          <TouchableOpacity
            key={idx}
            style={getOptionStyle(idx)}
            onPress={() => handleSelectOption(idx)}
            disabled={hasSelected}
          >
            <View style={styles.optionLetter}>
              <Text style={styles.optionLetterText}>
                {String.fromCharCode(65 + idx)}
              </Text>
            </View>
            <Text style={getOptionTextStyle(idx)}>{option.text}</Text>
            {hasSelected && option.is_correct && (
              <View style={styles.correctIcon}>
                <Text style={styles.iconText}>✓</Text>
              </View>
            )}
            {hasSelected && selectedAnswer === idx && !option.is_correct && (
              <View style={styles.wrongIcon}>
                <Text style={styles.iconText}>✗</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {hasSelected && question.explanation && showExplanation && question.explanation !== null && (
        <View style={styles.explanationContainer}>
          <View style={styles.explanationHeader}>
            <Text style={styles.explanationTitle}>📖 Explanation</Text>
          </View>
          
          {question.explanation.english && (
            <View style={styles.explanationSection}>
              <Text style={styles.explanationLabel}>English:</Text>
              <Text style={styles.explanationText}>
                {question.explanation.english}
              </Text>
            </View>
          )}
          
          {question.explanation.tanglish && (
            <View style={styles.tanglishSection}>
              <Text style={styles.tanglishLabel}>தமிழில் (Tanglish):</Text>
              <Text style={styles.tanglishText}>
                {question.explanation.tanglish}
              </Text>
            </View>
          )}
          
          {question.explanation.topic && (
            <View style={styles.topicSection}>
              <Text style={styles.topicLabel}>Topic:</Text>
              <Text style={styles.topicText}>{question.explanation.topic}</Text>
            </View>
          )}
        </View>
      )}
    </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  badgeContainer: {
    backgroundColor: theme.primary,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  badgeText: {
    color: theme.background,
    fontSize: 12,
    fontWeight: '700',
  },
  bookmarkBtn: {
    padding: spacing.xs,
  },
  bookmarkIcon: {
    fontSize: 20,
  },
  subjectBadge: {
    backgroundColor: theme.card,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  subjectText: {
    color: theme.dimText,
    fontSize: 12,
  },
  questionText: {
    color: theme.text,
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 26,
    marginBottom: spacing.md,
  },
  optionsContainer: {
    gap: spacing.sm,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: theme.border,
  },
  optionCorrect: {
    backgroundColor: '#052e16',
    borderColor: theme.success,
  },
  optionWrong: {
    backgroundColor: '#450a0a',
    borderColor: theme.error,
  },
  optionLetter: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    backgroundColor: theme.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  optionLetterText: {
    color: theme.primary,
    fontWeight: '700',
    fontSize: 14,
  },
  optionText: {
    color: theme.text,
    fontSize: 16,
    flex: 1,
  },
  optionTextSelected: {
    fontWeight: '600',
  },
  correctIcon: {
    marginLeft: spacing.sm,
    color: theme.success,
  },
  wrongIcon: {
    marginLeft: spacing.sm,
    color: theme.error,
  },
  iconText: {
    fontSize: 18,
    fontWeight: '700',
  },
  explanationContainer: {
    marginTop: spacing.md,
    backgroundColor: '#0c4a6e',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: theme.primary,
  },
  explanationHeader: {
    marginBottom: spacing.sm,
  },
  explanationTitle: {
    color: theme.primary,
    fontSize: 16,
    fontWeight: '700',
  },
  explanationSection: {
    marginBottom: spacing.sm,
  },
  explanationLabel: {
    color: theme.text,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: spacing.xs,
    opacity: 0.7,
  },
  explanationText: {
    color: theme.text,
    fontSize: 14,
    lineHeight: 22,
  },
  tanglishSection: {
    marginBottom: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  tanglishLabel: {
    color: theme.secondary,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  tanglishText: {
    color: theme.text,
    fontSize: 14,
    lineHeight: 22,
    fontStyle: 'italic',
  },
  topicSection: {
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  topicLabel: {
    color: theme.dimText,
    fontSize: 12,
    marginBottom: spacing.xs,
  },
  topicText: {
    color: theme.warning,
    fontSize: 13,
  },
});

import { StyleSheet } from 'react-native';
