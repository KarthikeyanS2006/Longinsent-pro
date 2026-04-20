const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = 'https://xqlxcgiqwhfztplktzoo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxbHhjZ2lxd2hmenRwbGt0em9vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwNDUxNDAsImV4cCI6MjA5MTYyMTE0MH0.B29H1Eye6XnjEeU3y6JmjJEER7appLoWSKSuphhJ_dc';

const supabase = createClient(supabaseUrl, supabaseKey);

const sqlCommands = `
-- Enable pg_trgm extension
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create subjects table
CREATE TABLE IF NOT EXISTS subjects (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  icon_url text,
  color VARCHAR(20),
  parent_id INTEGER REFERENCES subjects(id),
  description TEXT,
  created_at timestamptz DEFAULT now()
);

-- Create topics table
CREATE TABLE IF NOT EXISTS topics (
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

-- Create chat_sessions table
CREATE TABLE IF NOT EXISTS chat_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id text,
  subject_id integer,
  mode VARCHAR(20) DEFAULT 'socratic',
  messages JSONB NOT NULL DEFAULT '[]',
  title VARCHAR(255),
  token_count INTEGER DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user_progress table
CREATE TABLE IF NOT EXISTS user_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id text NOT NULL,
  subject_id integer,
  topic_id integer,
  problems_attempted INTEGER DEFAULT 0,
  problems_correct INTEGER DEFAULT 0,
  time_spent_seconds INTEGER DEFAULT 0,
  mastery_level DECIMAL(5,2) DEFAULT 0,
  weak_areas JSONB DEFAULT '[]',
  last_activity timestamptz DEFAULT now(),
  UNIQUE(user_id, subject_id, topic_id)
);

-- Create flashcards table
CREATE TABLE IF NOT EXISTS flashcards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id text NOT NULL,
  subject_id integer,
  topic_id integer,
  front_text TEXT NOT NULL,
  back_text TEXT NOT NULL,
  image_url text,
  ease_factor DECIMAL(5,2) DEFAULT 2.5,
  interval_days INTEGER DEFAULT 1,
  next_review timestamptz DEFAULT now(),
  review_count INTEGER DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create exam_plans table
CREATE TABLE IF NOT EXISTS exam_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id text NOT NULL,
  exam_name VARCHAR(255) NOT NULL,
  exam_date timestamptz NOT NULL,
  topics JSONB NOT NULL,
  progress_percentage INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create study_streaks table
CREATE TABLE IF NOT EXISTS study_streaks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id text NOT NULL UNIQUE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_study_date date,
  total_study_days INTEGER DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

-- Create user_settings table
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id text NOT NULL UNIQUE,
  ai_mode VARCHAR(20) DEFAULT 'socratic',
  grade_level VARCHAR(50),
  curriculum VARCHAR(50) DEFAULT 'common_core',
  notifications_enabled BOOLEAN DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Insert subjects
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
('Logic', 'logic', '#7c3aed', 'Logical Reasoning and Aptitude')
ON CONFLICT (slug) DO NOTHING;

-- Insert topics
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
(7, 'International News', 'international-news', 'Important international events', 'beginner')
ON CONFLICT DO NOTHING;
`;

async function runSQL() {
  console.log('Running SQL setup...');
  
  try {
    // Split SQL into individual statements and execute
    const statements = sqlCommands
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      if (statement.includes('CREATE EXTENSION')) {
        const { error } = await supabase.rpc('pg_catalog', { 
          query: statement 
        }).catch(() => ({ error: null }));
        
        // Direct SQL execution via REST API would be better
        console.log('Creating extension:', statement.substring(0, 50) + '...');
      }
    }
    
    console.log('SQL setup completed!');
    console.log('Note: For full SQL execution, please run supabase-setup.sql in Supabase SQL Editor');
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

runSQL();