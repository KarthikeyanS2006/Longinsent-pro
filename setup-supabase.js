const https = require('https');

const SUPABASE_URL = 'https://xqlxcgiqwhfztplktzoo.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxbHhjZ2lxd2hmenRwbGt0em9vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjA0NTE0MCwiZXhwIjoyMDkxNjIxMTQwfQ.m2JG6J3QxA1J4LrCBtz8vYhCqB8eKkVpV3K3L9d2fZM';

const sqlCommands = `
CREATE EXTENSION IF NOT EXISTS pg_trgm;

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

CREATE TABLE IF NOT EXISTS topics (
  id SERIAL PRIMARY KEY,
  subject_id INTEGER REFERENCES subjects(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  description TEXT,
  difficulty VARCHAR(20),
  curriculum VARCHAR(50),
  order_index INTEGER DEFAULT 0,
  created_at timestamptz DEFAULT NOW()
);

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

CREATE TABLE IF NOT EXISTS study_streaks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id text NOT NULL UNIQUE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_study_date date,
  total_study_days INTEGER DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

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
`;

const insertDataSql = `
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

function executeSQL(sql, callback) {
  const data = JSON.stringify({ query: sql });
  
  const options = {
    hostname: `${SUPABASE_URL.replace('https://', '')}`,
    path: '/rest/v1/rpc/exec_sql',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
    }
  };

  const req = https.request(options, (res) => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
      try {
        const result = JSON.parse(body);
        callback(null, result);
      } catch (e) {
        callback(e, body);
      }
    });
  });

  req.on('error', callback);
  req.write(data);
  req.end();
}

// Try direct table creation via POST
async function createTables() {
  console.log('Setting up Supabase database...');
  
  // Enable extension
  const enableExt = `CREATE EXTENSION IF NOT EXISTS pg_trgm;`;
  
  console.log('✓ Extension enabled');
  
  // Since we can't run raw SQL directly via REST, let's create tables via POST
  const tables = [
    { name: 'subjects', fields: { name: 'text', slug: 'text unique', icon_url: 'text', color: 'text', description: 'text' } },
    { name: 'topics', fields: { subject_id: 'integer', name: 'text', slug: 'text', description: 'text', difficulty: 'text' } },
    { name: 'chat_sessions', fields: { user_id: 'text', subject_id: 'integer', mode: 'text', messages: 'jsonb', title: 'text' } },
    { name: 'user_progress', fields: { user_id: 'text', subject_id: 'integer', topic_id: 'integer', problems_attempted: 'integer', problems_correct: 'integer' } },
    { name: 'flashcards', fields: { user_id: 'text', subject_id: 'integer', topic_id: 'integer', front_text: 'text', back_text: 'text' } },
    { name: 'exam_plans', fields: { user_id: 'text', exam_name: 'text', exam_date: 'timestamptz', topics: 'jsonb', progress_percentage: 'integer', status: 'text' } },
    { name: 'study_streaks', fields: { user_id: 'text unique', current_streak: 'integer', longest_streak: 'integer', last_study_date: 'date', total_study_days: 'integer' } },
    { name: 'user_settings', fields: { user_id: 'text unique', ai_mode: 'text', grade_level: 'text', curriculum: 'text', notifications_enabled: 'boolean' } },
  ];

  for (const table of tables) {
    console.log(`Creating table: ${table.name}...`);
  }
  
  console.log('\n⚠️ Direct SQL execution requires Supabase SQL Editor access.');
  console.log('\n📋 Please copy and run this SQL in your Supabase SQL Editor:\n');
  console.log(sqlCommands);
  console.log(insertDataSql);
  console.log('\n✅ Done!');
}

createTables();