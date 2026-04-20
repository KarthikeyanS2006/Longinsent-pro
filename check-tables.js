const https = require('https');

const SUPABASE_URL = 'https://xqlxcgiqwhfztplktzoo.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxbHhjZ2lxd2hmenRwbGt0em9vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwNDUxNDAsImV4cCI6MjA5MTYyMTE0MH0.B29H1Eye6XnjEeU3y6JmjJEER7appLoWSKSuphhJ_dc';

function fetchAPI(path) {
  return new Promise((resolve, reject) => {
    const url = `${SUPABASE_URL}${path}`;
    const req = https.get(url, {
      headers: {
        'apikey': ANON_KEY,
        'Authorization': `Bearer ${ANON_KEY}`
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data);
        }
      });
    });
    req.on('error', reject);
  });
}

async function checkTables() {
  console.log('🔍 Checking existing tables...\n');
  
  const tables = ['exam_archive', 'subjects', 'topics', 'chat_sessions', 'user_progress'];
  
  for (const table of tables) {
    try {
      const result = await fetchAPI(`/rest/v1/${table}?select=count`);
      if (Array.isArray(result)) {
        console.log(`✓ ${table} exists`);
      } else {
        console.log(`✗ ${table} does not exist`);
      }
    } catch (e) {
      console.log(`✗ ${table} error: ${e.message}`);
    }
  }
}

checkTables();