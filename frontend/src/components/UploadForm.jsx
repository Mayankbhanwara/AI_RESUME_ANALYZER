import { useState } from 'react';
import axios from 'axios';
import { getSessionId } from '../utils/session';
import './UploadForm.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/resume';

function UploadForm({ onAnalysisComplete }) {
  const [resumeFile, setResumeFile] = useState(null);
  const [jobDescription, setJobDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type !== 'application/pdf') {
      setError('Please upload a PDF file only.');
      setResumeFile(null);
      return;
    }
    setError('');
    setResumeFile(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!resumeFile) {
      setError('Please upload your resume PDF.');
      return;
    }
    if (jobDescription.trim().length < 20) {
      setError('Please enter a job description (at least 20 characters).');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('resume', resumeFile);
      formData.append('sessionId', getSessionId());
      formData.append('jobDescription', jobDescription);

      const response = await axios.post(`${API_URL}/analyze`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      onAnalysisComplete(response.data);
    } catch (err) {
      console.error(err);
      const message = err.response?.data?.error || 'Something went wrong. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="upload-form-container">
      <h1>AI Resume Analyzer</h1>
      <p className="subtitle">Upload your resume and job description to get instant ATS insights</p>

      <form onSubmit={handleSubmit} className="upload-form">
        <div className="form-group">
          <label>Resume (PDF only, max 5MB)</label>
          <input
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            disabled={loading}
          />
          {resumeFile && <p className="file-name">📄 {resumeFile.name}</p>}
        </div>

        <div className="form-group">
          <label>Job Description</label>
          <textarea
            rows="8"
            placeholder="Paste the job description here..."
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            disabled={loading}
          />
          <span className="char-count">{jobDescription.length} characters</span>
        </div>

        {error && <p className="error-message">⚠️ {error}</p>}

        <button type="submit" disabled={loading}>
          {loading ? 'Analyzing...' : 'Analyze Resume'}
        </button>
      </form>
    </div>
  );
}

export default UploadForm;
