import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://xqlxcgiqwhfztplktzoo.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxbHhjZ2lxd2hmenRwbGt0em9vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwNDUxNDAsImV4cCI6MjA5MTYyMTE0MH0.B29H1Eye6XnjEeU3y6JmjJEER7appLoWSKSuphhJ_dc';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export async function fetchExams() {
  const { data, error } = await supabase
    .from('exam_archive')
    .select('id, exam_name, exam_year, state, subject_category, created_at')
    .order('exam_year', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function fetchExamById(id) {
  const { data, error } = await supabase
    .from('exam_archive')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function searchExams(query) {
  const { data, error } = await supabase
    .from('exam_archive')
    .select('id, exam_name, exam_year, state, subject_category')
    .ilike('exam_name', `%${query}%`);

  if (error) throw error;
  return data || [];
}

export async function fetchExamsByCategory(category) {
  if (!category) {
    const { data, error } = await supabase
      .from('exam_archive')
      .select('id, exam_name, exam_year, state, subject_category, created_at')
      .order('exam_year', { ascending: false });

    if (error) throw error;
    return data || [];
  }
  
  const { data, error } = await supabase
    .from('exam_archive')
    .select('id, exam_name, exam_year, state, subject_category, created_at')
    .ilike('subject_category', `%${category}%`)
    .order('exam_year', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function uploadExam(examData) {
  const { data, error } = await supabase
    .from('exam_archive')
    .insert([examData])
    .select()
    .single();

  if (error) throw error;
  return data;
}
