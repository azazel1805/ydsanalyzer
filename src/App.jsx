// src/App.jsx
import { Routes, Route, useNavigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from './firebase';

import Auth from './components/Auth';
import YdsAnalyzerApp from './YdsAnalyzerApp'; 
import HistoryPage from './pages/HistoryPage'; 
import DashboardPage from './pages/DashboardPage';
import Navbar from './components/Navbar';
import './App.css';

function App() {
  const [user, loading, error] = useAuthState(auth);
  
  if (loading) {
    return <div>Yükleniyor...</div>; // Veya daha şık bir yükleme ekranı
  }

  if (error) {
    return <div>Bir hata oluştu: {error.message}</div>
  }

  if (!user) {
    return <Auth />;
  }

  return (
    <>
      <Navbar />
      <main>
          <Routes>
              <Route path="/" element={<YdsAnalyzerApp user={user} />} />
              <Route path="/history" element={<HistoryPage user={user} />} />
              <Route path="/dashboard" element={<DashboardPage user={user} />} />
          </Routes>
      </main>
    </>
  );
}

export default App;
