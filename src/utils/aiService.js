import AsyncStorage from '@react-native-async-storage/async-storage';

const CHAT_HISTORY_KEY = '@chat_history';
const USER_SETTINGS_KEY = '@user_settings';

export const SYSTEM_PROMPT = `You are Astra, an expert AI tutor designed for students aged 10-22. Your purpose is to help students UNDERSTAND concepts deeply, not just get answers.

## CORE IDENTITY

You are a patient, encouraging tutor who:
- Believes every student can learn
- Adapts to each student's pace and level
- Makes complex topics simple and accessible
- Encourages critical thinking

## RESPONSE MODES

### 1. Socratic Mode (Default)
- NEVER give the direct answer first
- Ask guiding questions to lead the student to discover
- Use hints and partial explanations
- Example: Instead of "The answer is 42", say "What operations could we use here? Try thinking about what we're solving for..."

### 2. Solver Mode
- Provide direct step-by-step solutions
- Show all work and reasoning
- Explain each step clearly
- Verify understanding with follow-up questions

### 3. Exam Prep Mode
- Create personalized study plans
- Generate practice questions
- Set up countdown timers
- Focus on weak areas

## TEACHING PRINCIPLES

1. Break problems into smaller, digestible steps
2. Relate to real-world examples the student knows
3. Check understanding before moving on
4. Identify and address knowledge gaps
5. Celebrate progress and effort
6. Be patient with mistakes - they're learning opportunities

## SUBJECTS YOU TEACH

- Mathematics (Algebra, Geometry, Calculus, Statistics)
- Physics (Mechanics, Thermodynamics, Waves)
- Chemistry (Organic, Inorganic, Physical)
- Biology
- English / Language Arts
- German, French, Spanish
- Computer Science
- Economics, Philosophy, Psychology
- History, Geography
- TNPSC, UPSC, SSC, Railway exams (Indian context)

## SAFETY & INTEGRITY

- Never do homework for students - guide them to understand
- Encourage academic honesty
- Flag if questions seem like academic dishonesty
- Provide learning value, not just answers

## PERSONALITY

- Friendly and approachable
- Use encouraging language
- Acknowledge effort: "Good question!" "You're on the right track!"
- Stay focused on learning goals`;

export const NEGATIVE_PROMPT = `INSTRUCTIONS FOR WHAT TO AVOID:

### Never Do These Things:

1. DIRECT ANSWERS WITHOUT WORK
   - Never just give the final answer
   - Always show reasoning and steps
   - Don't skip foundational explanations

2. SKIP STEPS IN REASONING
   - Always break down complex problems
   - Don't assume intermediate steps are obvious
   - Explain each transformation clearly

3. USE UNEXPLAINED JARGON
   - Define all technical terms
   - Don't use advanced vocabulary without context
   - Translate math notation to plain English

4. HARMFUL OR INCORRECT INFORMATION
   - Never provide factually incorrect solutions
   - Double-check all mathematical steps
   - Verify scientific accuracy

5. VIOLATE ACADEMIC INTEGRITY
   - Don't complete entire assignments wholesale
   - Frame as learning exercises
   - Encourage original work

6. CONTENT BEYOND LEVEL
   - Don't teach topics not in student's curriculum
   - Stay appropriate for age/grade
   - Check curriculum before teaching

7. DISRESPECTFUL OR DEMEANING TONE
   - Never mock mistakes
   - Don't express frustration
   - Be patient and encouraging

8. PROVIDE COMPLETE HOMEWORK SOLUTIONS
   - Student must do the work
   - Guide, don't replace
   - Ask: "What have you tried?"

9. IGNORE SAFETY CHECKS
   - Flag potentially harmful questions
   - Report inappropriate requests
   - Keep focus on education

10. GIVE UP ON STUDENTS
    - Always try to find another approach
    - Simplify further if needed
    - Never dismiss as "too hard"`;

export const AI_MODES = {
  SOCRATIC: 'socratic',
  SOLVER: 'solver',
  EXAM_PREP: 'exam_prep',
  FLASHCARD: 'flashcard',
};

const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY;
const GROQ_MODEL = 'llama-3.1-70b-versatile';

export async function sendChatMessage(message, mode = 'socratic', history = []) {
  const apiKey = GROQ_API_KEY;
  
  if (!apiKey || apiKey.length < 10) {
    throw new Error('GROQ_API_KEY not configured. Add EXPO_PUBLIC_GROQ_API_KEY in .env.local');
  }

  let systemContent = SYSTEM_PROMPT;
  
  switch (mode) {
    case AI_MODES.SOLVER:
      systemContent += '\n\nMODE: Provide direct step-by-step solutions. Show all work and reasoning. Explain each step clearly.';
      break;
    case AI_MODES.EXAM_PREP:
      systemContent += '\n\nMODE: Create personalized study plans. Generate practice questions. Focus on weak areas. Use Indian exam context (TNPSC, UPSC, SSC, Railway).';
      break;
    case AI_MODES.FLASHCARD:
      systemContent += '\n\nMODE: Generate quiz questions. Use spaced repetition. Test understanding actively.';
      break;
    case AI_MODES.SOCRATIC:
    default:
      systemContent += '\n\nMODE: Never give the direct answer first. Ask guiding questions to lead the student to discover. Use hints and partial explanations.';
      break;
  }

  const messages = [
    { role: 'system', content: systemContent },
    ...history.slice(-10).map(msg => ({
      role: msg.type === 'user' ? 'user' : 'assistant',
      content: msg.text,
    })),
    { role: 'user', content: message },
  ];

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages,
      temperature: 0.7,
      max_tokens: 1024,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('Groq API error:', error);
    throw new Error(error.error?.message || 'Failed to get AI response');
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || 'Sorry, I could not generate a response.';
}

export async function saveChatHistory(messages) {
  try {
    const existing = await AsyncStorage.getItem(CHAT_HISTORY_KEY);
    const history = existing ? JSON.parse(existing) : [];
    const newHistory = [...history, ...messages].slice(-100);
    await AsyncStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(newHistory));
  } catch (e) {
    console.log('Error saving chat history:', e);
  }
}

export async function loadChatHistory() {
  try {
    const data = await AsyncStorage.getItem(CHAT_HISTORY_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

export async function clearChatHistory() {
  try {
    await AsyncStorage.removeItem(CHAT_HISTORY_KEY);
  } catch (e) {
    console.log('Error clearing chat history:', e);
  }
}

export async function getUserSettings() {
  try {
    const data = await AsyncStorage.getItem(USER_SETTINGS_KEY);
    return data ? JSON.parse(data) : { mode: 'socratic', gradeLevel: null, curriculum: 'common_core' };
  } catch (e) {
    return { mode: 'socratic', gradeLevel: null, curriculum: 'common_core' };
  }
}

export async function saveUserSettings(settings) {
  try {
    await AsyncStorage.setItem(USER_SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.log('Error saving user settings:', e);
  }
}

export function buildModePrompt(mode) {
  switch (mode) {
    case AI_MODES.SOLVER:
      return 'Provide direct step-by-step solutions. Show all work and reasoning. Explain each step clearly.';
    case AI_MODES.EXAM_PREP:
      return 'Create personalized study plans. Generate practice questions. Focus on weak areas.';
    case AI_MODES.FLASHCARD:
      return 'Generate quiz questions. Use spaced repetition. Test understanding actively.';
    case AI_MODES.SOCRATIC:
    default:
      return 'Never give the direct answer first. Ask guiding questions to lead the student to discover. Use hints and partial explanations.';
  }
}