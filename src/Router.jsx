// src/Router.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from './firebase';

import Auth from './components/Auth';
import YdsAnalyzerApp from './YdsAnalyzerApp'; 
import HistoryPage from './pages/HistoryPage'; 
import DashboardPage from './pages/DashboardPage';
import Navbar from './components/Navbar';

const AppRouter = () => {
    // Bu hook yönlendirmeden sonra state'i güncelleyecektir
    const [user, loading] = useAuthState(auth);

    // Yükleme sırasında hiçbir şey göstermemek,
    // App.jsx'in bunu zaten yönetmesini sağlamak en iyisi.
    if (loading) {
        return null; // Veya küçük bir spinner
    }

    return (
        <>
            {user && <Navbar />}
            <main>
                <Routes>
                    {/* Eğer kullanıcı yoksa, /auth dışındaki her yolu /auth'a yönlendir */}
                    {!user && <Route path="*" element={<Navigate to="/auth" />} />}
                    <Route path="/auth" element={!user ? <Auth /> : <Navigate to="/" />} />
                    
                    {/* Eğer kullanıcı varsa, bu rotaları etkinleştir */}
                    {user && (
                        <>
                            <Route path="/" element={<YdsAnalyzerApp user={user} />} />
                            <Route path="/history" element={<HistoryPage user={user} />} />
                            <Route path="/dashboard" element={<DashboardPage user={user} />} />
                        </>
                    )}
                    
                    {/* Her ihtimale karşı bir fallback rotası */}
                    <Route path="*" element={<Navigate to={user ? "/" : "/auth"} />} />
                </Routes>
            </main>
        </>
    );
}

export default AppRouter;
