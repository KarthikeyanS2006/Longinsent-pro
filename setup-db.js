const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xqlxcgiqwhfztplktzoo.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxbHhjZ2lxd2hmenRwbGt0em9vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwNDUxNDAsImV4cCI6MjA5MTYyMTE0MH0.B29H1Eye6XnjEeU3y6JmjJEER7appLoWSKSuphhJ_dc';

const supabase = createClient(supabaseUrl, serviceKey);

const subjectsData = [
  { name: 'History', slug: 'history', color: '#dc2626', description: 'Indian History, World History' },
  { name: 'Geography', slug: 'geography', color: '#2563eb', description: 'Indian Geography, World Geography' },
  { name: 'Science', slug: 'science', color: '#16a34a', description: 'Physics, Chemistry, Biology' },
  { name: 'Mathematics', slug: 'mathematics', color: '#9333ea', description: 'Arithmetic, Algebra, Geometry' },
  { name: 'Tamil', slug: 'tamil', color: '#ea580c', description: 'Tamil Language and Literature' },
  { name: 'English', slug: 'english', color: '#0891b2', description: 'English Language and Grammar' },
  { name: 'Current Affairs', slug: 'current-affairs', color: '#be185d', description: 'National and International News' },
  { name: 'Polity', slug: 'polity', color: '#4f46e5', description: 'Indian Constitution and Governance' },
  { name: 'Economics', slug: 'economics', color: '#059669', description: 'Indian Economy' },
  { name: 'Logic', slug: 'logic', color: '#7c3aed', description: 'Logical Reasoning and Aptitude' },
];

const topicsData = [
  { subject_id: 1, name: 'Ancient India', slug: 'ancient-india', description: 'Indus Valley, Vedic Period, Mahajanapadas', difficulty: 'beginner' },
  { subject_id: 1, name: 'Medieval India', slug: 'medieval-india', description: 'Delhi Sultanate, Mughal Empire, Vijayanagara', difficulty: 'intermediate' },
  { subject_id: 1, name: 'Modern India', slug: 'modern-india', description: 'British Rule, Independence Movement', difficulty: 'intermediate' },
  { subject_id: 2, name: 'Indian Geography', slug: 'indian-geography', description: 'Physical features, Rivers, Climate', difficulty: 'beginner' },
  { subject_id: 2, name: 'World Geography', slug: 'world-geography', description: 'Continents, Oceans, Climate', difficulty: 'intermediate' },
  { subject_id: 3, name: 'Physics', slug: 'physics', description: 'Mechanics, Thermodynamics, Waves', difficulty: 'intermediate' },
  { subject_id: 3, name: 'Chemistry', slug: 'chemistry', description: 'Organic, Inorganic, Physical', difficulty: 'intermediate' },
  { subject_id: 3, name: 'Biology', slug: 'biology', description: 'Botany, Zoology, Human Anatomy', difficulty: 'beginner' },
  { subject_id: 4, name: 'Arithmetic', slug: 'arithmetic', description: 'Number System, Percentages, Ratios', difficulty: 'beginner' },
  { subject_id: 4, name: 'Algebra', slug: 'algebra', description: 'Equations, Inequalities, Polynomials', difficulty: 'intermediate' },
  { subject_id: 8, name: 'Indian Constitution', slug: 'indian-constitution', description: 'Fundamental Rights, Directive Principles', difficulty: 'intermediate' },
  { subject_id: 8, name: 'Governance', slug: 'governance', description: 'Panchayati Raj, Federal Structure', difficulty: 'intermediate' },
  { subject_id: 7, name: 'National News', slug: 'national-news', description: 'Important national events', difficulty: 'beginner' },
  { subject_id: 7, name: 'International News', slug: 'international-news', description: 'Important international events', difficulty: 'beginner' },
];

async function setupDatabase() {
  console.log('🗄️  Setting up Supabase database...\n');
  
  // Check if subjects exist
  const { data: existingSubjects, error: checkError } = await supabase
    .from('subjects')
    .select('slug');
  
  if (checkError) {
    console.log('⚠️  Tables do not exist or no access.');
    console.log('Error:', checkError.message);
    return;
  }
  
  if (existingSubjects && existingSubjects.length > 0) {
    console.log(`✓ Found ${existingSubjects.length} existing subjects.`);
  }
  
  // Insert subjects
  for (const subject of subjectsData) {
    const { error } = await supabase
      .from('subjects')
      .upsert(subject, { onConflict: 'slug', ignoreDuplicates: true });
    
    if (error && !error.message.includes('duplicate')) {
      console.error(`Error inserting ${subject.name}:`, error.message);
    }
  }
  console.log(`✓ Inserted ${subjectsData.length} subjects`);
  
  // Get subject IDs
  const { data: subjects } = await supabase.from('subjects').select('id, slug');
  const subjectMap = {};
  subjects?.forEach(s => subjectMap[s.slug] = s.id);
  
  // Insert topics with correct subject IDs
  for (const topic of topicsData) {
    const adjustedTopic = { ...topic, subject_id: subjectMap[topic.subject_id] || topic.subject_id };
    const { error } = await supabase
      .from('topics')
      .upsert(adjustedTopic, { onConflict: 'slug', ignoreDuplicates: true });
    
    if (error && !error.message.includes('duplicate')) {
      console.error(`Error inserting ${topic.name}:`, error.message);
    }
  }
  console.log(`✓ Inserted ${topicsData.length} topics`);
  
  console.log('\n✅ Database setup complete!');
}

setupDatabase().catch(console.error);