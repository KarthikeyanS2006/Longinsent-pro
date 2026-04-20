import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Dimensions, Modal } from 'react-native';

import HomeScreen from './src/screens/HomeScreen';
import CategoryScreen from './src/screens/CategoryScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import QuizScreen from './src/screens/QuizScreen';
import AuthScreen from './src/screens/AuthScreen';
import FlashcardsScreen from './src/screens/FlashcardsScreen';
import StudyPlanScreen from './src/screens/StudyPlanScreen';
import AITutorScreen from './src/screens/AITutorScreen';
import { theme } from './src/styles/theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const TAB_NAMES = ['Home', 'Categories', 'Flashcards', 'Profile'];
const TAB_ICONS = { Home: '🏠', Categories: '📚', Flashcards: '🗃️', Profile: '👤' };

function MainContent({ activeTab, setActiveTab, showAuth, setShowAuth, showQuiz, setShowQuiz, showStudyPlan, setShowStudyPlan, showAITutor, setShowAITutor, selectedExam, setSelectedExam, selectedMode, setSelectedMode }) {
  const insets = useSafeAreaInsets();
  const isSmallScreen = SCREEN_HEIGHT < 700;
  
  const nav = {
    navigate: (screen, params) => {
      if (screen === 'Auth') {
        setShowAuth(true);
      } else if (screen === 'Quiz' && params?.exam) {
        setSelectedExam(params.exam);
        setSelectedMode(params.mode || 'practice');
        setShowQuiz(true);
      } else if (screen === 'StudyPlan') {
        setShowStudyPlan(true);
      } else if (screen === 'AITutor') {
        setShowAITutor(true);
      }
    },
    goBack: () => {
      setShowQuiz(false);
      setShowAuth(false);
      setShowStudyPlan(false);
      setShowAITutor(false);
    }
  };
  
  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: isSmallScreen ? 8 : 0 }]}>
      <View style={styles.screenArea}>
        {activeTab === 'Home' && <HomeScreen navigation={nav} />}
        {activeTab === 'Categories' && <CategoryScreen navigation={nav} />}
        {activeTab === 'Flashcards' && <FlashcardsScreen navigation={nav} />}
        {activeTab === 'Profile' && <ProfileScreen navigation={nav} />}
      </View>
      <View style={[styles.tabBar, { paddingBottom: insets.bottom || (Platform.OS === 'ios' ? 20 : 12) }]}>
        {TAB_NAMES.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabItem, activeTab === tab && styles.tabItemActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={styles.tabIcon}>{TAB_ICONS[tab]}</Text>
            <Text style={[styles.tabLabel, activeTab === tab && styles.tabLabelActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>
      
      {showQuiz && selectedExam && (
        <View style={styles.modalFull}>
          <QuizScreen navigation={{ goBack: () => setShowQuiz(false) }} route={{ params: { exam: selectedExam, mode: selectedMode } }} />
        </View>
      )}
      
      {showAuth && !showQuiz && (
        <View style={styles.modalFull}>
          <AuthScreen navigation={{ navigate: () => {}, replace: () => setShowAuth(false) }} />
        </View>
      )}
      
      {showStudyPlan && (
        <View style={styles.modalFull}>
          <StudyPlanScreen navigation={{ goBack: () => setShowStudyPlan(false) }} />
        </View>
      )}
      
      {showAITutor && (
        <View style={styles.modalFull}>
          <AITutorScreen navigation={{ goBack: () => setShowAITutor(false) }} />
        </View>
      )}
    </View>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState('Home');
  const [showAuth, setShowAuth] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [showStudyPlan, setShowStudyPlan] = useState(false);
  const [showAITutor, setShowAITutor] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);
  const [selectedMode, setSelectedMode] = useState('practice');
  
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="light" />
        <MainContent 
          activeTab={activeTab} 
          setActiveTab={setActiveTab}
          showAuth={showAuth}
          setShowAuth={setShowAuth}
          showQuiz={showQuiz}
          setShowQuiz={setShowQuiz}
          showStudyPlan={showStudyPlan}
          setShowStudyPlan={setShowStudyPlan}
          showAITutor={showAITutor}
          setShowAITutor={setShowAITutor}
          selectedExam={selectedExam}
          setSelectedExam={setSelectedExam}
          selectedMode={selectedMode}
          setSelectedMode={setSelectedMode}
        />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  authContainer: { flex: 1, backgroundColor: theme.background },
  screenArea: { flex: 1 },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: theme.surface,
    borderTopWidth: 1,
    borderTopColor: theme.border,
    paddingTop: 8,
  },
  tabItem: { flex: 1, alignItems: 'center', paddingVertical: 8 },
  tabItemActive: {},
  tabIcon: { fontSize: 20, marginBottom: 2 },
  tabLabel: { fontSize: 12, color: theme.dimText },
  tabLabelActive: { color: theme.primary, fontWeight: '600' },
  modalFull: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: theme.background,
    zIndex: 100,
  },
});