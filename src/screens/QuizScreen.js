import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  BackHandler,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Sharing from 'expo-sharing';
import { globalStyles } from '../styles/globalStyles';
import { theme, spacing, borderRadius } from '../styles/theme';
import QuestionCard from '../components/QuestionCard';
import { fetchExamById } from '../utils/supabase';
import { getExamFromStorage } from '../utils/storage';

const QUIZ_RESULTS_KEY = '@quiz_results';
const BOOKMARKS_KEY = '@bookmarks';

const DEFAULT_TIMER_MINUTES = 15;

export default function QuizScreen({ navigation, route }) {
  const { exam, mode } = route.params || {};
  
  if (!exam || !exam.id) {
    return (
      <SafeAreaView style={globalStyles.safeArea}>
        <View style={globalStyles.errorContainer}>
          <Text style={globalStyles.errorText}>Invalid exam data. Please go back and try again.</Text>
          <TouchableOpacity style={globalStyles.button} onPress={() => navigation?.goBack?.()}>
            <Text style={globalStyles.buttonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
  
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [showResults, setShowResults] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [isMockTest, setIsMockTest] = useState(mode === 'mock');
  const [timeLeft, setTimeLeft] = useState(DEFAULT_TIMER_MINUTES * 60);
  const [showReview, setShowReview] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    loadQuestions();
    
    if (isMockTest) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            handleFinish();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isMockTest]);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (showResults) {
        navigation?.goBack?.();
        return true;
      }
      return false;
    });

    return () => backHandler.remove();
  }, [showResults]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const loadQuestions = async () => {
    try {
      setLoading(true);
      console.log('Loading exam:', exam.id, exam.exam_name);
      let examData = null;
      let questionsData = [];
      
      // Try database first
      try {
        const result = await fetchExamById(exam.id);
        console.log('Fetch result keys:', Object.keys(result || {}));
        console.log('exam_data type:', typeof result?.exam_data);
        
        if (result?.exam_data) {
          let examDataParsed = result.exam_data;
          if (typeof examDataParsed === 'string') {
            try {
              examDataParsed = JSON.parse(examDataParsed);
              console.log('Parsed exam_data');
            } catch (e) {
              console.error('Failed to parse exam_data:', e);
            }
          }
          
          if (Array.isArray(examDataParsed)) {
            questionsData = examDataParsed;
          } else if (examDataParsed.questions) {
            questionsData = examDataParsed.questions;
          } else if (examDataParsed.document_info) {
            questionsData = examDataParsed.questions || [];
          }
        }
        
        if (questionsData.length > 0) {
          examData = result;
          console.log('Loaded from database:', questionsData.length, 'questions');
        }
      } catch (dbError) {
        console.log('DB fetch failed:', dbError.message);
      }
      
      // Try offline storage if DB failed
      if (questionsData.length === 0) {
        try {
          const offlineResult = await getExamFromStorage(exam.id);
          if (offlineResult.success && offlineResult.data?.exam_data) {
            const od = offlineResult.data.exam_data;
            if (Array.isArray(od)) {
              questionsData = od;
            } else if (od.questions) {
              questionsData = od.questions;
            }
            if (questionsData.length > 0) {
              examData = offlineResult.data;
              setIsOffline(true);
              console.log('Loaded from offline storage:', questionsData.length);
            }
          }
        } catch (offlineError) {
          console.log('Offline fetch failed:', offlineError.message);
        }
      }

      if (questionsData.length > 0) {
        console.log('Setting questions:', questionsData.length);
        // Log first question's full structure to debug
        if (questionsData[0]) {
          const firstQ = questionsData[0];
          console.log('First Q full structure:', JSON.stringify(firstQ).slice(0, 800));
        }
        setQuestions(questionsData);
      } else {
        Alert.alert(
          'No Questions',
          'This exam has no questions. Please try another exam.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      }
    } catch (error) {
      console.error('Load error:', error);
      Alert.alert(
        'Error',
        'Failed to load exam. Please check your connection and try again.',
        [{ text: 'Retry', onPress: () => loadQuestions() }, { text: 'Go Back', onPress: () => navigation.goBack() }]
      );
    } finally {
      setLoading(false);
    }
  };

  // Auto answer current question
  const autoAnswerCurrent = () => {
    const currentQ = questions[currentIndex];
    console.log('autoAnswerCurrent - currentQ keys:', Object.keys(currentQ || {}));
    console.log('autoAnswerCurrent - currentIndex:', currentIndex);
    console.log('autoAnswerCurrent - answers[currentIndex]:', answers[currentIndex]);
    
    if (!currentQ || answers[currentIndex] !== undefined) return;
    
    let correctIndex = -1;
    
    // Check options for is_correct field
    correctIndex = currentQ.options?.findIndex(opt => opt.is_correct === true);
    console.log('autoAnswerCurrent - correctIndex from options.is_correct:', correctIndex);
    
    // Check question-level answer field
    if (correctIndex === -1 && currentQ.answer !== undefined) {
      console.log('autoAnswerCurrent - currentQ.answer:', currentQ.answer);
      correctIndex = parseInt(currentQ.answer) - 1; // answer is 1-based
    }
    
    // Check correct_answer field
    if (correctIndex === -1 && currentQ.correct_answer !== undefined) {
      console.log('autoAnswerCurrent - currentQ.correct_answer:', currentQ.correct_answer);
      correctIndex = parseInt(currentQ.correct_answer) - 1;
    }
    
    // Check answer_index field
    if (correctIndex === -1 && currentQ.answer_index !== undefined) {
      console.log('autoAnswerCurrent - currentQ.answer_index:', currentQ.answer_index);
      correctIndex = parseInt(currentQ.answer_index);
    }
    
    if (correctIndex !== undefined && correctIndex >= 0 && correctIndex < currentQ.options?.length) {
      console.log('autoAnswerCurrent - SETTING answer to:', correctIndex);
      setAnswers(prev => ({ ...prev, [currentIndex]: correctIndex }));
    } else {
      console.log('autoAnswerCurrent - NO CORRECT ANSWER FOUND');
      console.log('autoAnswerCurrent - question full:', JSON.stringify(currentQ));
    }
  };

  const handleNext = () => {
    // Don't auto-answer - user should select themselves
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleFinish = async () => {
    const score = calculateScore();
    const percentage = getPercentage(score.correct, score.total);
    
    const result = {
      id: Date.now().toString(),
      examId: exam?.id || 'unknown',
      examName: exam?.exam_name || exam?.examName || 'Quiz',
      score: score.correct,
      total: score.total,
      percentage: percentage,
      completedAt: new Date().toISOString(),
      isMockTest: isMockTest,
    };
    
    try {
      const existing = await AsyncStorage.getItem(QUIZ_RESULTS_KEY);
      let results = [];
      if (existing) {
        try { results = JSON.parse(existing); } 
        catch { results = []; }
      }
      results.unshift(result);
      await AsyncStorage.setItem(QUIZ_RESULTS_KEY, JSON.stringify(results));
      
      await updateStreak();
    } catch (e) {
      console.log('Save error:', e);
    }
    
    setShowResults(true);
  };
  
  const updateStreak = async () => {
    try {
      const STREAK_KEY = '@user_streak';
      const DAILY_QUIZ_KEY = '@daily_quiz_done';
      const today = new Date().toDateString();
      
      let streakData = await AsyncStorage.getItem(STREAK_KEY);
      let streak = { current: 0, best: 0, lastDate: null, totalQuizzes: 0 };
      
      if (streakData) {
        streak = JSON.parse(streakData);
      }
      
      const lastDate = streak.lastDate ? new Date(streak.lastDate).toDateString() : null;
      
      if (lastDate === today) {
        streak.totalQuizzes = (streak.totalQuizzes || 0) + 1;
      } else {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (lastDate === yesterday.toDateString()) {
          streak.current = (streak.current || 0) + 1;
        } else {
          streak.current = 1;
        }
        streak.totalQuizzes = (streak.totalQuizzes || 0) + 1;
        streak.lastDate = today;
        
        if (streak.current > streak.best) {
          streak.best = streak.current;
        }
      }
      
      await AsyncStorage.setItem(STREAK_KEY, JSON.stringify(streak));
      
      await AsyncStorage.setItem(DAILY_QUIZ_KEY, JSON.stringify({ date: today, done: true }));
    } catch (e) {
      console.log('Streak update error:', e);
    }
  };

  const calculateScore = () => {
    let correct = 0;
    let incorrect = 0;
    let unattempted = 0;

    questions.forEach((q, idx) => {
      const selectedAnswer = answers[idx];
      if (selectedAnswer === undefined) {
        unattempted++;
      } else {
        const correctOption = q.options?.findIndex((opt) => opt.is_correct);
        if (selectedAnswer === correctOption) {
          correct++;
        } else {
          incorrect++;
        }
      }
    });

    return { correct, incorrect, unattempted, total: questions.length };
  };

  const getPercentage = (score, total) => {
    return Math.round((score / total) * 100);
  };

  const getGrade = (percentage) => {
    if (percentage >= 90) return { grade: 'A+', color: theme.success };
    if (percentage >= 80) return { grade: 'A', color: theme.success };
    if (percentage >= 70) return { grade: 'B+', color: theme.primary };
    if (percentage >= 60) return { grade: 'B', color: theme.primary };
    if (percentage >= 50) return { grade: 'C', color: theme.warning };
    return { grade: 'F', color: theme.error };
  };

  const handleRetry = () => {
    setAnswers({});
    setCurrentIndex(0);
    setShowResults(false);
    setShowReview(false);
    if (isMockTest) {
      setTimeLeft(DEFAULT_TIMER_MINUTES * 60);
    }
  };

  const handleExit = () => {
    navigation.goBack();
  };

  const handleShare = async () => {
    const score = calculateScore();
    const percentage = getPercentage(score.correct, score.total);
    const { grade } = getGrade(percentage);
    
    const shareText = `🏆 TNPSC Quiz Results!\n\n📱 Exam: ${exam?.exam_name || exam?.examName || 'Quiz'}\n\n✅ Score: ${score.correct}/${score.total}\n📊 Percentage: ${percentage}%\n🎯 Grade: ${grade}\n\n🎯 Try @LonginsentPro app for TNPSC preparation!`;
    
    try {
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync({
          message: shareText,
        });
      } else {
        Alert.alert('Share', shareText);
      }
    } catch (e) {
      Alert.alert('Share', shareText);
    }
  };

  if (loading) {
    return (
      <View style={globalStyles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={styles.loadingText}>Loading questions...</Text>
      </View>
    );
  }

  if (showResults) {
    const score = calculateScore();
    const percentage = getPercentage(score.correct, score.total);
    const { grade, color } = getGrade(percentage);

    if (showReview) {
      return (
        <SafeAreaView style={globalStyles.safeArea}>
          <View style={styles.reviewHeader}>
            <TouchableOpacity onPress={() => setShowReview(false)}>
              <Text style={styles.backButton}>← Back to Results</Text>
            </TouchableOpacity>
            <Text style={styles.reviewTitle}>Review Answers</Text>
          </View>
          <ScrollView style={styles.reviewList}>
            {questions.map((q, idx) => {
              const userAnswer = answers[idx];
              const correctIdx = q.options?.findIndex(o => o.is_correct);
              const isCorrect = userAnswer === correctIdx;
              
              return (
                <View key={idx} style={styles.reviewCard}>
                  <Text style={styles.reviewQNum}>Q{idx + 1}</Text>
                  <Text style={styles.reviewQText}>{q.question_text || q.question || 'Question'}</Text>
                  <View style={styles.reviewOptions}>
                    {q.options?.map((opt, oIdx) => (
                      <View key={oIdx} style={[
                        styles.reviewOption,
                        oIdx === correctIdx && styles.reviewCorrect,
                        oIdx === userAnswer && oIdx !== correctIdx && styles.reviewWrong,
                      ]}>
                        <Text style={styles.reviewOptionText}>{opt.text}</Text>
                        {oIdx === correctIdx && <Text style={styles.checkIcon}>✓</Text>}
                      </View>
                    ))}
                  </View>
                  <Text style={[styles.reviewResult, isCorrect ? styles.reviewCorrectText : styles.reviewWrongText]}>
                    {isCorrect ? '✓ Correct' : '✗ Wrong'}
                  </Text>
                </View>
              );
            })}
          </ScrollView>
        </SafeAreaView>
      );
    }

    return (
      <SafeAreaView style={globalStyles.safeArea}>
        <View style={styles.resultsContainer}>
          <View style={styles.resultsHeader}>
            <Text style={styles.resultsTitle}>Quiz Complete!</Text>
            {isOffline && (
              <View style={styles.offlineBadge}>
                <Text style={styles.offlineText}>📥 Offline Mode</Text>
              </View>
            )}
          </View>

          <View style={styles.scoreCard}>
            <View style={[styles.gradeCircle, { borderColor: color }]}>
              <Text style={[styles.gradeText, { color }]}>{grade}</Text>
            </View>
            <Text style={styles.percentageText}>{percentage}%</Text>
            <Text style={styles.scoreText}>
              {score.correct} / {score.total} Correct
            </Text>
          </View>

          <View style={styles.statsContainer}>
            <View style={[styles.statCard, { backgroundColor: '#052e16' }]}>
              <Text style={styles.statNumber}>{score.correct}</Text>
              <Text style={styles.statLabel}>Correct</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: '#450a0a' }]}>
              <Text style={styles.statNumber}>{score.incorrect}</Text>
              <Text style={styles.statLabel}>Incorrect</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: theme.card }]}>
              <Text style={styles.statNumber}>{score.unattempted}</Text>
              <Text style={styles.statLabel}>Skipped</Text>
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
              <Text style={styles.retryText}>Try Again</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
              <Text style={styles.shareButtonText}>📤 Share Results</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.reviewButton} onPress={() => setShowReview(true)}>
              <Text style={styles.reviewText}>Review Answers</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.exitButton} onPress={handleExit}>
            <Text style={styles.exitText}>Back to Home</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const currentQuestion = questions[currentIndex];

  return (
    <SafeAreaView style={globalStyles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation?.goBack?.()}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          
          {isMockTest ? (
            <View style={[styles.timerBadge, timeLeft < 60 && styles.timerWarning]}>
              <Text style={styles.timerText}>⏱ {formatTime(timeLeft)}</Text>
            </View>
          ) : (
            <View style={styles.offlineBadge}>
              <Text style={styles.offlineTextSmall}>Practice Mode</Text>
            </View>
          )}
          
          {isOffline && (
            <View style={styles.offlineBadge}>
              <Text style={styles.offlineTextSmall}>📥</Text>
            </View>
          )}
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${((currentIndex + 1) / questions.length) * 100}%` },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {currentIndex + 1} / {questions.length}
          </Text>
        </View>

        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          <QuestionCard
            question={currentQuestion}
            index={currentIndex}
            total={questions.length}
            showExplanation={true}
            examName={exam?.exam_name || exam?.examName || 'Quiz'}
            selectedAnswer={answers[currentIndex]}
            onSelectAnswer={(optionIndex) => {
              setAnswers(prev => ({ ...prev, [currentIndex]: optionIndex }));
            }}
          />
        </ScrollView>

        <View style={styles.navigation}>
          <TouchableOpacity
            style={[styles.navButton, currentIndex === 0 && styles.navButtonDisabled]}
            onPress={handlePrevious}
            disabled={currentIndex === 0}
          >
            <Text style={styles.navButtonText}>← Previous</Text>
          </TouchableOpacity>

          {!isMockTest && answers[currentIndex] === undefined && (
            <TouchableOpacity style={styles.showAnswerButton} onPress={autoAnswerCurrent}>
              <Text style={styles.showAnswerText}>Show Answer</Text>
            </TouchableOpacity>
          )}
          
          {currentIndex === questions.length - 1 ? (
            <TouchableOpacity style={styles.finishButton} onPress={handleFinish}>
              <Text style={styles.finishButtonText}>Finish</Text>
            </TouchableOpacity>
          ) : null}
        </View>
        
        {currentIndex < questions.length - 1 && currentIndex < questions.length && (
          <TouchableOpacity style={styles.nextButtonFull} onPress={handleNext}>
            <Text style={styles.nextButtonText}>Next Question →</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
  },
  backButton: {
    color: theme.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  offlineBadge: {
    backgroundColor: theme.success,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  offlineText: {
    color: theme.text,
    fontSize: 12,
    fontWeight: '600',
  },
  offlineTextSmall: {
    fontSize: 12,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: theme.card,
    borderRadius: 3,
    marginRight: spacing.sm,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.primary,
    borderRadius: 3,
  },
  progressText: {
    color: theme.dimText,
    fontSize: 14,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.border,
    backgroundColor: theme.background,
  },
  navButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: theme.border,
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  navButtonText: {
    color: theme.text,
    fontSize: 14,
    fontWeight: '600',
  },
  nextButton: {
    backgroundColor: theme.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  nextButtonText: {
    color: theme.background,
    fontSize: 14,
    fontWeight: '700',
  },
  finishButton: {
    backgroundColor: theme.success,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  finishButtonText: {
    color: theme.text,
    fontSize: 14,
    fontWeight: '700',
  },
  showAnswerButton: {
    backgroundColor: theme.warning,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  showAnswerText: {
    color: theme.background,
    fontSize: 14,
    fontWeight: '700',
  },
  nextButtonFull: {
    backgroundColor: theme.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  loadingText: {
    color: theme.dimText,
    marginTop: spacing.md,
    fontSize: 14,
  },
  resultsContainer: {
    flex: 1,
    padding: spacing.md,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  resultsTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.text,
  },
  scoreCard: {
    alignItems: 'center',
    backgroundColor: theme.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    marginBottom: spacing.lg,
  },
  gradeCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  gradeText: {
    fontSize: 36,
    fontWeight: '800',
  },
  percentageText: {
    fontSize: 48,
    fontWeight: '800',
    color: theme.text,
    marginBottom: spacing.xs,
  },
  scoreText: {
    fontSize: 16,
    color: theme.dimText,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginHorizontal: spacing.xs,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.text,
  },
  statLabel: {
    fontSize: 12,
    color: theme.dimText,
    marginTop: spacing.xs,
  },
  buttonContainer: {
    gap: spacing.md,
  },
  retryButton: {
    backgroundColor: theme.primary,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  retryText: {
    color: theme.background,
    fontSize: 16,
    fontWeight: '700',
  },
  exitButton: {
    backgroundColor: theme.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.border,
  },
  exitText: {
    color: theme.text,
    fontSize: 16,
    fontWeight: '600',
  },
  timerBadge: {
    backgroundColor: theme.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  timerWarning: {
    backgroundColor: theme.error,
  },
  timerText: {
    color: theme.background,
    fontSize: 14,
    fontWeight: '700',
  },
  reviewButton: {
    backgroundColor: theme.warning,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  shareButton: {
    backgroundColor: theme.primary,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  shareButtonText: {
    color: theme.background,
    fontSize: 16,
    fontWeight: '700',
  },
  reviewText: {
    color: theme.background,
    fontSize: 16,
    fontWeight: '700',
  },
  reviewHeader: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  reviewTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.text,
    marginTop: spacing.sm,
  },
  reviewList: {
    flex: 1,
    padding: spacing.md,
  },
  reviewCard: {
    backgroundColor: theme.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  reviewQNum: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.primary,
    marginBottom: spacing.xs,
  },
  reviewQText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text,
    marginBottom: spacing.sm,
  },
  reviewOptions: {
    gap: spacing.xs,
  },
  reviewOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    backgroundColor: theme.background,
    borderWidth: 1,
    borderColor: theme.border,
  },
  reviewCorrect: {
    borderColor: theme.success,
    backgroundColor: '#052e16',
  },
  reviewWrong: {
    borderColor: theme.error,
    backgroundColor: '#450a0a',
  },
  reviewOptionText: {
    fontSize: 12,
    color: theme.text,
    flex: 1,
  },
  checkIcon: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.success,
  },
  reviewResult: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: spacing.sm,
    textAlign: 'right',
  },
  reviewCorrectText: {
    color: theme.success,
  },
  reviewWrongText: {
    color: theme.error,
  },
});

import { StyleSheet } from 'react-native';
