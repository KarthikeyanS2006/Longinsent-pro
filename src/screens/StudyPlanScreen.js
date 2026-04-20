import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme, spacing, borderRadius } from '../styles/theme';

const STUDY_PLAN_KEY = '@study_plan';

const EXAM_TYPES = [
  { id: 'tnpsc_group4', label: 'TNPSC Group 4', days: 60 },
  { id: 'tnpsc_group2', label: 'TNPSC Group 2', days: 90 },
  { id: 'tnpsc_vao', label: 'TNPSC VAO', days: 45 },
  { id: 'ssc_cgl', label: 'SSC CGL', days: 120 },
  { id: 'ssc_chsl', label: 'SSC CHSL', days: 90 },
  { id: 'rrb', label: 'RRB NTPC', days: 90 },
  { id: 'police', label: 'Police Exam', days: 60 },
  { id: 'custom', label: 'Custom', days: 30 },
];

const SUBJECTS = [
  { id: 'history', label: 'History', icon: '🏛️', color: '#dc2626' },
  { id: 'geography', label: 'Geography', icon: '🌍', color: '#2563eb' },
  { id: 'science', label: 'Science', icon: '🔬', color: '#16a34a' },
  { id: 'maths', label: 'Maths', icon: '🔢', color: '#9333ea' },
  { id: 'tamil', label: 'Tamil', icon: '🗣️', color: '#ea580c' },
  { id: 'english', label: 'English', icon: '📖', color: '#0891b2' },
  { id: 'current', label: 'Current Affairs', icon: '📰', color: '#be185d' },
  { id: 'logic', label: 'Logic', icon: '🧩', color: '#4f46e5' },
];

export default function StudyPlanScreen({ navigation }) {
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);
  const [selectedDays, setSelectedDays] = useState(60);
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [customDays, setCustomDays] = useState(60);

  useEffect(() => {
    loadPlan();
  }, []);

  const loadPlan = async () => {
    try {
      setLoading(true);
      const data = await AsyncStorage.getItem(STUDY_PLAN_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        setPlan(parsed);
        setSelectedExam(parsed.examType);
        setSelectedDays(parsed.days);
        setSelectedSubjects(parsed.subjects || []);
      }
    } catch (e) {
      console.log('Load error:', e);
    } finally {
      setLoading(false);
    }
  };

  const createPlan = async () => {
    if (!selectedExam) {
      Alert.alert('Select Exam', 'Please select an exam type');
      return;
    }
    if (selectedSubjects.length === 0) {
      Alert.alert('Select Subjects', 'Please select at least one subject');
      return;
    }

    const daysPerSubject = Math.floor(selectedDays / selectedSubjects.length);
    const newPlan = {
      examType: selectedExam,
      days: selectedDays,
      subjects: selectedSubjects.map(subj => ({
        ...subj,
        daysAllotted: daysPerSubject,
        completed: 0,
      })),
      startDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    try {
      await AsyncStorage.setItem(STUDY_PLAN_KEY, JSON.stringify(newPlan));
      setPlan(newPlan);
      setShowForm(false);
      Alert.alert('Success', 'Study plan created!');
    } catch (e) {
      Alert.alert('Error', 'Could not save plan');
    }
  };

  const deletePlan = async () => {
    Alert.alert('Delete Plan', 'Delete your current study plan?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.removeItem(STUDY_PLAN_KEY);
          setPlan(null);
        },
      },
    ]);
  };

  const toggleSubject = (subject) => {
    setSelectedSubjects(prev => {
      if (prev.some(s => s.id === subject.id)) {
        return prev.filter(s => s.id !== subject.id);
      }
      return [...prev, subject];
    });
  };

  const getProgress = () => {
    if (!plan) return 0;
    const total = plan.subjects.length;
    const completed = plan.subjects.filter(s => s.completed >= s.daysAllotted).length;
    return Math.round((completed / total) * 100);
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (plan && !showForm) {
    const progress = getProgress();
    const daysLeft = Math.ceil((plan.days * 24 * 60 * 60 * 1000 - (Date.now() - new Date(plan.startDate).getTime())) / (24 * 60 * 60 * 1000));
    
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>📋 Study Plan</Text>
          <TouchableOpacity onPress={() => setShowForm(true)}>
            <Text style={styles.editBtn}>Edit</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.progressCard}>
          <Text style={styles.progressTitle}>{plan.examType}</Text>
          <Text style={styles.progressDays}>{plan.days} Days Plan</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.progressText}>{progress}% Complete</Text>
          {daysLeft > 0 && <Text style={styles.daysLeft}>{daysLeft} days remaining</Text>}
        </View>

        <ScrollView style={styles.subjectList}>
          {plan.subjects.map((subj, idx) => (
            <View key={idx} style={styles.subjectCard}>
              <View style={styles.subjectHeader}>
                <Text style={styles.subjectIcon}>{subj.label.includes('History') ? '🏛️' : subj.label.includes('Geography') ? '🌍' : subj.label.includes('Science') ? '🔬' : '📚'}</Text>
                <Text style={styles.subjectName}>{subj.label}</Text>
                <Text style={styles.subjectDays}>{subj.daysAllotted} days</Text>
              </View>
              <TouchableOpacity 
                style={styles.completeBtn}
                onPress={async () => {
                  const updated = plan.subjects.map(s => 
                    s.label === subj.label ? { ...s, completed: (s.completed || 0) + (plan.days / plan.subjects.length) } : s
                  );
                  const newPlan = { ...plan, subjects: updated };
                  await AsyncStorage.setItem(STUDY_PLAN_KEY, JSON.stringify(newPlan));
                  setPlan(newPlan);
                }}
              >
                <Text style={styles.completeBtnText}>✓ Complete</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>

        <TouchableOpacity style={styles.deleteBtn} onPress={deletePlan}>
          <Text style={styles.deleteBtnText}>🗑️ Delete Plan</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => { if (plan) setShowForm(false); }}>
          <Text style={styles.backBtn}>{plan ? '← Back' : ''}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{showForm ? 'Create Plan' : '📋 Study Plan'}</Text>
        <View style={{ width: 40 }} />
      </View>

      {!plan && !showForm && (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyTitle}>No Study Plan</Text>
          <Text style={styles.emptyText}>
            Create a personalized study plan for your exam
          </Text>
          <TouchableOpacity style={styles.createButton} onPress={() => setShowForm(true)}>
            <Text style={styles.createButtonText}>Create Plan</Text>
          </TouchableOpacity>
        </View>
      )}

      {showForm && (
        <ScrollView style={styles.form}>
          <Text style={styles.formLabel}>Select Exam</Text>
          <View style={styles.examGrid}>
            {EXAM_TYPES.map(exam => (
              <TouchableOpacity
                key={exam.id}
                style={[styles.examChip, selectedExam === exam.label && styles.examChipActive]}
                onPress={() => { setSelectedExam(exam.label); setCustomDays(exam.days); }}
              >
                <Text style={[styles.examChipText, selectedExam === exam.label && styles.examChipTextActive]}>
                  {exam.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.formLabel}>Duration (days)</Text>
          <View style={styles.daysRow}>
            {[30, 45, 60, 90, 120].map(d => (
              <TouchableOpacity
                key={d}
                style={[styles.dayChip, selectedDays === d && styles.dayChipActive]}
                onPress={() => setSelectedDays(d)}
              >
                <Text style={[styles.dayChipText, selectedDays === d && styles.dayChipTextActive]}>{d}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.formLabel}>Select Subjects</Text>
          <View style={styles.subjectGrid}>
            {SUBJECTS.map(subj => (
              <TouchableOpacity
                key={subj.id}
                style={[styles.subjectChip, selectedSubjects.some(s => s.id === subj.id) && { backgroundColor: subj.color }]}
                onPress={() => toggleSubject(subj)}
              >
                <Text style={styles.subjectChipIcon}>{subj.icon}</Text>
                <Text style={[styles.subjectChipText, selectedSubjects.some(s => s.id === subj.id) && { color: '#fff' }]}>
                  {subj.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.saveButton} onPress={createPlan}>
            <Text style={styles.saveButtonText}>Create Study Plan</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
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
  header: {
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
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: theme.text,
  },
  editBtn: {
    fontSize: 16,
    color: theme.primary,
    fontWeight: '600',
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
  createButton: {
    backgroundColor: theme.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  createButtonText: {
    color: theme.background,
    fontWeight: '700',
  },
  progressCard: {
    backgroundColor: theme.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    marginBottom: spacing.lg,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.text,
  },
  progressDays: {
    fontSize: 14,
    color: theme.dimText,
    marginBottom: spacing.md,
  },
  progressBar: {
    height: 8,
    backgroundColor: theme.card,
    borderRadius: 4,
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.success,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.success,
  },
  daysLeft: {
    fontSize: 12,
    color: theme.dimText,
    marginTop: spacing.xs,
  },
  subjectList: {
    flex: 1,
  },
  subjectCard: {
    backgroundColor: theme.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  subjectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  subjectIcon: {
    fontSize: 20,
    marginRight: spacing.sm,
  },
  subjectName: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text,
    flex: 1,
  },
  subjectDays: {
    fontSize: 12,
    color: theme.dimText,
    marginRight: spacing.md,
  },
  completeBtn: {
    backgroundColor: theme.success,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  completeBtnText: {
    fontSize: 12,
    color: theme.text,
    fontWeight: '600',
  },
  deleteBtn: {
    backgroundColor: theme.error,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  deleteBtnText: {
    color: theme.text,
    fontWeight: '600',
  },
  form: {
    flex: 1,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.text,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  examGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  examChip: {
    backgroundColor: theme.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: theme.border,
  },
  examChipActive: {
    backgroundColor: theme.primary,
    borderColor: theme.primary,
  },
  examChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text,
  },
  examChipTextActive: {
    color: theme.background,
  },
  daysRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  dayChip: {
    backgroundColor: theme.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: theme.border,
  },
  dayChipActive: {
    backgroundColor: theme.primary,
    borderColor: theme.primary,
  },
  dayChipText: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.text,
  },
  dayChipTextActive: {
    color: theme.background,
  },
  subjectGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  subjectChip: {
    backgroundColor: theme.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.border,
  },
  subjectChipIcon: {
    fontSize: 16,
    marginRight: spacing.xs,
  },
  subjectChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text,
  },
  saveButton: {
    backgroundColor: theme.primary,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.xxl,
  },
  saveButtonText: {
    color: theme.background,
    fontSize: 16,
    fontWeight: '700',
  },
});

import { StyleSheet } from 'react-native';