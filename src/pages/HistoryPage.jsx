// src/pages/HistoryPage.jsx
import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, orderBy, getDocs, doc, updateDoc } from "firebase/firestore";

function HistoryPage({ user }) {
    const [analyses, setAnalyses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        const fetchAnalyses = async () => {
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
                setError("Geçmiş analizler yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.");
            } finally {
                setLoading(false);
            }
        };

        fetchAnalyses();
    }, [user]);

    const toggleMistake = async (id, currentStatus) => {
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
                    {analyses.map(analysis => {
                        // === GÜVENLİK KONTROLÜ EKLENDİ ===
                        // 'questionText' var mı ve string mi diye kontrol et, yoksa varsayılan bir metin kullan.
                        const questionPreview = (analysis.questionText && typeof analysis.questionText === 'string') 
                            ? analysis.questionText.substring(0, 150) + '...'
                            : 'Soru metni mevcut değil...';

                        return (
                            <div key={analysis.id} className="history-item">
                                <p className="history-question"><strong>Soru:</strong> {questionPreview}</p>
                                <div className="history-details">
                                    <span><strong>Tip:</strong> {analysis.analysisData?.soruTipi || 'N/A'}</span>
                                    <span><strong>Zorluk:</strong> {analysis.analysisData?.zorlukSeviyesi || 'N/A'}</span>
                                    {/* Tarih alanı null olabilir, bunu da kontrol edelim */}
                                    <span><strong>Tarih:</strong> {analysis.createdAt ? new Date(analysis.createdAt.toDate()).toLocaleDateString('tr-TR') : 'Bilinmiyor'}</span>
                                </div>
                                <button onClick={() => toggleMistake(analysis.id, analysis.isMistake)} className={`mistake-toggle ${analysis.isMistake ? 'is-mistake' : ''}`}>
                                    {analysis.isMistake ? '✓ Hata Defterinde' : '+ Hata Defterine Ekle'}
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
export default HistoryPage;
