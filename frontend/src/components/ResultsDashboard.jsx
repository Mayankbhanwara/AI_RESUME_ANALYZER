import { useState } from 'react';
import './ResultsDashboard.css';

function ScoreCircle({ score }) {
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const getColor = () => {
    if (score >= 75) return '#22c55e';
    if (score >= 50) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div className="score-circle-wrapper">
      <svg width="180" height="180" viewBox="0 0 180 180">
        <circle
          cx="90" cy="90" r={radius}
          fill="none" stroke="#e5e7eb" strokeWidth="14"
        />
        <circle
          cx="90" cy="90" r={radius}
          fill="none" stroke={getColor()} strokeWidth="14"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 90 90)"
          className="score-progress"
        />
      </svg>
      <div className="score-text">
        <span className="score-number">{score}</span>
        <span className="score-label">ATS Score</span>
      </div>
    </div>
  );
}

function InterviewAccordion({ questions }) {
  const [openIndex, setOpenIndex] = useState(null);
  const grouped = { technical: [], behavioral: [], hr: [] };
  questions.forEach(q => grouped[q.type]?.push(q));

  const typeColors = {
    technical: '#3b82f6',
    behavioral: '#a855f7',
    hr: '#f97316'
  };

  const typeLabels = {
    technical: '💻 Technical',
    behavioral: '🤝 Behavioral',
    hr: '👔 HR'
  };

  return (
    <div className="accordion-groups">
      {Object.keys(grouped).map(type => (
        grouped[type].length > 0 && (
          <div key={type} className="accordion-group">
            <h4 style={{ color: typeColors[type] }}>{typeLabels[type]}</h4>
            {grouped[type].map((q, i) => {
              const key = `${type}-${i}`;
              const isOpen = openIndex === key;
              return (
                <div key={key} className="accordion-item">
                  <button
                    className="accordion-header"
                    onClick={() => setOpenIndex(isOpen ? null : key)}
                    style={{ borderLeftColor: typeColors[type] }}
                  >
                    <span>{q.question}</span>
                    <span className="accordion-icon">{isOpen ? '−' : '+'}</span>
                  </button>
                </div>
              );
            })}
          </div>
        )
      ))}
    </div>
  );
}

function ResultsDashboard({ data, onReset }) {
  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>📊 Your Resume Analysis</h1>
        <button className="reset-btn" onClick={onReset}>+ New Analysis</button>
      </div>

      {/* Score Section */}
      <div className="card score-card">
        <ScoreCircle score={data.atsScore} />
        <p className="score-summary">
          {data.atsScore >= 75
            ? "Great match! Your resume aligns well with this job."
            : data.atsScore >= 50
            ? "Decent match, but there's room to improve alignment."
            : "Low match — consider tailoring your resume more closely."}
        </p>
      </div>

      {/* Keywords Section */}
      <div className="keywords-grid">
        <div className="card">
          <h3>✅ Matched Keywords</h3>
          <div className="tags">
            {data.matchedKeywords.map((kw, i) => (
              <span key={i} className="tag tag-green">{kw}</span>
            ))}
          </div>
        </div>

        <div className="card">
          <h3>⚠️ Missing Skills</h3>
          <div className="tags">
            {data.missingSkills.map((kw, i) => (
              <span key={i} className="tag tag-red">{kw}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Suggestions Section */}
      <div className="card">
        <h3>💡 Improvement Suggestions</h3>
        <div className="suggestions-list">
          {data.suggestions.map((s, i) => (
            <div key={i} className="suggestion-item">
              <span className="suggestion-category">{s.category}</span>
              <p>{s.suggestion}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Interview Questions Section */}
      <div className="card">
        <h3>🎤 Interview Questions</h3>
        <InterviewAccordion questions={data.interviewQuestions} />
      </div>
    </div>
  );
}

export default ResultsDashboard;