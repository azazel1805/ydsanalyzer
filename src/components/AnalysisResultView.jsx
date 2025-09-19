// src/components/AnalysisResultView.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { renderWithClickableKalips } from './helpers';

// ... (Buraya Single ve Multi view bileşenleri gelecek)

const AnalysisResultView = ({ result, onKalipClick, originalQuestion, setAnalysisResult, setBenzerSoru, setIsGenerating, isGenerating }) => {
  const [copyText, setCopyText] = useState('Analizi Kopyala');
  const [isReexplaining, setIsReexplaining] = useState(false);

  // ... (handleCopyToClipboard, handleGenerateSimilar, handleReexplain fonksiyonları)

  return (
    <div className="analysis-result">
      {result.analizler ? (
        <MultiAnalysisView result={result} onKalipClick={onKalipClick} />
      ) : (
        <SingleAnalysisView 
          result={result} 
          onKalipClick={onKalipClick} 
          onReexplain={handleReexplain} 
          isReexplaining={isReexplaining} 
        />
      )}
      <div className="result-actions">
        {/* Aksiyon Butonları */}
      </div>
    </div>
  );
};

export default AnalysisResultView;
