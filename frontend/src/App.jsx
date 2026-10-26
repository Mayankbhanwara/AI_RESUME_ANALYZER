import { useState } from 'react';
import UploadForm from './components/UploadForm';
import ResultsDashboard from './components/ResultsDashboard';
import './App.css';

function App() {
  const [analysis, setAnalysis] = useState(null);

  return (
    <div className="app">
      {!analysis ? (
        <UploadForm onAnalysisComplete={(data) => setAnalysis(data)} />
      ) : (
        <ResultsDashboard data={analysis} onReset={() => setAnalysis(null)} />
      )}
    </div>
  );
}

export default App;