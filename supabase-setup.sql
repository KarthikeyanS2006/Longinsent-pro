-- ================================================
-- LONGSENTPRO - SUPABASE DATABASE SETUP (COMPLETE)
-- Run this in your Supabase SQL Editor
-- ================================================

-- 1. Enable pg_trgm extension for fuzzy search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. Drop existing tables if they exist
DROP TABLE IF EXISTS exam_archive CASCADE;
DROP TABLE IF EXISTS user_downloads CASCADE;
DROP TABLE IF EXISTS chat_sessions CASCADE;
DROP TABLE IF EXISTS user_progress CASCADE;
DROP TABLE IF EXISTS flashcards CASCADE;
DROP TABLE IF EXISTS exam_plans CASCADE;
DROP TABLE IF EXISTS study_streaks CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS user_settings CASCADE;

-- ================================================
-- EXAM ARCHIVE TABLE
-- ================================================
CREATE TABLE exam_archive (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now(),
  exam_name text NOT NULL,
  exam_year integer,
  state text,
  subject_category text,
  exam_data jsonb NOT NULL
);

ALTER TABLE exam_archive ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read" ON exam_archive FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON exam_archive FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON exam_archive FOR UPDATE USING (true);
CREATE POLICY "Allow public delete" ON exam_archive FOR DELETE USING (true);

-- ================================================
-- USER DOWNLOADS TABLE
-- ================================================
CREATE TABLE user_downloads (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id text,
  exam_id uuid,
  downloaded_at timestamptz DEFAULT now()
);

ALTER TABLE user_downloads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public access" ON user_downloads FOR ALL USING (true);

-- ================================================
-- CHAT SESSIONS TABLE (For AI Tutor)
-- ================================================
CREATE TABLE chat_sessions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id text,
  subject_id integer,
  mode varchar(20) DEFAULT 'socratic',
  messages jsonb NOT NULL DEFAULT '[]',
  title varchar(255),
  token_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public access" ON chat_sessions FOR ALL USING (true);

CREATE INDEX idx_chat_sessions_user ON chat_sessions(user_id);

-- ================================================
-- USER PROGRESS TABLE
-- ================================================
CREATE TABLE user_progress (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id text NOT NULL,
  subject_id integer,
  topic_id integer,
  problems_attempted integer DEFAULT 0,
  problems_correct integer DEFAULT 0,
  time_spent_seconds integer DEFAULT 0,
  mastery_level decimal(5,2) DEFAULT 0,
  weak_areas jsonb DEFAULT '[]',
  last_activity timestamptz DEFAULT now(),
  UNIQUE(user_id, subject_id, topic_id)
);

ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public access" ON user_progress FOR ALL USING (true);

CREATE INDEX idx_progress_user ON user_progress(user_id);

-- ================================================
-- FLASHCARDS TABLE
-- ================================================
CREATE TABLE flashcards (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id text NOT NULL,
  subject_id integer,
  topic_id integer,
  front_text text NOT NULL,
  back_text text NOT NULL,
  image_url text,
  ease_factor decimal(5,2) DEFAULT 2.5,
  interval_days integer DEFAULT 1,
  next_review timestamptz DEFAULT now(),
  review_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public access" ON flashcards FOR ALL USING (true);

CREATE INDEX idx_flashcards_user ON flashcards(user_id, next_review);

-- ================================================
-- EXAM PLANS TABLE
-- ================================================
CREATE TABLE exam_plans (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id text NOT NULL,
  exam_name varchar(255) NOT NULL,
  exam_date timestamptz NOT NULL,
  topics jsonb NOT NULL,
  progress_percentage integer DEFAULT 0,
  status varchar(20) DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE exam_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public access" ON exam_plans FOR ALL USING (true);

CREATE INDEX idx_exam_plans_user ON exam_plans(user_id);

-- ================================================
-- STUDY STREAKS TABLE
-- ================================================
CREATE TABLE study_streaks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id text NOT NULL UNIQUE,
  current_streak integer DEFAULT 0,
  longest_streak integer DEFAULT 0,
  last_study_date date,
  total_study_days integer DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE study_streaks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public access" ON study_streaks FOR ALL USING (true);

-- ================================================
-- USER SETTINGS TABLE
-- ================================================
CREATE TABLE user_settings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id text NOT NULL UNIQUE,
  ai_mode varchar(20) DEFAULT 'socratic',
  grade_level varchar(50),
  curriculum varchar(50) DEFAULT 'common_core',
  notifications_enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public access" ON user_settings FOR ALL USING (true);

-- ================================================
-- SUBJECTS TABLE
-- ================================================
CREATE TABLE subjects (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  icon_url text,
  color VARCHAR(20),
  parent_id INTEGER REFERENCES subjects(id),
  description TEXT,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read" ON subjects FOR SELECT USING (true);

INSERT INTO subjects (name, slug, color, description) VALUES
('History', 'history', '#dc2626', 'Indian History, World History'),
('Geography', 'geography', '#2563eb', 'Indian Geography, World Geography'),
('Science', 'science', '#16a34a', 'Physics, Chemistry, Biology'),
('Mathematics', 'mathematics', '#9333ea', 'Arithmetic, Algebra, Geometry'),
('Tamil', 'tamil', '#ea580c', 'Tamil Language and Literature'),
('English', 'english', '#0891b2', 'English Language and Grammar'),
('Current Affairs', 'current-affairs', '#be185d', 'National and International News'),
('Polity', 'polity', '#4f46e5', 'Indian Constitution and Governance'),
('Economics', 'economics', '#059669', 'Indian Economy'),
('Logic', 'logic', '#7c3aed', 'Logical Reasoning and Aptitude');

-- ================================================
-- TOPICS TABLE
-- ================================================
CREATE TABLE topics (
  id SERIAL PRIMARY KEY,
  subject_id INTEGER REFERENCES subjects(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  description TEXT,
  difficulty VARCHAR(20) CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  curriculum VARCHAR(50),
  order_index INTEGER DEFAULT 0,
  created_at timestamptz DEFAULT NOW()
);

ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read" ON topics FOR SELECT USING (true);

-- Insert sample topics
INSERT INTO topics (subject_id, name, slug, description, difficulty) VALUES
(1, 'Ancient India', 'ancient-india', 'Indus Valley, Vedic Period, Mahajanapadas', 'beginner'),
(1, 'Medieval India', 'medieval-india', 'Delhi Sultanate, Mughal Empire, Vijayanagara', 'intermediate'),
(1, 'Modern India', 'modern-india', 'British Rule, Independence Movement', 'intermediate'),
(2, 'Indian Geography', 'indian-geography', 'Physical features, Rivers, Climate', 'beginner'),
(2, 'World Geography', 'world-geography', 'Continents, Oceans, Climate', 'intermediate'),
(3, 'Physics', 'physics', 'Mechanics, Thermodynamics, Waves', 'intermediate'),
(3, 'Chemistry', 'chemistry', 'Organic, Inorganic, Physical', 'intermediate'),
(3, 'Biology', 'biology', 'Botany, Zoology, Human Anatomy', 'beginner'),
(4, 'Arithmetic', 'arithmetic', 'Number System, Percentages, Ratios', 'beginner'),
(4, 'Algebra', 'algebra', 'Equations, Inequalities, Polynomials', 'intermediate'),
(8, 'Indian Constitution', 'indian-constitution', 'Fundamental Rights, Directive Principles', 'intermediate'),
(8, 'Governance', 'governance', 'Panchayati Raj, Federal Structure', 'intermediate'),
(7, 'National News', 'national-news', 'Important national events', 'beginner'),
(7, 'International News', 'international-news', 'Important international events', 'beginner');

-- ================================================
-- PROBLEMS / QUESTIONS BANK TABLE
-- ================================================
CREATE TABLE problems (
  id SERIAL PRIMARY KEY,
  subject_id INTEGER REFERENCES subjects(id) ON DELETE CASCADE,
  topic_id INTEGER REFERENCES topics(id) ON DELETE SET NULL,
  question_text TEXT NOT NULL,
  question_image_url TEXT,
  solution_steps JSONB NOT NULL,
  final_answer TEXT,
  difficulty VARCHAR(20) CHECK (difficulty IN ('easy', 'medium', 'hard')),
  curriculum VARCHAR(50),
  grade_level VARCHAR(50),
  is_published BOOLEAN DEFAULT FALSE,
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
);

ALTER TABLE problems ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read" ON problems FOR SELECT USING (true);

CREATE INDEX idx_problems_subject ON problems(subject_id);
CREATE INDEX idx_problems_topic ON problems(topic_id);

-- ================================================
-- INDEXES FOR PERFORMANCE
-- ================================================
CREATE INDEX idx_exam_archive_name_trgm ON exam_archive USING gin (exam_name gin_trgm_ops);
CREATE INDEX idx_exam_archive_year ON exam_archive (exam_year DESC);

-- ================================================
-- SAMPLE EXAM DATA
-- ================================================
INSERT INTO exam_archive (exam_name, exam_year, state, subject_category, exam_data) VALUES
(
  'TNPSC Group 4',
  2024,
  'Tamil Nadu',
  'General Studies',
  '{
    "document_info": {
      "exam_name": "TNPSC Group 4 Combined Civil Services Examination",
      "exam_year": 2024,
      "state": "Tamil Nadu",
      "total_questions": 5,
      "duration": "150 minutes"
    },
    "questions": [
      {
        "id": "q001",
        "subject": "History",
        "question_text": "Who was the founder of the Chola dynasty?",
        "options": [
          { "id": "a", "text": "Rajaraja I", "is_correct": false },
          { "id": "b", "text": "Vijayanagara rulers", "is_correct": false },
          { "id": "c", "text": "Karikalan", "is_correct": true },
          { "id": "d", "text": "Rajendra Chola I", "is_correct": false }
        ],
        "explanation": {
          "english": "Karikalan was the founder of the Chola dynasty. He is known for building the Kallanai (Grand Anicut), one of the oldest water diversion structures in the world.",
          "tanglish": "Karikalan Chola dynasty-oda founder ah iruppan. Avan Kallanai build pannina.",
          "topic": "Ancient History - Chola Dynasty"
        }
      },
      {
        "id": "q002",
        "subject": "Geography",
        "question_text": "Which is the largest river in Tamil Nadu?",
        "options": [
          { "id": "a", "text": "Cauvery", "is_correct": true },
          { "id": "b", "text": "Tamirabarani", "is_correct": false },
          { "id": "c", "text": "Palar", "is_correct": false },
          { "id": "d", "text": "Vaigai", "is_correct": false }
        ],
        "explanation": {
          "english": "The Cauvery River is the largest river in Tamil Nadu, originating from the Western Ghats.",
          "tanglish": "Cauvery River Tamil Nadu-oda largest river.",
          "topic": "Geography of Tamil Nadu - Rivers"
        }
      },
      {
        "id": "q003",
        "subject": "Polity",
        "question_text": "The Governor of Tamil Nadu is appointed by whom?",
        "options": [
          { "id": "a", "text": "President of India", "is_correct": true },
          { "id": "b", "text": "Prime Minister", "is_correct": false },
          { "id": "c", "text": "Chief Minister", "is_correct": false },
          { "id": "d", "text": "Chief Justice", "is_correct": false }
        ],
        "explanation": {
          "english": "The Governor of a state is appointed by the President of India under Article 153 of the Indian Constitution.",
          "tanglish": "State Governor-o President of India appoint pannuvangaar.",
          "topic": "Indian Polity - State Government"
        }
      },
      {
        "id": "q004",
        "subject": "Science",
        "question_text": "What is the chemical formula of water?",
        "options": [
          { "id": "a", "text": "CO2", "is_correct": false },
          { "id": "b", "text": "H2O", "is_correct": true },
          { "id": "c", "text": "NaCl", "is_correct": false },
          { "id": "d", "text": "O2", "is_correct": false }
        ],
        "explanation": {
          "english": "Water is composed of two hydrogen atoms and one oxygen atom, giving it the chemical formula H2O.",
          "tanglish": "Water-e two hydrogen atoms and one oxygen atom combine panni irukku.",
          "topic": "Chemistry - Basic Compounds"
        }
      },
      {
        "id": "q005",
        "subject": "History",
        "question_text": "In which year did India gain independence?",
        "options": [
          { "id": "a", "text": "1945", "is_correct": false },
          { "id": "b", "text": "1946", "is_correct": false },
          { "id": "c", "text": "1947", "is_correct": true },
          { "id": "d", "text": "1950", "is_correct": false }
        ],
        "explanation": {
          "english": "India gained independence from British rule on August 15, 1947.",
          "tanglish": "India British rule-ku v Independence August 15, 1947-ku kidaikkachu.",
          "topic": "Indian Independence Movement"
        }
      }
    ]
  }'::jsonb
);

-- Verify setup
SELECT 'Tables created successfully!' as status;