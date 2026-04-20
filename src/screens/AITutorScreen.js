import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme, spacing, borderRadius } from '../styles/theme';
import { sendChatMessage, saveChatHistory, loadChatHistory, clearChatHistory, AI_MODES } from '../utils/aiService';

const SAMPLE_QUESTIONS = [
  { q: 'What is the capital of Tamil Nadu?', a: 'Chennai (formerly Madras) is the capital city of Tamil Nadu state.' },
  { q: 'Who built Brihadeeswarar Temple?', a: 'The Brihadeeswarar Temple in Thanjavur was built by Raja Raja I Chola in 11th century.' },
  { q: 'What is Article 370?', a: 'Article 370 gave special status to Jammu & Kashmir. It was revoked in 2019.' },
  { q: 'Who is the Father of Indian Constitution?', a: 'Dr. B.R. Ambedkar is known as the Father of the Indian Constitution.' },
  { q: 'What is GST?', a: 'GST (Goods and Services Tax) is an indirect tax used in India since 2017.' },
];

const MODE_OPTIONS = [
  { id: AI_MODES.SOCRATIC, label: 'Socratic', icon: '💭', desc: 'Guide to answers' },
  { id: AI_MODES.SOLVER, label: 'Solver', icon: '📝', desc: 'Step-by-step' },
  { id: AI_MODES.EXAM_PREP, label: 'Exam Prep', icon: '🎯', desc: 'Practice questions' },
];

export default function AITutorScreen({ navigation }) {
  const [messages, setMessages] = useState([
    { type: 'bot', text: 'Hi! I\'m Astra, your AI Tutor powered by Groq Llama. Ask me anything about history, geography, science, maths, Tamil, current affairs, or any TNPSC/UPSC subject!' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState(AI_MODES.SOCRATIC);
  const [chatHistory, setChatHistory] = useState([]);
  const [showModeSelector, setShowModeSelector] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  const scrollViewRef = useRef(null);

  useEffect(() => {
    checkAPIKey();
    loadHistory();
  }, []);

  const checkAPIKey = () => {
    try {
      const apiKey = process.env.EXPO_PUBLIC_GROQ_API_KEY;
      console.log('API Key found:', apiKey ? 'yes' : 'no', apiKey?.substring(0, 5));
      if (apiKey && apiKey.length > 10 && apiKey.startsWith('gsk_')) {
        setIsConfigured(true);
      }
    } catch (e) {
      console.log('Error checking API key:', e);
    }
  };

  const loadHistory = async () => {
    try {
      const history = await loadChatHistory();
      if (history.length > 0) {
        setChatHistory(history);
        const formatted = history.map(msg => ({
          type: msg.type === 'user' ? 'user' : 'bot',
          text: msg.text,
        }));
        setMessages(prev => [...formatted, {
          type: 'bot',
          text: 'Welcome back! Continue learning where you left off.'
        }]);
      }
    } catch (e) {
      console.log('Load history error:', e);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    
    const userMessage = input.trim();
    setInput('');
    
    setMessages(prev => [...prev, { type: 'user', text: userMessage }]);
    setChatHistory(prev => [...prev, { type: 'user', text: userMessage, timestamp: Date.now() }]);
    setLoading(true);

    try {
      let response;
      
      if (isConfigured) {
        response = await sendChatMessage(userMessage, mode, chatHistory);
      } else {
        await new Promise(resolve => setTimeout(resolve, 800));
        const match = SAMPLE_QUESTIONS.find(sq => 
          userMessage.toLowerCase().includes(sq.q.toLowerCase().split(' ')[0]) ||
          sq.q.toLowerCase().split(' ').some(w => userMessage.toLowerCase().includes(w))
        );
        response = match?.a || `I understand you're asking about "${userMessage}".\n\n📚 Key tips for TNPSC exam:\n• Focus on History, Geography, Science, Current Affairs\n• Practice daily quizzes\n• Use flashcards for revision\n\n🔧 To enable AI responses, add your OpenAI API key in .env.local`;
      }
      
      setMessages(prev => [...prev, { type: 'bot', text: response }]);
      setChatHistory(prev => [...prev, { type: 'assistant', text: response, timestamp: Date.now() }]);
      
      await saveChatHistory([
        { type: 'user', text: userMessage },
        { type: 'assistant', text: response },
      ]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { 
        type: 'bot', 
        text: `Sorry, I encountered an error: ${error.message}. Please check your Groq API key.` 
      }]);
    } finally {
      setLoading(false);
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const handleQuickAsk = (question) => {
    setInput(question);
  };

  const handleClearHistory = async () => {
    Alert.alert(
      'Clear Chat History',
      'This will delete all your chat history. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await clearChatHistory();
            setChatHistory([]);
            setMessages([{ 
              type: 'bot', 
              text: 'Chat history cleared! How can I help you today?' 
            }]);
          },
        },
      ]
    );
  };

  const currentMode = MODE_OPTIONS.find(m => m.id === mode);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.headerTitle}>
          <Text style={styles.title}>🤖 Astra AI Tutor</Text>
          <Text style={styles.subtitle}>
            {isConfigured ? 'Groq Llama 3.1' : 'Sample Mode'}
          </Text>
        </View>
        <TouchableOpacity onPress={handleClearHistory}>
          <Text style={styles.clearBtn}>🗑️</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity 
        style={styles.modeSelector}
        onPress={() => setShowModeSelector(!showModeSelector)}
      >
        <Text style={styles.modeIcon}>{currentMode?.icon}</Text>
        <Text style={styles.modeLabel}>{currentMode?.label}</Text>
        <Text style={styles.modeDesc}>{currentMode?.desc}</Text>
        <Text style={styles.modeArrow}>▼</Text>
      </TouchableOpacity>

      {showModeSelector && (
        <View style={styles.modeDropdown}>
          {MODE_OPTIONS.map(opt => (
            <TouchableOpacity
              key={opt.id}
              style={[styles.modeOption, mode === opt.id && styles.modeOptionActive]}
              onPress={() => {
                setMode(opt.id);
                setShowModeSelector(false);
                setMessages(prev => [...prev, {
                  type: 'bot',
                  text: `Switched to ${opt.label} mode! ${opt.desc}. How can I help you learn?`
                }]);
              }}
            >
              <Text style={styles.modeOptionIcon}>{opt.icon}</Text>
              <View style={styles.modeOptionText}>
                <Text style={styles.modeOptionLabel}>{opt.label}</Text>
                <Text style={styles.modeOptionDesc}>{opt.desc}</Text>
              </View>
              {mode === opt.id && <Text style={styles.checkmark}>✓</Text>}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {!isConfigured && (
        <View style={styles.configNote}>
          <Text style={styles.configText}>
            ⚠️ Add EXPO_PUBLIC_GROQ_API_KEY in .env.local for AI responses (get free key at groq.com)
          </Text>
        </View>
      )}

      <ScrollView 
        ref={scrollViewRef}
        style={styles.chatList}
        contentContainerStyle={styles.chatContent}
      >
        {messages.map((msg, idx) => (
          <View 
            key={idx} 
            style={[
              styles.message, 
              msg.type === 'user' ? styles.userMessage : styles.botMessage
            ]}
          >
            <Text style={styles.messageText}>{msg.text}</Text>
          </View>
        ))}
        {loading && (
          <View style={[styles.message, styles.botMessage]}>
            <ActivityIndicator size="small" color={theme.primary} />
            <Text style={styles.loadingText}>  Thinking...</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.quickQuestions}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {SAMPLE_QUESTIONS.slice(0, 4).map((sq, idx) => (
            <TouchableOpacity 
              key={idx} 
              style={styles.quickChip}
              onPress={() => handleQuickAsk(sq.q)}
            >
              <Text style={styles.quickText} numberOfLines={1}>{sq.q.split(' ').slice(0, 4).join(' ')}?</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Ask any question..."
          placeholderTextColor={theme.dimText}
          onSubmitEditing={handleSend}
          multiline
          maxLength={500}
        />
        <TouchableOpacity 
          style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]} 
          onPress={handleSend} 
          disabled={!input.trim() || loading}
        >
          <Text style={styles.sendBtnText}>➤</Text>
        </TouchableOpacity>
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
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  backBtn: {
    fontSize: 16,
    color: theme.primary,
    fontWeight: '600',
  },
  headerTitle: {
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.text,
  },
  subtitle: {
    fontSize: 12,
    color: theme.dimText,
  },
  clearBtn: {
    fontSize: 18,
  },
  modeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surface,
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  modeIcon: {
    fontSize: 20,
    marginRight: spacing.sm,
  },
  modeLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.primary,
    marginRight: spacing.sm,
  },
  modeDesc: {
    fontSize: 12,
    color: theme.dimText,
    flex: 1,
  },
  modeArrow: {
    fontSize: 12,
    color: theme.dimText,
  },
  modeDropdown: {
    backgroundColor: theme.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  modeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  modeOptionActive: {
    backgroundColor: theme.primary + '10',
  },
  modeOptionIcon: {
    fontSize: 20,
    marginRight: spacing.md,
  },
  modeOptionText: {
    flex: 1,
  },
  modeOptionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.text,
  },
  modeOptionDesc: {
    fontSize: 12,
    color: theme.dimText,
  },
  checkmark: {
    fontSize: 16,
    color: theme.primary,
    fontWeight: '700',
  },
  configNote: {
    backgroundColor: theme.warning + '20',
    padding: spacing.sm,
    alignItems: 'center',
  },
  configText: {
    fontSize: 11,
    color: theme.warning,
    textAlign: 'center',
  },
  chatList: {
    flex: 1,
  },
  chatContent: {
    padding: spacing.md,
  },
  message: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    maxWidth: '85%',
  },
  userMessage: {
    backgroundColor: theme.primary,
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  botMessage: {
    backgroundColor: theme.surface,
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 14,
    color: theme.text,
    lineHeight: 20,
  },
  loadingText: {
    fontSize: 12,
    color: theme.dimText,
    marginLeft: spacing.sm,
  },
  quickQuestions: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  quickChip: {
    backgroundColor: theme.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: theme.border,
  },
  quickText: {
    fontSize: 12,
    color: theme.text,
    maxWidth: 150,
  },
  inputRow: {
    flexDirection: 'row',
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.border,
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: theme.surface,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 14,
    color: theme.text,
    borderWidth: 1,
    borderColor: theme.border,
    maxHeight: 100,
  },
  sendBtn: {
    backgroundColor: theme.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    marginLeft: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.5,
  },
  sendBtnText: {
    fontSize: 18,
  },
});

import { StyleSheet } from 'react-native';