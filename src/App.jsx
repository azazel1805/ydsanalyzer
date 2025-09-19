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
        <p>{kalip.aciklama}</p>
        <button onClick={onClose} style={{ marginTop: '1rem', backgroundColor: 'var(--primary-color)' }}>
          Kapat
        </button>
      </div>
    </div>
  );
};

// Açıklama metnindeki kalıpları tıklanabilir hale getiren fonksiyon
const renderWithClickableKalips = (text, kalips, onKalipClick) => {
    if (!kalips || kalips.length === 0) {
      return <p dangerouslySetInnerHTML={{ __html: text.replace(/\n/g, '<br />') }} />;
    }
  
    // Metni kalıplara göre böl
    const regex = new RegExp(`(${kalips.map(k => k.kalip.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
    const parts = text.split(regex);
  
    return (
      <p>
        {parts.map((part, index) => {
          const matchingKalip = kalips.find(k => k.kalip.toLowerCase() === part.toLowerCase());
          if (matchingKalip) {
            return (
              <span
                key={index}
                className="clickable-kalip"
                onClick={() => onKalipClick(matchingKalip)}
              >
                {part}
              </span>
            );
          }
          // Metnin geri kalanını satır sonlarını <br> ile değiştirerek render et
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

  const handleImageChange = (e) => {
    if (e.target.files[0]) {
      setImageFile(e.target.files[0]);
      setInputText(''); // Resim seçildiğinde metni temizle
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

    let payload = { text: inputText };

    if (imageFile) {
      const reader = new FileReader();
      reader.readAsDataURL(imageFile);
      reader.onload = async () => {
        const base64Image = reader.result.split(',')[1];
        payload = {
          imageData: base64Image,
          imageMimeType: imageFile.type,
        };
        await sendRequest(payload);
      };
      reader.onerror = () => {
        setError('Resim okunurken bir hata oluştu.');
        setIsLoading(false);
      };
    } else {
      await sendRequest(payload);
    }
  };

  const sendRequest = async (payload) => {
    try {
      // Netlify Function'a istek atıyoruz
      const response = await axios.post('/.netlify/functions/analyze', payload);
      setAnalysisResult(response.data);
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Analiz sırasında bir hata oluştu. Lütfen tekrar deneyin.';
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
      <h1>YDS Soru Analiz Asistanı (Gemini 1.5 Pro)</h1>
      <div className="input-container">
        <textarea
          placeholder="YDS sorusunu veya paragrafını buraya yapıştırın..."
          value={inputText}
          onChange={(e) => {
            setInputText(e.target.value);
            if (imageFile) setImageFile(null); // Metin yazılırsa resmi temizle
          }}
          disabled={isLoading}
        />
        <div className="file-input-wrapper">
          <label htmlFor="file-upload" className="file-input-label">
            veya Soru Fotoğrafı Yükle
          </label>
          <input
            id="file-upload"
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            disabled={isLoading}
          />
          {imageFile && <p className='file-name'>{imageFile.name}</p>}
        </div>
      </div>

      <button onClick={handleAnalyze} disabled={isLoading}>
        {isLoading ? 'Analiz Ediliyor...' : 'Analiz Et'}
      </button>

      {isLoading && <div className="loader">Lütfen bekleyin, yapay zeka sorunuzu analiz ediyor...</div>}
      {error && <div className="error">{error}</div>}
      
      {analysisResult && (
        <div className="analysis-result">
            <div className='result-section'>
                <h2>Soru Konusu</h2>
                <p><strong>{analysisResult.konu}</strong></p>
            </div>
            
            <div className='result-section'>
                <h2>Detaylı Açıklama</h2>
                {renderWithClickableKalips(analysisResult.detayliAciklama, analysisResult.kalıplar, handleKalipClick)}
                <p><strong>Doğru Cevap: {analysisResult.dogruCevap}</strong></p>
            </div>
          
            <div className='result-section'>
                <h3>Diğer Seçeneklerin Analizi</h3>
                {analysisResult.digerSecenekler.map((secenek, index) => (
                    <div key={index}>
                        <strong>{secenek.secenek}: </strong>
                        {renderWithClickableKalips(secenek.aciklama, analysisResult.kalıplar, handleKalipClick)}
                    </div>
                ))}
            </div>

            {analysisResult.kalıplar && analysisResult.kalıplar.length > 0 && (
                 <div className='result-section'>
                    <h3>Sorudaki Önemli Kalıplar ve Kelimeler</h3>
                    <ul>
                        {analysisResult.kalıplar.map((kalip, index) => (
                           <li key={index}>
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