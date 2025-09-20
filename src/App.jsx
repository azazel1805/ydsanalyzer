// src/App.jsx
import React from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from './firebase';

import AppRouter from './Router';
import './App.css';

function App() {
  const [user, loading, error] = useAuthState(auth);
  
  if (loading) {
    return (
        <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100vh', 
            fontFamily: 'sans-serif',
            fontSize: '1.2rem'
        }}>
            Oturum durumu kontrol ediliyor...
        </div>
    );
  }

  if (error) {
    return (
        <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100vh' 
        }}>
            Kimlik doğrulamada bir hata oluştu: {error.message}
        </div>
    )
  }

  // Yükleme bittiğinde ve hata olmadığında, AppRouter'ı render et.
  // user objesinin null veya dolu olmasıyla artık AppRouter ilgilenecek.
  return <AppRouter />;
}

export default App;
