const fs = require('fs');
const path = require('path');
const https = require('https');

const GITHUB_RAW_URL = 'https://raw.githubusercontent.com/KarthikeyanS2006/adada/main/Longinsent_Archive/Adda247_SSC/2025/SSC_GD';

const SSC_GD_PDFS = [
  'SSC-GD-CONSTABLE-04-02-2025-Shift-I-Paper.pdf',
  'SSC-GD-CONSTABLE-04-02-2025-Shift-II-Paper.pdf',
  'SSC-GD-CONSTABLE-04-02-2025-Shift-III-Paper.pdf',
  'SSC-GD-CONSTABLE-05-02-2025-Shift-I-Paper.pdf',
  'SSC-GD-CONSTABLE-05-02-2025-Shift-II-Paper.pdf',
  'SSC-GD-CONSTABLE-05-02-2025-Shift-III-Paper.pdf',
  'SSC-GD-CONSTABLE-06-02-2025-Shift-I-Paper.pdf',
  'SSC-GD-CONSTABLE-06-02-2025-Shift-II-Paper-1.pdf',
  'SSC-GD-CONSTABLE-06-02-2025-Shift-III-Paper-1.pdf',
  'SSC-GD-CONSTABLE-07-02-2025-Shift-I-Paper-1.pdf',
  'SSC-GD-CONSTABLE-07-02-2025-Shift-II-Paper-1.pdf',
  'SSC-GD-CONSTABLE-07-02-2025-Shift-III-Paper-1.pdf',
  'SSC-GD-CONSTABLE-10-02-2025-Shift-I-Paper-1.pdf',
  'SSC-GD-CONSTABLE-10-02-2025-Shift-II-Paper-1.pdf',
  'SSC-GD-CONSTABLE-10-02-2025-Shift-III-Paper-1.pdf',
  'SSC-GD-CONSTABLE-11-02-2025-Shift-I-Paper-1.pdf',
  'SSC-GD-CONSTABLE-11-02-2025-Shift-II-Paper-1.pdf',
  'SSC-GD-CONSTABLE-11-02-2025-Shift-III-Paper-1.pdf',
  'SSC-GD-CONSTABLE-12-02-2025-Shift-I-Paper-1.pdf',
  'SSC-GD-CONSTABLE-12-02-2025-Shift-II-Paper-1.pdf',
  'SSC-GD-CONSTABLE-12-02-2025-Shift-III-Paper-1.pdf',
  'SSC-GD-CONSTABLE-13-02-2025-Shift-I-Paper-1.pdf',
  'SSC-GD-CONSTABLE-13-02-2025-Shift-II-Paper-1.pdf',
  'SSC-GD-CONSTABLE-13-02-2025-Shift-III-Paper-1.pdf',
  'SSC-GD-CONSTABLE-17-02-2025-Shift-I-Paper-1.pdf',
  'SSC-GD-Constable-4-2-2025-Morning-Shift-Paper.pdf',
  'SSC-GD-Constable-4-2-2025-Afternoon-Shift-Paper.pdf',
  'SSC-GD-Constable-4-2-2025-Evening-Shift-Paper.pdf',
  'SSC-GD-Constable-5-2-2025-Morning-Shift-Paper.pdf',
  'SSC-GD-Constable-5-2-2025-Afternoon-Shift-Paper.pdf',
  'SSC-GD-Constable-5-2-2025-Evening-Shift-Paper.pdf',
  'SSC-GD-Constable-6-2-2025-Morning-Shift-Paper.pdf',
  'SSC-GD-Constable-6-2-2025-Afternoon-Shift-Paper.pdf',
  'SSC-GD-Constable-6-2-2025-Evening-Shift-Paper.pdf',
  'SSC-GD-Constable-7-2-2025-Morning-Shift-Paper.pdf',
  'SSC-GD-Constable-7-2-2025-Afternoon-Shift-Paper.pdf',
  'SSC-GD-Constable-7-2-2025-Evening-Shift-Paper.pdf',
  'SSC-GD-Constable-10-2-2025-Morning-Shift-Paper.pdf',
  'SSC-GD-Constable-10-2-2025-Afternoon-Shift-Paper.pdf',
  'SSC-GD-Constable-10-2-2025-Evening-Shift-Paper.pdf',
  'SSC-GD-Constable-11-2-2025-Morning-Shift-Paper.pdf',
  'SSC-GD-Constable-11-2-2025-Afternoon-Shift-Paper.pdf',
  'SSC-GD-Constable-11-2-2025-Evening-Shift-Paper.pdf',
  'SSC-GD-Constable-12-2-2025-Morning-Shift-Paper.pdf',
  'SSC-GD-Constable-12-2-2025-Afternoon-Shift-Paper.pdf',
  'SSC-GD-Constable-12-2-2025-Evening-Shift-Paper.pdf',
  'SSC-GD-Constable-13-2-2025-Morning-Shift-Paper.pdf',
  'SSC-GD-Constable-13-2-2025-Afternoon-Shift-Paper.pdf',
  'SSC-GD-Constable-13-2-2025-Evening-Shift-Paper.pdf',
  'SSC-GD-Constable-17-2-2025-Morning-Shift-Paper-1.pdf'
];

const TEMP_DIR = path.join(__dirname, 'temp_pdfs');
const OUTPUT_DIR = path.join(__dirname, 'extracted_exams');

if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

function downloadFile(filename) {
  return new Promise((resolve, reject) => {
    const url = `${GITHUB_RAW_URL}/${filename}`;
    const filepath = path.join(TEMP_DIR, filename);
    
    const file = fs.createWriteStream(filepath);
    https.get(url, (response) => {
      if (response.statusCode === 302 && response.headers.location) {
        https.get(response.headers.location, (res) => {
          res.pipe(file);
          res.on('end', () => {
            file.end();
            resolve(filepath);
          });
        }).on('error', reject);
      } else {
        response.pipe(file);
        response.on('end', () => {
          file.end();
          resolve(filepath);
        });
      }
    }).on('error', reject);
  });
}

async function processAllPdfs() {
  console.log(`Total PDFs to process: ${SSC_GD_PDFS.length}`);
  
  for (let i = 0; i < SSC_GD_PDFS.length; i++) {
    const pdf = SSC_GD_PDFS[i];
    console.log(`[${i+1}/${SSC_GD_PDFS.length}] Downloading: ${pdf}`);
    
    try {
      const filepath = await downloadFile(pdf);
      console.log(`  Downloaded to: ${filepath}`);
      console.log(`  File size: ${fs.statSync(filepath).size} bytes`);
    } catch (err) {
      console.error(`  Error: ${err.message}`);
    }
  }
  
  console.log('\nDownload complete!');
}

processAllPdfs().catch(console.error);