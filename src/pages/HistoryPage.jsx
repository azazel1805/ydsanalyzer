import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, orderBy, getDocs, doc, updateDoc } from "firebase/firestore";

function HistoryPage({ user }) {
    const [analyses, setAnalyses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnalyses = async () => {
            // 'analyses' koleksiyonunda, 'userId' alanı bizim kullanıcımızın id'sine eşit olanları getir
            const q = query(
                collection(db, "analyses"), 
                where("userId", "==", user.uid),
                orderBy("createdAt", "desc")
            );
            const querySnapshot = await getDocs(q);
            const userAnalyses = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            
            setAnalyses(userAnalyses);
            setLoading(false);
        };
        fetchAnalyses();
    }, [user]);

    const toggleMistake = async (id, currentStatus) => {
        const docRef = doc(db, "analyses", id);
        await updateDoc(docRef, {
            isMistake: !currentStatus
        });
        // State'i güncelle
        setAnalyses(analyses.map(a => a.id === id ? {...a, isMistake: !currentStatus} : a));
    };

    if (loading) return <div>Yükleniyor...</div>;

    return (
        <div className="page-container">
            <h1>Analiz Geçmişim</h1>
            {analyses.map(analysis => (
                <div key={analysis.id} className="history-item">
                    <p><strong>Soru:</strong> {analysis.question_text.substring(0, 100)}...</p>
                    <p><strong>Tip:</strong> {analysis.analysis_data.soruTipi}</p>
                    <button onClick={() => toggleMistake(analysis.id, analysis.is_mistake)}>
                        {analysis.is_mistake ? 'Hata Defterinden Çıkar' : 'Hata Defterine Ekle'}
                    </button>
                    {/* Buraya tıklandığında analizin tamamını gösteren bir modal eklenebilir */}
                </div>
            ))}
        </div>
    );
}
export default HistoryPage;
