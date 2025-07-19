import React, { useEffect } from 'react'; 
import Login from '../components/Login';

import { useNavigate } from 'react-router-dom';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();

  const handleLogin = (usuario: any) => {
    console.log('✅ Usuario autenticado:', usuario);
    navigate('/dashboard'); // Redirige después del login
  };
  useEffect(() => {
  const token = localStorage.getItem('token');
  const usuarioId = localStorage.getItem('usuarioId');
  if (token && usuarioId) {
    navigate('/dashboard'); // o donde quieras
  }
}, []);


  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <Login onLogin={handleLogin} />
    </div>
  );
};

export default LoginPage;
