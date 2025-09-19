import React, { useState } from 'react';
import axios from 'axios';
import { renderWithClickableKalips } from './helpers';

// Bu bileşen, sadece tekli analiz sonuçlarını göstermek içindir.
const SingleAnalysisView = ({ result, onKalipClick, onReexplain, isReexplaining }) => (
  <>
    <div className='result-section'>
        <h2>Soru Tipi</h2>
        <p><strong>{result.soruTipi}</strong></p>
    </div>
    <div className='result-section'>
        <h2>Zorluk Seviyesi</h2>
        <p><strong>{result.zorlukSeviyesi || "Belirlenmedi"}</strong></p>
    </div>
    <div className='result-section'>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>Detaylı Açıklama</h2>
            <button className="action-button" onClick={onReexplain} disabled={isReexplaining}>
                {isReexplaining ? "Açıklanıyor..." : "Farklı Açıkla"}
            </button>
        </div>
        {renderWithClickableKalips(result.detayliAciklama, result.kalıplar, onKalipClick)}
        <p style={{marginTop: '1rem'}}><strong>Doğru Cevap: {result.dogruCevap}</strong></p>
    </div>
    <div className='result-section'><h3>Diğer Seçeneklerin Analizi</h3>{result.digerSecenekler.map((secenek, index) => (<div key={index} style={{marginBottom: '0.8rem'}}><strong>{secenek.secenek}: </strong><span dangerouslySetInnerHTML={{ __html: secenek.aciklama.replace(/\n/g, '<br />') }} /></div>))}</div>
    {result.kalıplar && result.kalıplar.length > 0 && (<div className='result-section'><h3>Sorudaki Önemli Kalıplar ve Kelimeler</h3><ul style={{ paddingLeft: '20px', listStyleType: 'disc' }}>{result.kalıplar.map((kalip, index) => (<li key={index} style={{ marginBottom: '0.5rem' }}><strong className="clickable-kalip" onClick={() => onKalipClick(kalip)}>{kalip.kalip}</strong></li>))}</ul></div>)}
  </>
);

// Bu bileşen, sadece çoklu analiz sonuçlarını göstermek içindir.
const MultiAnalysisView = ({ result, onKalipClick }) => (
    // ... Bu bileşen bir önceki cevaptaki ile aynı ...
);

const AnalysisResultView = ({ result, onKalipClick, originalQuestion, setAnalysisResult, setBenzerSoru, setIsGenerating, isGenerating }) => {
    const [copyText, setCopyText] = useState('Analizi Kopyala');
    const [isReexplaining, setIsReexplaining] = useState(false);

    const handleCopyToClipboard = () => {
        // Analiz objesini düz metne çevirme mantığı
        let textToCopy = `Soru Tipi: ${result.soruTipi}\nZorluk: ${result.zorlukSeviyesi}\n\n== AÇIKLAMA ==\n${result.detayliAciklama}\n\n== DİĞER SEÇENEKLER ==\n`;
        result.digerSecenekler.forEach(s => { textToCopy += `${s.secenek}: ${s.aciklama}\n`; });
        navigator.clipboard.writeText(textToCopy).then(() => {
            setCopyText('Kopyalandı!');
            setTimeout(() => setCopyText('Analizi Kopyala'), 2000);
        });
    };

    const handleGenerateSimilar = async () => {
        setIsGenerating(true);
        setBenzerSoru(null);
        try {
            const response = await axios.post('/.netlify/functions/generateSimilar', {
                konu: result.konu,
                zorlukSeviyesi: result.zorlukSeviyesi,
                soruTipi: result.soruTipi
            });
            setBenzerSoru(response.data);
        } catch (e) {
            alert('Benzer soru üretilirken bir hata oluştu.');
        } finally {
            setIsGenerating(false);
        }
    };
    
    const handleReexplain = async () => {
        if(result.analizler) return; // Çoklu sorularda bu özellik kapalı
        setIsReexplaining(true);
        try {
            const response = await axios.post('/.netlify/functions/reexplain', {
                soru: originalQuestion,
                eskiAciklama: result.detayliAciklama
            });
            setAnalysisResult(prev => ({ ...prev, detayliAciklama: response.data.yeniAciklama }));
        } catch(e) {
            alert('Yeniden açıklama alınırken hata oluştu.');
        } finally {
            setIsReexplaining(false);
        }
    };

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
                <button className="action-button" onClick={handleCopyToClipboard}>{copyText}</button>
                <button className="action-button" onClick={handleGenerateSimilar} disabled={isGenerating}>
                    {isGenerating ? "Üretiliyor..." : "Benzer Soru Üret"}
                </button>
            </div>
        </div>
    );
};
export default AnalysisResultView;
