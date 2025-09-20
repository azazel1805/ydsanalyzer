// src/pages/DashboardPage.jsx
import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs } from "firebase/firestore";
import { Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';

// Chart.js'in ihtiyaç duyduğu bileşenleri kaydet
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

// Yükleme sırasında gösterilecek basit bir kart
const StatCardSkeleton = () => (
  <div className="stat-card skeleton">
    <div className="skeleton skeleton-title" style={{ height: '28px', width: '60%', marginBottom: '1rem' }}></div>
    <div className="skeleton skeleton-text" style={{ height: '48px', width: '30%' }}></div>
  </div>
);

function DashboardPage({ user }) {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const calculateStats = async () => {
            if (!user) return;

            const q = query(collection(db, "analyses"), where("userId", "==", user.uid));
            const querySnapshot = await getDocs(q);
            
            const allAnalysesData = querySnapshot.docs.map(doc => doc.data().analysisData);
            
            if (allAnalysesData.length === 0) {
                setStats({
                    totalAnalyses: 0,
                    mistakeCount: 0,
                    soruTipiData: { labels: [], datasets: [] },
                    zorlukSeviyesiData: { labels: [], datasets: [] }
                });
                setLoading(false);
                return;
            }
            
            // Tüm veriyi tek bir diziye topla (Cloze Test gibi çoklu analizleri de hesaba kat)
            const flatAnalyses = allAnalysesData.flatMap(data => data.analizler || [data]);

            // Toplam Analiz Sayısı
            const totalAnalyses = flatAnalyses.length;

            // Hata Defterindeki Soru Sayısı
            const mistakeCountQuery = query(collection(db, "analyses"), where("userId", "==", user.uid), where("isMistake", "==", true));
            const mistakeSnapshot = await getDocs(mistakeCountQuery);
            const mistakeCount = mistakeSnapshot.size;

            // Soru Tipi Dağılımı
            const soruTipiCounts = flatAnalyses.reduce((acc, curr) => {
                const tipi = curr.soruTipi || "Bilinmiyor";
                acc[tipi] = (acc[tipi] || 0) + 1;
                return acc;
            }, {});

            // Zorluk Seviyesi Dağılımı
            const zorlukSeviyesiCounts = flatAnalyses.reduce((acc, curr) => {
                const seviye = curr.zorlukSeviyesi || "Belirsiz";
                acc[seviye] = (acc[seviye] || 0) + 1;
                return acc;
            }, {});

            setStats({
                totalAnalyses,
                mistakeCount,
                soruTipiData: {
                    labels: Object.keys(soruTipiCounts),
                    datasets: [{
                        label: 'Soru Tipleri',
                        data: Object.values(soruTipiCounts),
                        backgroundColor: 'rgba(58, 134, 255, 0.6)',
                        borderColor: 'rgba(58, 134, 255, 1)',
                        borderWidth: 1,
                    }]
                },
                zorlukSeviyesiData: {
                    labels: Object.keys(zorlukSeviyesiCounts),
                    datasets: [{
                        label: 'Zorluk Seviyeleri',
                        data: Object.values(zorlukSeviyesiCounts),
                        backgroundColor: ['rgba(25, 135, 84, 0.6)', 'rgba(255, 193, 7, 0.6)', 'rgba(220, 53, 69, 0.6)'],
                        borderColor: ['#FFFFFF'],
                        borderWidth: 2,
                    }]
                }
            });

            setLoading(false);
        };

        calculateStats();
    }, [user]);

    if (loading) {
        return (
            <div className="page-container">
                <h1>Performans Panelim</h1>
                <div className="dashboard-grid">
                    <StatCardSkeleton />
                    <StatCardSkeleton />
                    <div className="stat-card-large skeleton"></div>
                </div>
            </div>
        );
    }
    
    if (stats.totalAnalyses === 0) {
        return (
            <div className="page-container">
                <h1>Performans Panelim</h1>
                <p>Henüz hiç analiz yapmadınız. Analiz yapmaya başlayın ve istatistiklerinizi burada görün!</p>
            </div>
        )
    }

    return (
        <div className="page-container">
            <h1>Performans Panelim</h1>
            <div className="dashboard-grid">
                <div className="stat-card">
                    <h2>Toplam Analiz</h2>
                    <p className="stat-number">{stats.totalAnalyses}</p>
                </div>
                <div className="stat-card">
                    <h2>Hata Defteri</h2>
                    <p className="stat-number">{stats.mistakeCount}</p>
                </div>

                <div className="stat-card-large">
                    <h2>Soru Tipi Dağılımı</h2>
                    <Bar options={{ responsive: true, plugins: { legend: { display: false } } }} data={stats.soruTipiData} />
                </div>
                
                <div className="stat-card-large">
                    <h2>Zorluk Seviyesi Dağılımı</h2>
                    <div style={{ maxWidth: '300px', margin: '0 auto' }}>
                        <Pie data={stats.zorlukSeviyesiData} />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default DashboardPage;
