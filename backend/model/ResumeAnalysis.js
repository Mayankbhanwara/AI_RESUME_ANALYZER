const mongoose = require('mongoose');

const resumeAnalysisSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    index: true          // fast lookup ke liye (history fetch karte waqt)
  },

  // Resume data
  resumeFileName: {
    type: String,
    default: ''
  },
  resumeText: {
    type: String,
    required: true
  },

  // Job description
  jobDescription: {
    type: String,
    required: true
  },
  jobTitle: {
    type: String,
    default: ''
  },

  // AI Analysis Results
  atsScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  matchedKeywords: {
    type: [String],
    default: []
  },
  missingSkills: {
    type: [String],
    default: []
  },
  suggestions: [
    {
      category: { type: String },
      suggestion: { type: String }
    }
  ],
  interviewQuestions: [
    {
      question: { type: String },
      type: { 
        type: String, 
        enum: ['technical', 'behavioral', 'hr'] 
      }
    }
  ],

  // Meta
  status: {
    type: String,
    enum: ['processing', 'completed', 'failed'],
    default: 'processing'
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 604800   // 7 din baad auto-delete (TTL index) = 7*24*60*60 seconds
  }
});

module.exports = mongoose.model('ResumeAnalysis', resumeAnalysisSchema);