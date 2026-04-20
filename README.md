# LonginsentPro

AI-Powered Offline Exam Prep App for Indian Government Exams (TNPSC, UPSC, SSC)

## Features

- 📚 **Exam Archive** - Access 15+ years of TNPSC, UPSC, SSC papers
- 🤖 **AI Explanations** - Get Tanglish (Tamil + English) explanations
- 📥 **Offline Mode** - Download exams for offline study
- 📊 **Progress Tracking** - Track your quiz scores and performance
- 🔍 **Smart Search** - Find exams by name, year, or state

## Quick Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Supabase Database

Go to your Supabase SQL Editor and run the contents of `supabase-setup.sql`

### 3. Run the App
```bash
npx expo start
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Mobile | React Native (Expo) |
| Database | Supabase |
| AI | Google Gemini (via AI Studio) |
| Offline | expo-file-system |

## Project Structure

```
LonginsentPro/
├── App.js                    # Main app with navigation
├── src/
│   ├── screens/
│   │   ├── HomeScreen.js     # Exam list with search/filter
│   │   ├── QuizScreen.js     # Quiz with questions
│   │   └── DownloadsScreen.js # Offline downloads
│   ├── components/
│   │   ├── ExamCard.js       # Exam list item
│   │   ├── QuestionCard.js   # Question with options
│   │   └── SearchBar.js      # Search component
│   ├── utils/
│   │   ├── supabase.js       # Supabase client
│   │   └── storage.js        # Offline storage helpers
│   ├── styles/
│   │   ├── theme.js          # Colors, spacing
│   │   └── globalStyles.js   # Global styles
│   └── data/
│       └── sampleExams.json  # Sample data
├── supabase-setup.sql        # Database setup script
└── README.md
```

## Supabase Tables

### exam_archive Table
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| exam_name | text | Name of exam |
| exam_year | int4 | Year of exam |
| state | text | State/National |
| subject_category | text | Subject category |
| exam_data | jsonb | Questions array |
| created_at | timestamptz | Creation timestamp |

### user_downloads Table
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| user_id | text | User identifier |
| exam_id | uuid | Exam reference |
| downloaded_at | timestamptz | Download time |

## Gemini Prompt for PDF Conversion

When converting PDFs to JSON using Google AI Studio:

```
Transform the following raw text from an Indian Government Exam paper into a "Downloadable Study Packet."
- Output ONLY valid JSON.
- Structure: { "document_info": {...}, "questions": [...] }
- Each question must have: id, subject, question_text, options (with is_correct), explanation (english + tanglish)
- Language: English for questions, Tanglish (Tamil+English) for explanations
- NO hallucinations - only use provided text
```

## exam_data JSON Structure

```json
{
  "document_info": {
    "exam_name": "TNPSC Group 4",
    "exam_year": 2024,
    "total_questions": 100
  },
  "questions": [
    {
      "id": "q001",
      "subject": "History",
      "question_text": "Question text here?",
      "options": [
        { "id": "a", "text": "Option A", "is_correct": false },
        { "id": "b", "text": "Option B", "is_correct": true }
      ],
      "explanation": {
        "english": "English explanation",
        "tanglish": "Tanglish explanation"
      }
    }
  ]
}
```

## License

MIT License
