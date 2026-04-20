import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme, spacing, borderRadius } from '../styles/theme';

const AUTH_STORAGE_KEY = '@auth_user';
const USERS_STORAGE_KEY = '@app_users';

export default function AuthScreen({ navigation }) {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [user, setUser] = useState(null);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const userData = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
      if (userData) {
        const parsed = JSON.parse(userData);
        setUser(parsed);
        navigation.replace('Main');
      }
    } catch (e) {
      console.log('No stored user');
    }
  };

  const validateInput = () => {
    if (!email && !mobile) {
      Alert.alert('Error', 'Please enter email or mobile number');
      return false;
    }
    if (!password) {
      Alert.alert('Error', 'Please enter password');
      return false;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return false;
    }
    return true;
  };

  const handleSignUp = async () => {
    if (!validateInput()) return;
    
    setLoading(true);
    try {
      const usersData = await AsyncStorage.getItem(USERS_STORAGE_KEY);
      const users = usersData ? JSON.parse(usersData) : [];
      const identifier = email || mobile;
      
      const existing = users.find(u => u.email === identifier || u.mobile === identifier);
      if (existing) {
        Alert.alert('Error', 'User already exists. Please sign in.');
        setLoading(false);
        return;
      }
      
      const newUser = {
        id: Date.now().toString(),
        name: name || identifier.split('@')[0],
        email: email || null,
        mobile: mobile || null,
        password: password,
        created_at: new Date().toISOString()
      };
      
      users.push(newUser);
      await AsyncStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newUser));
      setUser(newUser);
      Alert.alert('Success', 'Account created!');
      if (navigation.replace) navigation.replace('Main');
    } catch (error) {
      console.error('Sign up error:', error);
      Alert.alert('Error', 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async () => {
    if (!validateInput()) return;
    
    setLoading(true);
    try {
      const usersData = await AsyncStorage.getItem(USERS_STORAGE_KEY);
      const users = usersData ? JSON.parse(usersData) : [];
      const identifier = email || mobile;
      
      const user = users.find(u => 
        (u.email === identifier || u.mobile === identifier) && u.password === password
      );
      
      if (!user) {
        Alert.alert('Error', 'Invalid email/mobile or password');
        setLoading(false);
        return;
      }

      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
      setUser(user);
      if (navigation.replace) navigation.replace('Main');
    } catch (error) {
      console.error('Sign in error:', error);
      Alert.alert('Error', 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleGuest = () => {
    navigation.replace('Main');
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
    setUser(null);
  };

  if (user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.userCard}>
          <Text style={styles.welcomeText}>Welcome back!</Text>
          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.userEmail}>{user.email || user.mobile}</Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.guestButton} onPress={handleGuest}>
          <Text style={styles.guestText}>Go to App</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.title}>{isLogin ? 'Sign In' : 'Sign Up'}</Text>
            <Text style={styles.subtitle}>
              {isLogin ? 'Welcome back!' : 'Create an account'}
            </Text>
          </View>

          <View style={styles.form}>
            {!isLogin && (
              <TextInput
                style={styles.input}
                placeholder="Full Name (optional)"
                placeholderTextColor={theme.dimText}
                value={name}
                onChangeText={setName}
              />
            )}

            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={theme.dimText}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <TextInput
              style={styles.input}
              placeholder="OR Mobile Number"
              placeholderTextColor={theme.dimText}
              value={mobile}
              onChangeText={setMobile}
              keyboardType="phone-pad"
            />

            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor={theme.dimText}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={isLogin ? handleSignIn : handleSignUp}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={theme.background} />
              ) : (
                <Text style={styles.buttonText}>
                  {isLogin ? 'Sign In' : 'Sign Up'}
                </Text>
              )}
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              style={styles.guestBtn}
              onPress={handleGuest}
            >
              <Text style={styles.guestBtnText}>Continue as Guest</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.switchContainer}>
            <Text style={styles.switchText}>
              {isLogin ? "Don't have an account? " : 'Already have an account? '}
            </Text>
            <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
              <Text style={styles.switchLink}>
                {isLogin ? 'Sign Up' : 'Sign In'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
    padding: spacing.md,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: theme.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 16,
    color: theme.dimText,
  },
  form: {
    marginBottom: spacing.lg,
  },
  input: {
    backgroundColor: theme.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    fontSize: 16,
    color: theme.text,
    borderWidth: 1,
    borderColor: theme.border,
  },
  button: {
    backgroundColor: theme.primary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: theme.background,
    fontSize: 16,
    fontWeight: '700',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.border,
  },
  dividerText: {
    color: theme.dimText,
    marginHorizontal: spacing.md,
    fontSize: 14,
  },
  guestBtn: {
    backgroundColor: theme.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.border,
  },
  guestBtnText: {
    color: theme.text,
    fontSize: 16,
    fontWeight: '600',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  switchText: {
    color: theme.dimText,
    fontSize: 14,
  },
  switchLink: {
    color: theme.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  userCard: {
    backgroundColor: theme.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  welcomeText: {
    fontSize: 16,
    color: theme.dimText,
    marginBottom: spacing.sm,
  },
  userName: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.text,
    marginBottom: spacing.xs,
  },
  userEmail: {
    fontSize: 14,
    color: theme.primary,
  },
  logoutButton: {
    backgroundColor: theme.error,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  logoutText: {
    color: theme.text,
    fontSize: 16,
    fontWeight: '700',
  },
  guestButton: {
    backgroundColor: theme.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.border,
  },
  guestText: {
    color: theme.text,
    fontSize: 16,
    fontWeight: '600',
  },
});

import { StyleSheet } from 'react-native';