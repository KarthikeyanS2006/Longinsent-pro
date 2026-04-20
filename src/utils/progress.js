import AsyncStorage from '@react-native-async-storage/async-storage';

const PROGRESS_KEY = '@user_progress';
const QUIZ_RESULTS_KEY = '@quiz_results';
const STREAK_KEY = '@user_streak';

export async function getProgress() {
  try {
    const data = await AsyncStorage.getItem(PROGRESS_KEY);
    return data ? JSON.parse(data) : {
      totalQuizzes: 0,
      totalCorrect: 0,
      totalQuestions: 0,
      subjectProgress: {},
      lastActivity: null,
    };
  } catch (e) {
    return { totalQuizzes: 0, totalCorrect: 0, totalQuestions: 0, subjectProgress: {}, lastActivity: null };
  }
}

export async function saveProgress(progress) {
  try {
    await AsyncStorage.setItem(PROGRESS_KEY, JSON.stringify({
      ...progress,
      lastActivity: new Date().toISOString(),
    }));
  } catch (e) {
    console.log('Error saving progress:', e);
  }
}

export async function updateProgressAfterQuiz(result) {
  try {
    const progress = await getProgress();
    
    progress.totalQuizzes += 1;
    progress.totalCorrect += result.correct || 0;
    progress.totalQuestions += result.total || 0;
    
    const subject = result.subject || 'general';
    if (!progress.subjectProgress[subject]) {
      progress.subjectProgress[subject] = { quizzes: 0, correct: 0, total: 0 };
    }
    progress.subjectProgress[subject].quizzes += 1;
    progress.subjectProgress[subject].correct += result.correct || 0;
    progress.subjectProgress[subject].total += result.total || 0;
    
    await saveProgress(progress);
    await updateStreak();
  } catch (e) {
    console.log('Error updating progress:', e);
  }
}

export async function getQuizResults() {
  try {
    const data = await AsyncStorage.getItem(QUIZ_RESULTS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

export async function saveQuizResult(result) {
  try {
    const results = await getQuizResults();
    results.unshift({
      ...result,
      id: Date.now().toString(),
      date: new Date().toISOString(),
    });
    const limited = results.slice(0, 100);
    await AsyncStorage.setItem(QUIZ_RESULTS_KEY, JSON.stringify(limited));
  } catch (e) {
    console.log('Error saving quiz result:', e);
  }
}

export async function getStreak() {
  try {
    const data = await AsyncStorage.getItem(STREAK_KEY);
    return data ? JSON.parse(data) : { current: 0, best: 0, lastDate: null, totalQuizzes: 0 };
  } catch (e) {
    return { current: 0, best: 0, lastDate: null, totalQuizzes: 0 };
  }
}

export async function updateStreak() {
  try {
    const streak = await getStreak();
    const today = new Date().toDateString();
    const lastDate = streak.lastDate ? new Date(streak.lastDate).toDateString() : null;
    
    if (lastDate === today) {
      return;
    }
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (lastDate === yesterday.toDateString()) {
      streak.current += 1;
    } else if (lastDate !== today) {
      streak.current = 1;
    }
    
    if (streak.current > streak.best) {
      streak.best = streak.current;
    }
    
    streak.lastDate = today;
    streak.totalQuizzes += 1;
    
    await AsyncStorage.setItem(STREAK_KEY, JSON.stringify(streak));
  } catch (e) {
    console.log('Error updating streak:', e);
  }
}

export async function getWeakAreas(limit = 5) {
  try {
    const progress = await getProgress();
    const results = await getQuizResults();
    
    const subjectStats = {};
    
    results.forEach(r => {
      const subject = r.subject || 'general';
      if (!subjectStats[subject]) {
        subjectStats[subject] = { correct: 0, total: 0, questions: [] };
      }
      subjectStats[subject].correct += r.correct || 0;
      subjectStats[subject].total += r.total || 0;
    });
    
    const weakAreas = Object.entries(subjectStats)
      .map(([subject, stats]) => ({
        subject,
        accuracy: stats.total > 0 ? (stats.correct / stats.total) * 100 : 0,
        total: stats.total,
      }))
      .filter(s => s.total >= 5)
      .sort((a, b) => a.accuracy - b.accuracy)
      .slice(0, limit);
    
    return weakAreas;
  } catch (e) {
    return [];
  }
}

export async function getStats() {
  const progress = await getProgress();
  const streak = await getStreak();
  const results = await getQuizResults();
  
  const total = results.length;
  const avgScore = total > 0 
    ? Math.round(results.reduce((sum, r) => sum + (r.percentage || 0), 0) / total)
    : 0;
  const bestScore = total > 0 
    ? Math.max(...results.map(r => r.percentage || 0))
    : 0;
  const mockTests = results.filter(r => r.isMockTest).length;
  
  return {
    total,
    avgScore,
    bestScore,
    mockTests,
    streak: streak.current,
    bestStreak: streak.best,
    totalQuizzes: streak.totalQuizzes,
  };
}