import { useState, useRef } from 'react';
import axios from 'axios';
import './App.css';

// Kendi dosyalarına taşıdığımız bileşenleri ve yardımcıları import ediyoruz
import KalipModal from './components/KalipModal';
import LoadingSkeleton from './components/LoadingSkeleton';
import AnalysisResultView from './components/AnalysisResultView';
import BenzerSoruView from './components/BenzerSoruView';

function App() {
  const [inputText, setInputText] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedKalip, setSelectedKalip] = useState(null);
  const [selectedSoruTipi, setSelectedSoruTipi] = useState('auto');
  const [benzerSoru, setBenzerSoru] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const fileInputRef = useRef(null);
  const resultsRef = useRef(null);

  const soruTipleri = [
    { value: 'auto', label: 'Otomatik Algıla (Varsayılan)' },
    { value: 'Kelime Bilgisi (Vocabulary / Phrasal Verb)', label: 'Kelime Bilgisi' },
    { value: 'Gramer (Tense, Modal, Preposition, etc.)', label: 'Gramer' },
    { value: 'Bağlaçlar (Conjunctions)', label: 'Bağlaçlar' },
    { value: 'Cloze Test', label: 'Cloze Test' },
    { value: 'Cümle Tamamlama (Sentence Completion)', label: 'Cümle Tamamlama' },
    { value: 'Çeviri (İngilizce-Türkçe / Türkçe-İngilizce)', label: 'Çeviri' },
    { value: 'Paragraf Soruları (Reading Comprehension)', label: 'Paragraf Soruları' },
    { value: 'Diyalog Tamamlama (Dialogue Completion)', label: 'Diyalog Tamamlama' },
    { value: 'Anlamca En Yakın Cümle (Restatement)', label: 'Anlamca En Yakın Cümle' },
    { value: 'Paragraf Tamamlama (Paragraph Completion)', label: 'Paragraf Tamamlama' },
    { value: 'Anlam Bütünlüğünü Bozan Cümle (Irrelevant Sentence)', label: 'Anlam Bütünlüğünü Bozan Cümle' },
  ];

  const handleClear = () => {
    setInputText('');
    setImageFile(null);
    setAnalysisResult(null);
    setError('');
    setBenzerSoru(null);
    if (fileInputRef.current) {
        fileInputRef.current.value = null;
    }
  };
  
  const handleAnalyze = async () => {
    if (!inputText && !imageFile) {
      setError('Lütfen bir soru metni girin veya bir fotoğraf seçin.');
      return;
    }
    setIsLoading(true);
    setError('');
    setAnalysisResult(null);
    setBenzerSoru(null);

    const payload = { selectedSoruTipi: selectedSoruTipi };
    
    if (imageFile) {
        const reader = new FileReader();
        reader.readAsDataURL(imageFile);
        reader.onload = async () => {
            const base64Image = reader.result.split(',')[1];
            payload.imageData = base64Image;
            payload.imageMimeType = imageFile.type;
            await sendRequest(payload);
        };
        reader.onerror = () => { 
            setError('Resim dosyası okunurken bir hata oluştu.'); 
            setIsLoading(false); 
        };
    } else {
        payload.text = inputText;
        await sendRequest(payload);
    }
  };

  const sendRequest = async (payload) => {
    try {
        const response = await axios.post('/.netlify/functions/analyze', payload);
        setAnalysisResult(response.data);
        setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (err) {
        const errorMessage = err.response?.data?.error || 'Analiz sırasında beklenmedik bir hata oluştu.';
        setError(errorMessage);
    } finally {
        setIsLoading(false);
    }
  };
  
  // App.jsx içinden KalipModal ve diğer bileşen tanımlarını sildik,
  // çünkü artık onları kendi dosyalarından import ediyoruz.

  return (
    <div className="App">
      <h1>
        <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
        YDS Soru Analiz Asistanı
      </h1>

      <div className="input-container">
        <textarea
          placeholder="YDS sorusunu veya paragrafını buraya yapıştırın..."
          value={inputText}
          onChange={(e) => { setInputText(e.target.value); if (imageFile) setImageFile(null); }}
          disabled={isLoading || isGenerating}
        />
        <div className="file-input-wrapper">
          <label htmlFor="file-upload" className="file-input-label">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
            Soru Fotoğrafı Yükle
          </label>
          <input 
            id="file-upload" 
            ref={fileInputRef}
            type="file" 
            accept="image/*" 
            onChange={(e) => {
              if (e.target.files[0]) {
                setImageFile(e.target.files[0]);
                setInputText('');
              }
            }} 
            disabled={isLoading || isGenerating} 
          />
          {imageFile && <p className='file-name'>{imageFile.name}</p>}
        </div>
        <div className="soru-tipi-selector">
          <label htmlFor="soru-tipi" style={{fontWeight: '600', color: 'var(--text-muted)'}}>Soru Tipi (İsteğe Bağlı):</label>
          <select 
            id="soru-tipi" 
            value={selectedSoruTipi} 
            onChange={(e) => setSelectedSoruTipi(e.target.value)} 
            disabled={isLoading || isGenerating}
          >
            {soruTipleri.map(tip => (<option key={tip.value} value={tip.value}>{tip.label}</option>))}
          </select>
        </div>
      </div>

      <button 
        className="analyze-button" 
        onClick={handleAnalyze} 
        disabled={isLoading || isGenerating || (!inputText && !imageFile)}
      >
        {isLoading ? 'Analiz Ediliyor...' : 'Analiz Et'}
      </button>

      {(analysisResult || error) && !isLoading && (
        <div className="clear-button-wrapper">
          <button onClick={handleClear} className="clear-button">
            Temizle & Yeni Soru
          </button>
        </div>
      )}

      {isLoading && <LoadingSkeleton />}
      {error && <div className="error">{error}</div>}
      
      <div ref={resultsRef}>
        {analysisResult && (
            <AnalysisResultView 
                result={analysisResult} 
                onKalipClick={setSelectedKalip}
                originalQuestion={inputText || "Resimdeki soru"}
                setAnalysisResult={setAnalysisResult}
                setBenzerSoru={setBenzerSoru}
                setIsGenerating={setIsGenerating}
                isGenerating={isGenerating}
            />
        )}
        {isGenerating && <div className="loader"><div className="spinner"></div><p>Benzer soru üretiliyor...</p></div>}
        {benzerSoru && <BenzerSoruView soru={benzerSoru} />}
      </div>
      
      <KalipModal kalip={selectedKalip} onClose={() => setSelectedKalip(null)} />
    </div>
  );
}

export default App;
