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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
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

// Bu bileşen, sadece çoklu analiz sonuçlarını göstermek içindir. (HATASI DÜZELTİLDİ)
const MultiAnalysisView = ({ result, onKalipClick }) => (
  <>
    <div className='result-section'><h2>Soru Tipi</h2><p><strong>{result.soruTipi}</strong></p></div>
    {result.anaParagraf && <div className='result-section'><h2>Ana Paragraf</h2><p dangerouslySetInnerHTML={{ __html: result.anaParagraf.replace(/\n/g, '<br />') }}/></div>}
    
    {result.analizler.map((analiz, index) => (
      <div key={index} className="multi-analysis-item">
        <h4>Soru {analiz.soruNumarasi} Analizi</h4>
        <div className='result-section'><h5>Soru Konusu</h5><p><strong>{analiz.konu}</strong></p></div>
        <div className='result-section'><h5>Zorluk Seviyesi</h5><p><strong>{analiz.zorlukSeviyesi || "Belirlenmedi"}</strong></p></div>
        <div className='result-section'><h5>Detaylı Açıklama</h5>{renderWithClickableKalips(analiz.detayliAciklama, analiz.kalıplar, onKalipClick)}<p style={{marginTop: '1rem'}}><strong>Doğru Cevap: {analiz.dogruCevap}</strong></p></div>
        <div className='result-section'><h6>Diğer Seçeneklerin Analizi</h6>{analiz.digerSecenekler.map((secenek, i) => (<div key={i} style={{marginBottom: '0.8rem'}}><strong>{secenek.secenek}: </strong><span dangerouslySetInnerHTML={{ __html: secenek.aciklama.replace(/\n/g, '<br />') }} /></div>))}</div>
      </div>
    ))}
  </>
);


const AnalysisResultView = ({ result, onKalipClick, originalQuestion, setAnalysisResult, setBenzerSoru, setIsGenerating, isGenerating }) => {
    const [copyText, setCopyText] = useState('Analizi Kopyala');
    const [isReexplaining, setIsReexplaining] = useState(false);

    const formatAnalysisToText = () => {
        if (result.analizler) { // Çoklu analiz formatı
            let text = `Soru Tipi: ${result.soruTipi}\n\n== ANA PARAGRAF ==\n${result.anaParagraf}\n\n`;
            result.analizler.forEach(analiz => {
                text += `--- SORU ${analiz.soruNumarasi} ---\n`;
                text += `Konu: ${analiz.konu}\nZorluk: ${analiz.zorlukSeviyesi}\nDoğru Cevap: ${analiz.dogruCevap}\nAçıklama: ${analiz.detayliAciklama}\n\n`;
            });
            return text;
        } else { // Tekli analiz formatı
            let text = `Soru Tipi: ${result.soruTipi}\nZorluk: ${result.zorlukSeviyesi || 'Belirlenmedi'}\n\n== AÇIKLAMA ==\n${result.detayliAciklama}\n\n== DİĞER SEÇENEKLER ==\n`;
            result.digerSecenekler.forEach(s => { text += `${s.secenek}: ${s.aciklama}\n`; });
            return text;
        }
    };

    const handleCopyToClipboard = () => {
        const textToCopy = formatAnalysisToText();
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
                konu: result.konu || result.analizler[0].konu, // Tekli veya çokludan al
                zorlukSeviyesi: result.zorlukSeviyesi || result.analizler[0].zorlukSeviyesi,
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
