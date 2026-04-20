const https = require('https');

const SUPABASE_URL = 'https://xqlxcgiqwhfztplktzoo.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxbHhjZ2lxd2hmenRwbGt0em9vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjA0NTE0MCwiZXhwIjoyMDkxNjIxMTQwfQ.aHAREhBeRsAz9mkOWoa6qj5tSK2r4CQhoiJKc13jdUI';

const files = [
  'DP-Constable-1-Dec-2020-S-1.json',
  'DP-Constable-1-Dec-2020-S-2.json',
  'DP-Constable-2-Dec-2020-S-1.json',
  'DP-Constable-2-Dec-2020-S-2.json',
  'DP-Constable-3-Dec-2020-S-1.json',
  'DP-Constable-3-Dec-2020-S-2.json',
  'DP-Constable-7-Dec-2020-S-1.json',
  'DP-Constable-7-Dec-2020-S-2.json',
  'DP-Constable-8-Dec-2020-S-1.json',
  'DP-Constable-8-Dec-2020-S-2.json',
  'DP-Constable-9-Dec-2020-S-1.json',
  'DP-Constable-9-Dec-2020-S-2.json',
  'DP-Constable-11-Dec-2020-S-2.json',
  'Delhi-Police-Constable-1-Dec-23-Shift-I-Paper.json',
  'Delhi-Police-Constable-1-Dec-23-Shift-II-Paper.json',
  'Delhi-Police-Constable-1-Dec-23-Shift-III-Paper.json',
  'Delhi-Police-Constable-2-Dec-23-Shift-I-Paper.json',
  'Delhi-Police-Constable-2-Dec-23-Shift-II-Paper.json',
  'Delhi-Police-Constable-2-Dec-23-Shift-III-Paper.json',
  'Delhi-Police-Constable-3-Dec-23-Shift-I-Paper.json',
  'Delhi-Police-Constable-3-Dec-23-Shift-II-Paper.json',
  'Delhi-Police-Constable-3-Dec-23-Shift-III-Paper.json',
  'Delhi-Police-Constable-7-Dec-2020-Shift-3-English.json',
  'Delhi-Police-Constable-8-December-2020-Shift-3-Hindi.json',
  'Delhi-Police-Constable-10-December-2020-Shift-1-English.json',
  'Delhi-Police-Constable-10-December-2020-Shift-3-Hindi.json',
  'Delhi-Police-Constable-15-Nov-23-Shift-I-Paper.json',
  'Delhi-Police-Constable-15-Nov-23-Shift-II-Paper.json',
  'Delhi-Police-Constable-15-Nov-23-Shift-III-Paper.json',
  'Delhi-Police-Constable-16-Nov-23-Shift-I-Paper.json',
  'Delhi-Police-Constable-16-Nov-23-Shift-II-Paper.json',
  'Delhi-Police-Constable-16-Nov-23-Shift-III-Paper.json',
  'Delhi-Police-Constable-17-Nov-23-Shift-I-Paper.json',
  'Delhi-Police-Constable-17-Nov-23-Shift-II-Paper.json',
  'Delhi-Police-Constable-17-Nov-23-Shift-III-Paper.json',
  'Delhi-Police-Constable-20-Nov-23-Shift-I-Paper.json',
  'Delhi-Police-Constable-20-Nov-23-Shift-II-Paper.json',
  'Delhi-Police-Constable-20-Nov-23-Shift-III-Paper.json',
  'Delhi-Police-Constable-21-Nov-23-Shift-I-Paper.json',
  'Delhi-Police-Constable-21-Nov-23-Shift-II-Paper.json',
  'Delhi-Police-Constable-21-Nov-23-Shift-III-Paper.json',
  'Delhi-Police-Constable-23-Nov-23-Shift-I-Paper.json',
  'Delhi-Police-Constable-23-Nov-23-Shift-II-Paper.json',
  'Delhi-Police-Constable-23-Nov-23-Shift-III-Paper.json',
  'Delhi-Police-Constable-24-Nov-23-Shift-I-Paper.json',
  'Delhi-Police-Constable-24-Nov-23-Shift-II-Paper.json',
  'Delhi-Police-Constable-24-Nov-23-Shift-III-Paper.json',
  'Delhi-Police-Constable-28-Nov-23-Shift-I-Paper.json',
  'Delhi-Police-Constable-28-Nov-23-Shift-II-Paper.json',
  'Delhi-Police-Constable-28-Nov-23-Shift-III-Paper.json',
  'Delhi-Police-Constable-29-Nov-23-Shift-I-Paper.json',
  'Delhi-Police-Constable-29-Nov-23-Shift-II-Paper.json',
  'Delhi-Police-Constable-29-Nov-23-Shift-III-Paper.json',
  'Delhi-Police-Constable-30-Nov-23-Shift-I-Paper.json',
  'Delhi-Police-Constable-30-Nov-23-Shift-II-Paper.json',
  'Delhi-Police-Constable-30-Nov-23-Shift-III-Paper.json',
  'Delhi-Police-Constable-Driver-Male-21-Oct-2022-Shift-1-English.json',
  'Delhi-Police-Constable-Driver-Male-21-Oct-2022-Shift-2-English.json',
  'Delhi-Police-Constable-Driver-Male-21-Oct-2022-Shift-3-English.json',
  'Delhi-Police-Constable-Exe.-Paper-Held-on-14-Nov-2023-S1.json',
  'Delhi-Police-Constable-Exe.-Paper-Held-on-14-Nov-2023-S2.json',
  'Delhi-Police-Constable-Exe.-Paper-Held-on-14-Nov-2023-S3.json',
  'Dehli-Police-Constable-8-Dec-2020-Shift-3-English.json',
  'EPFO-SSA-Previous-Year-Paper-2019.json',
  'RRB-Technician-syllabus.json',
];

const BASE_URL = 'https://raw.githubusercontent.com/KarthikeyanS2006/adada/main/json%20filees/';

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

function uploadToSupabase(examData) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(examData);
    
    const options = {
      hostname: 'xqlxcgiqwhfztplktzoo.supabase.co',
      path: '/rest/v1/exam_archive',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': 'Bearer ' + SUPABASE_KEY,
        'Prefer': 'return=representation'
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => responseData += chunk);
      res.on('end', () => {
        resolve({ status: res.statusCode, data: responseData });
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function parseExamName(filename) {
  const name = filename.replace('.json', '')
    .replace(/-/g, ' ')
    .replace(/Shift I/gi, 'Shift 1')
    .replace(/Shift II/gi, 'Shift 2')
    .replace(/Shift III/gi, 'Shift 3')
    .replace(/S (\d)/gi, 'Shift $1');

  const yearMatch = name.match(/(20\d{2})/);
  const year = yearMatch ? parseInt(yearMatch[1]) : 2023;

  let state = 'National';
  let category = 'General Studies';
  
  if (name.toLowerCase().includes('constable')) {
    category = 'Delhi Police Constable';
  } else if (name.toLowerCase().includes('rrb')) {
    category = 'Railway';
  } else if (name.toLowerCase().includes('epfo')) {
    category = 'EPFO';
  }

  return {
    exam_name: name,
    exam_year: year,
    state: state,
    subject_category: category
  };
}

function transformData(rawData, filename) {
  const parsed = parseExamName(filename);
  
  const questions = (rawData.archive_data || []).map((q, idx) => ({
    id: `q${idx + 1}`,
    subject: q.subject || parsed.subject_category,
    question_text: q.question_text,
    options: q.options,
    explanation: q.explanation || {}
  }));

  return {
    exam_name: parsed.exam_name,
    exam_year: parsed.exam_year,
    state: parsed.state,
    subject_category: parsed.subject_category,
    exam_data: {
      document_info: {
        exam_name: rawData.document_info?.exam_name || parsed.exam_name,
        exam_year: parsed.exam_year,
        state: parsed.state,
        total_questions: questions.length
      },
      questions: questions
    }
  };
}

async function processAllFiles() {
  console.log(`Starting upload of ${files.length} files to Supabase...\n`);
  
  let successCount = 0;
  let errorCount = 0;

  for (const file of files) {
    try {
      console.log(`Processing: ${file}`);
      const rawData = await fetchJSON(BASE_URL + encodeURIComponent(file));
      const examData = transformData(rawData, file);
      
      const result = await uploadToSupabase(examData);
      
      if (result.status === 201 || result.status === 200) {
        successCount++;
        console.log(`  ✓ Uploaded: ${examData.exam_name} (${examData.exam_year})\n`);
      } else {
        errorCount++;
        console.log(`  ✗ Error ${result.status}: ${result.data.substring(0, 100)}\n`);
      }
    } catch (error) {
      errorCount++;
      console.log(`  ✗ Error: ${error.message}\n`);
    }
  }

  console.log('\n========================================');
  console.log(`Upload Complete!`);
  console.log(`Success: ${successCount}`);
  console.log(`Errors: ${errorCount}`);
  console.log('========================================');
}

processAllFiles();
