import { useState } from 'react';
import axios from 'axios';
import './App.css';

// Kalıp detaylarını gösteren Modal bileşeni
const KalipModal = ({ kalip, onClose }) => {
  if (!kalip) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3>{kalip.kalip}</h3>
        {/* Açıklamadaki \n karakterlerini <br> ile değiştirerek satır atlamalarını sağlıyoruz */}
        <p dangerouslySetInnerHTML={{ __html: kalip.aciklama.replace(/\n/g, '<br />') }} />
        <button onClick={onClose} style={{ marginTop: '1rem', backgroundColor: 'var(--primary-color)' }}>
          Kapat
        </button>
      </div>
    </div>
  );
};

// Bir metin içindeki belirli kelimeleri (kalıpları) tıklanabilir hale getiren yardımcı fonksiyon
const renderWithClickableKalips = (text, kalips, onKalipClick) => {
  if (!text) return null;
  if (!kalips || kalips.length === 0) {
    return <p dangerouslySetInnerHTML={{ __html: text.replace(/\n/g, '<br />') }} />;
  }
  const regex = new RegExp(`(${kalips.map(k => k.kalip.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
  const parts = text.split(regex);
  return (
    <p>
      {parts.map((part, index) => {
        const matchingKalip = kalips.find(k => k.kalip.toLowerCase() === part.toLowerCase());
        if (matchingKalip) {
          return <span key={index} className="clickable-kalip" onClick={() => onKalipClick(matchingKalip)}>{part}</span>;
        }
        return <span key={index} dangerouslySetInnerHTML={{ __html: part.replace(/\n/g, '<br />') }} />;
      })}
    </p>
  );
};

function App() {
  const [inputText, setInputText] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedKalip, setSelectedKalip] = useState(null);
  const [selectedSoruTipi, setSelectedSoruTipi] = useState('auto');

  // Frontend'de gösterilecek ve backend'e gönderilecek soru tipleri listesi
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

  const handleImageChange = (e) => {
    if (e.target.files[0]) {
      setImageFile(e.target.files[0]);
      setInputText('');
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

    // Backend'e gönderilecek veri objesi (payload)
    const payload = {
      selectedSoruTipi: selectedSoruTipi // Kullanıcının seçtiği soru tipini ekliyoruz
    };

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
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Analiz sırasında beklenmedik bir hata oluştu.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleKalipClick = (kalip) => {
    setSelectedKalip(kalip);
  };

  return (
    <div className="App">
      <h1>YDS Soru Analiz Asistanı</h1>
      <div className="input-container">
        <textarea
          placeholder="YDS sorusunu veya paragrafını buraya yapıştırın..."
          value={inputText}
          onChange={(e) => {
            setInputText(e.target.value);
            if (imageFile) setImageFile(null);
          }}
          disabled={isLoading}
        />
        <div className="file-input-wrapper">
          <label htmlFor="file-upload" className="file-input-label">
            veya Soru Fotoğrafı Yükle
          </label>
          <input
            id="file-upload" type="file" accept="image/*"
            onChange={handleImageChange} disabled={isLoading}
          />
          {imageFile && <p className='file-name'>{imageFile.name}</p>}
        </div>

        {/* KULLANICININ SORU TİPİNİ SEÇEBİLECEĞİ DROPDOWN MENÜSÜ */}
        <div className="soru-tipi-selector">
          <label htmlFor="soru-tipi" style={{fontWeight: 'bold', color: '#555'}}>Soru Tipi (İsteğe Bağlı):</label>
          <select
            id="soru-tipi"
            value={selectedSoruTipi}
            onChange={(e) => setSelectedSoruTipi(e.target.value)}
            disabled={isLoading}
            style={{width: '100%', padding: '0.8rem', marginTop: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '1rem', backgroundColor: '#fff'}}
          >
            {soruTipleri.map(tip => (
              <option key={tip.value} value={tip.value}>{tip.label}</option>
            ))}
          </select>
        </div>
      </div>

      <button onClick={handleAnalyze} disabled={isLoading || (!inputText && !imageFile)}>
        {isLoading ? 'Analiz Ediliyor...' : 'Analiz Et'}
      </button>

      {isLoading && <div className="loader">Lütfen bekleyin, yapay zeka sorunuzu analiz ediyor...</div>}
      {error && <div className="error">{error}</div>}
      
      {analysisResult && (
        <div className="analysis-result">
            <div className='result-section'>
                <h2>Soru Tipi</h2>
                <p><strong>{analysisResult.soruTipi}</strong></p>
            </div>

            <div className='result-section'>
                <h2>Soru Konusu</h2>
                <p><strong>{analysisResult.konu}</strong></p>
            </div>
            
            <div className='result-section'>
                <h2>Detaylı Açıklama</h2>
                {renderWithClickableKalips(analysisResult.detayliAciklama, analysisResult.kalıplar, handleKalipClick)}
                <p style={{marginTop: '1rem'}}><strong>Doğru Cevap: {analysisResult.dogruCevap}</strong></p>
            </div>
          
            <div className='result-section'>
                <h3>Diğer Seçeneklerin Analizi</h3>
                {analysisResult.digerSecenekler.map((secenek, index) => (
                    <div key={index} style={{marginBottom: '0.8rem'}}>
                        <strong>{secenek.secenek}: </strong>
                        <span dangerouslySetInnerHTML={{ __html: secenek.aciklama.replace(/\n/g, '<br />') }} />
                    </div>
                ))}
            </div>

            {analysisResult.kalıplar && analysisResult.kalıplar.length > 0 && (
                 <div className='result-section'>
                    <h3>Sorudaki Önemli Kalıplar ve Kelimeler</h3>
                    <ul style={{ paddingLeft: '20px', listStyleType: 'disc' }}>
                        {analysisResult.kalıplar.map((kalip, index) => (
                           <li key={index} style={{ marginBottom: '0.5rem' }}>
                                <strong className="clickable-kalip" onClick={() => handleKalipClick(kalip)}>
                                    {kalip.kalip}
                                </strong>
                           </li>
                        ))}
                    </ul>
                 </div>
            )}
        </div>
      )}
      
      <KalipModal kalip={selectedKalip} onClose={() => setSelectedKalip(null)} />
    </div>
  );
}

export default App;
