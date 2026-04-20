import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme, spacing, borderRadius } from '../styles/theme';

const AUTH_STORAGE_KEY = '@auth_user';
const QUIZ_RESULTS_KEY = '@quiz_results';
const STREAK_KEY = '@user_streak';

export default function ProfileScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [stats, setStats] = useState({ total: 0, avgScore: 0, bestScore: 0, mockTests: 0 });
  const [streakData, setStreakData] = useState({ current: 0, best: 0, totalQuizzes: 0 });

  useEffect(() => {
    loadUser();
    loadStats();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
      if (userData) {
        setUser(JSON.parse(userData));
        setEditName(JSON.parse(userData).name || '');
      }
    } catch (e) {
      console.log('No user');
    }
  };

  const loadStats = async () => {
    try {
      const resultsData = await AsyncStorage.getItem(QUIZ_RESULTS_KEY);
      const results = resultsData ? JSON.parse(resultsData) : [];
      
      const total = results.length;
      const avgScore = total > 0 
        ? Math.round(results.reduce((sum, r) => sum + (r.percentage || 0), 0) / total)
        : 0;
      
      const bestScore = total > 0 
        ? Math.max(...results.map(r => r.percentage || 0))
        : 0;
      
      const mockTests = results.filter(r => r.isMockTest).length;
      
      setStats({ total, avgScore, bestScore, mockTests });
      
      const streakDataRaw = await AsyncStorage.getItem(STREAK_KEY);
      if (streakDataRaw) {
        const streak = JSON.parse(streakDataRaw);
        setStreakData({ 
          current: streak.current || 0, 
          best: streak.best || 0, 
          totalQuizzes: streak.totalQuizzes || 0 
        });
      }
    } catch (e) {
      console.log('No stats');
    }
  };

  const handleSaveName = async () => {
    if (!editName.trim()) {
      Alert.alert('Error', 'Please enter a name');
      return;
    }
    try {
      const updatedUser = { ...user, name: editName.trim() };
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updatedUser));
      setUser(updatedUser);
      setEditing(false);
      Alert.alert('Success', 'Name updated!');
    } catch (e) {
      Alert.alert('Error', 'Could not save');
    }
  };

  const handleLogin = () => {
    if (navigation.navigate) {
      navigation.navigate('Auth');
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
            setUser(null);
          }
        }
      ]
    );
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
        </View>
        <View style={styles.guestContainer}>
          <Text style={styles.guestIcon}>👤</Text>
          <Text style={styles.guestTitle}>Guest User</Text>
          <Text style={styles.guestText}>
            Sign in to track your progress
          </Text>
          <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
            <Text style={styles.loginButtonText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user.name ? user.name.charAt(0).toUpperCase() : '?'}
          </Text>
        </View>
        
        {editing ? (
          <View style={styles.editContainer}>
            <TextInput
              style={styles.input}
              value={editName}
              onChangeText={setEditName}
              placeholder="Enter your name"
              placeholderTextColor={theme.dimText}
            />
            <View style={styles.editButtons}>
              <TouchableOpacity 
                style={styles.saveButton} 
                onPress={handleSaveName}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={() => { setEditing(false); setEditName(user.name || ''); }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity onPress={() => setEditing(true)}>
            <Text style={styles.userName}>{user.name || 'Tap to add name'}</Text>
          </TouchableOpacity>
        )}
        
        <Text style={styles.userEmail}>{user.email || user.mobile || 'No contact'}</Text>
      </View>

      <View style={styles.statsCard}>
        <Text style={styles.statsTitle}>Your Stats</Text>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.total}</Text>
            <Text style={styles.statLabel}>Quizzes</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.avgScore}%</Text>
            <Text style={styles.statLabel}>Avg</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: theme.success }]}>{stats.bestScore}%</Text>
            <Text style={styles.statLabel}>Best</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.statsCard}>
        <Text style={styles.statsTitle}>🔥 Streak</Text>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: theme.warning }]}>{streakData.current}</Text>
            <Text style={styles.statLabel}>Current</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: theme.success }]}>{streakData.best}</Text>
            <Text style={styles.statLabel}>Best</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{streakData.totalQuizzes}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.statsCard}>
        <Text style={styles.statsTitle}>🎯 Mock Tests</Text>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.mockTests}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
        </View>
      </View>

      <View style={styles.quickActions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => navigation.navigate?.('StudyPlan')}
        >
          <Text style={styles.actionIcon}>📋</Text>
          <Text style={styles.actionText}>Study Plan</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => navigation.navigate?.('AITutor')}
        >
          <Text style={styles.actionIcon}>🤖</Text>
          <Text style={styles.actionText}>AI Tutor</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Sign Out</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
    padding: spacing.md,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: theme.text,
    marginBottom: spacing.lg,
  },
  header: {
    marginBottom: spacing.lg,
  },
  profileCard: {
    backgroundColor: theme.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '800',
    color: theme.background,
  },
  userName: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.text,
    marginBottom: spacing.xs,
  },
  userEmail: {
    fontSize: 14,
    color: theme.dimText,
  },
  editContainer: {
    width: '100%',
  },
  input: {
    backgroundColor: theme.background,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: 16,
    color: theme.text,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: theme.border,
  },
  editButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  saveButton: {
    backgroundColor: theme.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  saveButtonText: {
    color: theme.background,
    fontWeight: '700',
  },
  cancelButton: {
    backgroundColor: theme.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: theme.border,
  },
  cancelButtonText: {
    color: theme.text,
    fontWeight: '600',
  },
  statsCard: {
    backgroundColor: theme.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.text,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: '800',
    color: theme.primary,
  },
  statLabel: {
    fontSize: 14,
    color: theme.dimText,
  },
  logoutButton: {
    backgroundColor: theme.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.error,
  },
  logoutButtonText: {
    color: theme.error,
    fontSize: 16,
    fontWeight: '700',
  },
  quickActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  actionButton: {
    flex: 1,
    backgroundColor: theme.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.border,
  },
  actionIcon: {
    fontSize: 28,
    marginBottom: spacing.xs,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text,
  },
  guestContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  guestIcon: {
    fontSize: 64,
    marginBottom: spacing.lg,
  },
  guestTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.text,
    marginBottom: spacing.sm,
  },
  guestText: {
    fontSize: 14,
    color: theme.dimText,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  loginButton: {
    backgroundColor: theme.primary,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  loginButtonText: {
    color: theme.background,
    fontSize: 16,
    fontWeight: '700',
  },
});

import { StyleSheet } from 'react-native';