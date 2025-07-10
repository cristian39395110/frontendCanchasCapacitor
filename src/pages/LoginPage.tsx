import React from 'react';
import Login from '../components/Login';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../config'; // 👈 Usamos la constante desde config.ts

const LoginPage: React.FC = () => {
  const navigate = useNavigate();

  const handleLogin = (email: string, password: string) => {
    console.log('📤 Enviando datos:', { email, password });

    fetch(`${API_URL}/api/usuarios/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
      .then(async (response) => {
        if (!response.ok) {
          const error = await response.json();
          alert(error.message || '❌ Error en la autenticación');
        } else {
          const data = await response.json();
          alert('✅ Login exitoso');

          localStorage.setItem('token', data.token);
          localStorage.setItem('usuarioId', data.usuarioId);
          localStorage.setItem('premium', data.premium); // <-- esta línea nueva


          navigate('/dashboard');
        }
      })
      .catch((error) => {
        console.error('❌ Error al hacer login:', error);
        alert('❌ No se pudo conectar al servidor');
      });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <Login onLogin={handleLogin} />
    </div>
  );
};

export default LoginPage;
