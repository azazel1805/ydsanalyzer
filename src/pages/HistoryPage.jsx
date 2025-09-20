// src/pages/HistoryPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../firebase';
import { collection, query, where, orderBy, getDocs, doc, updateDoc } from "firebase/firestore";
import { renderWithClickableKalips } from '../components/helpers.jsx';
import KalipModal from '../components/KalipModal';

// Geçmiş Analiz Detaylarını Gösteren Modal Bileşeni
// Bu, AnalysisResultView'a daha basit bir alternatiftir.
const AnalysisDetailModal = ({ analysis, onClose, onKalipClick }) => {
    if (!analysis) return null;
    const result = analysis.analysisData;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" style={{ maxWidth: '800px' }} onClick={(e) => e.stopPropagation()}>
                <h2 style={{marginTop: 0}}>Analiz Detayı</h2>
                <div className="analysis-result">
                    <div className='result-section'><h2>Soru Tipi</h2><p><strong>{result.soruTipi}</strong></p></div>
                    <div className='result-section'><h2>Zorluk Seviyesi</h2><p><strong>{result.zorlukSeviyesi || "N/A"}</strong></p></div>
                    <div className='result-section'><h2>Detaylı Açıklama</h2>{renderWithClickableKalips(result.detayliAciklama, result.kalıplar, onKalipClick)}<p style={{marginTop: '1rem'}}><strong>Doğru Cevap: {result.dogruCevap}</strong></p></div>
                    <div className='result-section'><h3>Diğer Seçeneklerin Analizi</h3>{result.digerSecenekler.map((secenek, index) => (<div key={index} style={{marginBottom: '0.8rem'}}><strong>{secenek.secenek}: </strong><span dangerouslySetInnerHTML={{ __html: secenek.aciklama.replace(/\n/g, '<br />') }} /></div>))}</div>
                </div>
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
    const [selectedAnalysis, setSelectedAnalysis] = useState(null);
    const [selectedKalip, setSelectedKalip] = useState(null);

    // useCallback ile fonksiyonun gereksiz yere yeniden oluşturulmasını engelliyoruz.
    const fetchAnalyses = useCallback(async () => {
        if (!user) {
            setLoading(false);
            return;
        }
        setLoading(true);
        setError('');
        try {
            const q = query(
                collection(db, "analyses"), 
                where("userId", "==", user.uid),
                orderBy("createdAt", "desc")
            );
            const querySnapshot = await getDocs(q);
            
            const userAnalyses = querySnapshot.docs.map(doc => ({ 
                id: doc.id, 
                ...doc.data() 
            }));
            
            setAnalyses(userAnalyses);
        } catch (err) {
            console.error("Geçmiş getirilirken hata:", err);
            setError("Geçmiş analizler yüklenirken bir hata oluştu.");
        } finally {
            setLoading(false);
        }
    }, [user]);

    // Sadece component ilk yüklendiğinde veri çek.
    useEffect(() => {
        fetchAnalyses();
    }, [fetchAnalyses]);

    const toggleMistake = async (e, id, currentStatus) => {
        e.stopPropagation();
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
                        <div key={analysis.id} className="history-item" onClick={() => setSelectedAnalysis(analysis)}>
                            <p className="history-question"><strong>Soru:</strong> {(analysis.questionText && typeof analysis.questionText === 'string') ? analysis.questionText.substring(0, 150) + '...' : 'Soru metni mevcut değil...'}</p>
                            <div className="history-details">
                                <span><strong>Tip:</strong> {analysis.analysisData?.soruTipi || 'N/A'}</span>
                                <span><strong>Zorluk:</strong> {analysis.analysisData?.zorlukSeviyesi || 'N/A'}</span>
                                <span><strong>Tarih:</strong> {analysis.createdAt ? new Date(analysis.createdAt.toDate()).toLocaleDateString('tr-TR') : 'Bilinmiyor'}</span>
                            </div>
                            <button onClick={(e) => toggleMistake(e, analysis.id, analysis.isMistake)} className={`mistake-toggle ${analysis.isMistake ? 'is-mistake' : ''}`}>
                                {analysis.isMistake ? '✓ Hata Defterinde' : '+ Hata Defterine Ekle'}
                            </button>
                        </div>
                    ))}
                </div>
            )}
            
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
