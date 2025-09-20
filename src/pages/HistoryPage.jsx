// src/pages/HistoryPage.jsx
import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, orderBy, getDocs, doc, updateDoc } from "firebase/firestore";
// Analiz detayını göstermek için ana sayfadaki bileşenleri yeniden kullanıyoruz
import AnalysisResultView from '../components/AnalysisResultView'; 
import KalipModal from '../components/KalipModal';

// Geçmiş Analiz Detaylarını Gösteren Modal Bileşeni
const AnalysisDetailModal = ({ analysis, onClose, onKalipClick }) => {
    if (!analysis) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" style={{ maxWidth: '800px' }} onClick={(e) => e.stopPropagation()}>
                <h2 style={{marginTop: 0}}>Analiz Detayı</h2>
                {/* AnalysisResultView bileşenini burada yeniden kullanıyoruz! */}
                <AnalysisResultView 
                    result={analysis.analysisData}
                    onKalipClick={onKalipClick}
                    // Bu modalde bu fonksiyonlara ihtiyacımız yok, boş fonksiyonlar yolluyoruz
                    originalQuestion={analysis.questionText}
                    setAnalysisResult={() => {}}
                    setBenzerSoru={() => {}}
                    setIsGenerating={() => {}}
                    isGenerating={false}
                />
                 <button onClick={onClose} style={{ marginTop: '1rem', backgroundColor: 'var(--primary-color)', color: 'white', border: 'none', padding: '0.8rem 1.5rem', borderRadius: '8px', cursor: 'pointer' }}>
                    Kapat
                </button>
            </div>
        </div>
    );
};


function HistoryPage({ user }) {
    const [analyses, setAnalyses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    // YENİ STATE'LER: Seçili analizi ve kalıbı tutmak için
    const [selectedAnalysis, setSelectedAnalysis] = useState(null);
    const [selectedKalip, setSelectedKalip] = useState(null);

    useEffect(() => {
        // ... (Veri çekme mantığı aynı, değişiklik yok)
        if (!user) { setLoading(false); return; }
        const fetchAnalyses = async () => { /* ... önceki cevapla aynı ... */ };
        fetchAnalyses();
    }, [user]);

    const toggleMistake = async (e, id, currentStatus) => {
        e.stopPropagation(); // Butona tıklandığında arkadaki div'in tıklanmasını engelle
        const docRef = doc(db, "analyses", id);
        try {
            await updateDoc(docRef, { isMistake: !currentStatus });
            setAnalyses(analyses.map(a => a.id === id ? {...a, isMistake: !currentStatus} : a));
        } catch (err) {
            console.error("Hata durumu güncellenirken hata:", err);
            alert("Hata durumu güncellenemedi.");
        }
    };

    if (loading) return <div className="page-container"><h1>Analiz Geçmişim</h1><p>Yükleniyor...</p></div>;
    if (error) return <div className="page-container"><h1>Analiz Geçmişim</h1><p className="error">{error}</p></div>;

    return (
        <div className="page-container">
            <h1>Analiz Geçmişim</h1>
            {analyses.length === 0 ? (
                <p>Henüz hiç analiz kaydetmediniz.</p>
            ) : (
                <div className="history-list">
                    {analyses.map(analysis => (
                        <div 
                            key={analysis.id} 
                            className="history-item" 
                            onClick={() => setSelectedAnalysis(analysis)} // Tıklandığında modalı aç
                        >
                            <p className="history-question"><strong>Soru:</strong> {(analysis.questionText && typeof analysis.questionText === 'string') ? analysis.questionText.substring(0, 150) + '...' : 'Soru metni mevcut değil...'}</p>
                            <div className="history-details">
                                <span><strong>Tip:</strong> {analysis.analysisData?.soruTipi || 'N/A'}</span>
                                <span><strong>Zorluk:</strong> {analysis.analysisData?.zorlukSeviyesi || 'N/A'}</span>
                                <span><strong>Tarih:</strong> {analysis.createdAt ? new Date(analysis.createdAt.toDate()).toLocaleDateString('tr-TR') : 'Bilinmiyor'}</span>
                            </div>
                            <button 
                                onClick={(e) => toggleMistake(e, analysis.id, analysis.isMistake)} 
                                className={`mistake-toggle ${analysis.isMistake ? 'is-mistake' : ''}`}
                            >
                                {analysis.isMistake ? '✓ Hata Defterinde' : '+ Hata Defterine Ekle'}
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Seçili analiz varsa modal'ı göster */}
            <AnalysisDetailModal 
                analysis={selectedAnalysis} 
                onClose={() => setSelectedAnalysis(null)}
                onKalipClick={setSelectedKalip}
            />
            <KalipModal kalip={selectedKalip} onClose={() => setSelectedKalip(null)} />
        </div>
    );
}

export default HistoryPage;
