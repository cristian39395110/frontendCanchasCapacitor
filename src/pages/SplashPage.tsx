import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../pages/SplashPage.css';
import logoMatchClub from '../assets/ChatGPT Image 20 jul 2025, 13_34_06.png';

const SplashPage: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      const usuarioId = localStorage.getItem('usuarioId');
      if (usuarioId) {
        navigate('/dashboard'); // Está logueado → va al dashboard
      } else {
        navigate('/login'); // No logueado → va al login
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="splash-container">
      <img src={logoMatchClub} alt="MatchClub" className="splash-logo" />
      <p className="splash-text">¡Bienvenido a MatchClub!</p>
    </div>
  );
};

export default SplashPage;
