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

// Korumalı rota mantığı burada da kalabilir, daha temiz.
const ProtectedRoute = ({ user, children }) => {
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  return children;
};

const AppRouter = () => {
    // Bu hook'u artık burada, router'ın içinde kullanıyoruz.
    const [user] = useAuthState(auth);

    return (
        <>
            {user && <Navbar />}
            <main>
                <Routes>
                    <Route 
                        path="/auth" 
                        element={!user ? <Auth /> : <Navigate to="/" replace />} 
                    />
                    <Route 
                        path="/" 
                        element={
                            <ProtectedRoute user={user}>
                                <YdsAnalyzerApp user={user} />
                            </ProtectedRoute>
                        } 
                    />
                    <Route 
                        path="/history" 
                        element={
                            <ProtectedRoute user={user}>
                                <HistoryPage user={user} />
                            </ProtectedRoute>
                        } 
                    />
                    <Route 
                        path="/dashboard" 
                        element={
                            <ProtectedRoute user={user}>
                                <DashboardPage user={user} />
                            </ProtectedRoute>
                        } 
                    />
                    {/* Diğer tüm yolları ana sayfaya veya giriş ekranına yönlendir */}
                    <Route path="*" element={<Navigate to={user ? "/" : "/auth"} replace />} />
                </Routes>
            </main>
        </>
    );
}

export default AppRouter;
