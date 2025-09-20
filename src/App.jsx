// src/App.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from './firebase';

import Auth from './components/Auth';
import YdsAnalyzerApp from './YdsAnalyzerApp'; 
import HistoryPage from './pages/HistoryPage'; 
import DashboardPage from './pages/DashboardPage';
import Navbar from './components/Navbar';
import './App.css';

// Kullanıcı giriş yapmışken erişilebilen, korumalı rotaları yöneten bir bileşen
const ProtectedRoute = ({ user, children }) => {
  if (!user) {
    // Eğer kullanıcı yoksa, giriş sayfasına yönlendir
    return <Navigate to="/auth" replace />;
  }
  // Kullanıcı varsa, istenen sayfayı göster
  return children;
};


function App() {
  const [user, loading, error] = useAuthState(auth);
  
  if (loading) {
    // Firebase kimlik doğrulama durumunu kontrol ederken gösterilecek ekran
    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
            Yükleniyor...
        </div>
    );
  }

  if (error) {
    // Beklenmedik bir hata olursa
    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
            Bir hata oluştu: {error.message}
        </div>
    )
  }

  return (
    <>
      {user && <Navbar />} 
      <main>
          <Routes>
            
            <Route path="/auth" element={!user ? <Auth /> : <Navigate to="/" replace />} />
            
            
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

            
            <Route path="*" element={<Navigate to={user ? "/" : "/auth"} replace />} />
          </Routes>
      </main>
    </>
  );
}

export default App;
