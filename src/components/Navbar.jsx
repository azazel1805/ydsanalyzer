// src/components/Navbar.jsx
import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';

const Navbar = () => {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate('/'); // Çıkış yaptıktan sonra giriş ekranına yönlendir
    } catch (error) {
      console.error("Çıkış yaparken hata oluştu:", error);
    }
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        <NavLink to="/" className="nav-logo">
          YDS Analyzer
        </NavLink>
        <ul className="nav-menu">
          <li className="nav-item">
            <NavLink to="/" className={({ isActive }) => (isActive ? 'nav-links active' : 'nav-links')}>
              Analiz
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink to="/history" className={({ isActive }) => (isActive ? 'nav-links active' : 'nav-links')}>
              Geçmiş
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink to="/dashboard" className={({ isActive }) => (isActive ? 'nav-links active' : 'nav-links')}>
              Panel
            </NavLink>
          </li>
        </ul>
        <button onClick={handleSignOut} className="nav-button">
          Çıkış Yap
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
