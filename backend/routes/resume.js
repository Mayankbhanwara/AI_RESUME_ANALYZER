const express = require('express');
const router = express.Router();
const multer = require('multer');
const pdfParse = require('pdf-parse');
const axios = require('axios');
const https = require('https');                          // 👈 NEW LINE
const ResumeAnalysis = require('../model/ResumeAnalysis');

const httpsAgent = new https.Agent({ family: 4 });        // 👈 NEW LINE (IPv4 force)

// ---- Multer setup (memory storage, PDF only, 5MB limit) ----
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      return cb(new Error('Only PDF files are allowed'));
    }
    cb(null, true);
  }
});

// ---- Wrapper: Multer errors ko properly JSON response mein convert karo ----
function handleUpload(req, res, next) {
  upload.single('resume')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File too large. Max 5MB allowed.' });
      }
      return res.status(400).json({ error: err.message });
    } else if (err) {
      return res.status(400).json({ error: err.message });
    }
    next();
  });
}

// ---- Helper: Build unified LLM prompt ----
function buildPrompt(resumeText, jobDescription) {
  return `You are an expert ATS (Applicant Tracking System) resume analyzer and career coach.

Analyze the RESUME against the JOB DESCRIPTION below and return ONLY a valid JSON object — no markdown, no backticks, no extra text, no preamble.

RESUME:
"""
${resumeText}
"""

JOB DESCRIPTION:
"""
${jobDescription}
"""

Return JSON in EXACTLY this structure:
{
  "atsScore": <number 0-100, how well resume matches JD>,
  "matchedKeywords": [<array of skills/keywords found in both resume and JD>],
  "missingSkills": [<array of important skills/keywords in JD but missing from resume>],
  "suggestions": [
    { "category": "<e.g. Formatting/Keywords/Experience/Projects>", "suggestion": "<specific actionable advice>" }
  ],
  "interviewQuestions": [
    { "question": "<question text>", "type": "<technical|behavioral|hr>" }
  ]
}

Rules:
- Generate 5-10 matchedKeywords and missingSkills each (realistic, from actual text).
- Generate 4-6 suggestions, each specific and actionable (not generic).
- Generate 6-8 interviewQuestions, mix of technical (based on resume's projects/skills), behavioral, and hr type.
- atsScore should realistically reflect keyword overlap + relevance, not always high.
- Return ONLY the JSON object, nothing else.`;
}

// ---- Helper: Call OpenRouter API (with model fallback chain) ----
async function callOpenRouter(prompt) {
  const models = [
    'anthropic/claude-3.5-sonnet',
    'openai/gpt-4o-mini',
    'meta-llama/llama-3.1-70b-instruct'
  ];

  for (const model of models) {
    try {
      const response = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.4
        },
        {
  
  headers: {
    'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
    'Content-Type': 'application/json',
    'HTTP-Referer': 'http://localhost:5000',
    'X-Title': 'AI Resume Analyzer'
  },
  timeout: 30000,
  httpsAgent                                              // 👈 NEW LINE
}
      );

      const rawText = response.data.choices[0].message.content;
      return rawText;
    } catch (err) {
      // 👇 Ye line add kar — actual error dikhayega
      console.error(`❌ Model ${model} failed:`, err.response?.data || err.message);
      continue;
    }
  }

  throw new Error('All LLM models failed');


 
}

// ---- Helper: Safely parse JSON from LLM response ----
function parseAnalysisJSON(rawText) {
  const cleaned = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch (err) {
    throw new Error('Failed to parse LLM response as JSON');
  }
}

// ---- MAIN ROUTE: Analyze resume ----
router.post('/analyze', handleUpload, async (req, res) => {
  try {
    const { sessionId, jobDescription } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId is required' });
    }
    if (!jobDescription || jobDescription.trim().length < 20) {
      return res.status(400).json({ error: 'Please provide a valid job description' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'Resume PDF file is required' });
    }

    // Step 1: Extract text from PDF
    const pdfData = await pdfParse(req.file.buffer);
    const resumeText = pdfData.text.trim();

    if (!resumeText || resumeText.length < 50) {
      return res.status(400).json({ error: 'Could not extract enough text from PDF. Try a different file.' });
    }

    // Step 2: Build prompt & call LLM
    const prompt = buildPrompt(resumeText, jobDescription);
    const rawResponse = await callOpenRouter(prompt);
    const analysis = parseAnalysisJSON(rawResponse);

    // Step 3: Save to MongoDB
    const newAnalysis = new ResumeAnalysis({
      sessionId,
      resumeFileName: req.file.originalname,
      resumeText,
      jobDescription,
      atsScore: analysis.atsScore || 0,
      matchedKeywords: analysis.matchedKeywords || [],
      missingSkills: analysis.missingSkills || [],
      suggestions: analysis.suggestions || [],
      interviewQuestions: analysis.interviewQuestions || [],
      status: 'completed'
    });

    await newAnalysis.save();

    // Step 4: Send response
    res.status(200).json(newAnalysis);

  } catch (err) {
    console.error('Analysis error:', err.message);
    res.status(500).json({ error: 'Something went wrong during analysis', details: err.message });
  }
});

// ---- History route ----
router.get('/history/:sessionId', async (req, res) => {
  try {
    const history = await ResumeAnalysis.find({ sessionId: req.params.sessionId })
      .sort({ createdAt: -1 })
      .select('-resumeText -jobDescription');

    res.json(history);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// ---- Single analysis detail route ----
router.get('/:id', async (req, res) => {
  try {
    const analysis = await ResumeAnalysis.findById(req.params.id);
    if (!analysis) return res.status(404).json({ error: 'Analysis not found' });
    res.json(analysis);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch analysis' });
  }
});

module.exports = router;