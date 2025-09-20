// src/App.jsx
import React from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from './firebase';

import AppRouter from './Router'; // Yeni Router bileşenimizi import ediyoruz
import './App.css';

function App() {
  const [user, loading, error] = useAuthState(auth);
  
  // Firebase kimlik doğrulama durumunu kontrol ederken gösterilecek ekran
  if (loading) {
    return (
        <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100vh', 
            fontSize: '1.2rem',
            fontFamily: 'sans-serif',
            color: '#555'
        }}>
            Uygulama Yükleniyor...
        </div>
    );
  }

  // Beklenmedik bir hata olursa
  if (error) {
    return (
        <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100vh' 
        }}>
            Bir hata oluştu: {error.message}
        </div>
    )
  }

  // Yükleme bittiğinde ve hata olmadığında, tüm yönlendirme mantığını içeren
  // AppRouter bileşenini render et.
  return <AppRouter />;
}

export default App;
