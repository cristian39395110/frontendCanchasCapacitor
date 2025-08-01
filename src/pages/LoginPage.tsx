import React, { useEffect } from 'react'; 
import Login from '../components/Login';
import { getDeviceToken } from '../utils/fcm';
import { Capacitor } from '@capacitor/core';
import { API_URL } from '../config';
import { useNavigate } from 'react-router-dom';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();

 const handleLogin = async (usuario: any) => {
  console.log('✅ Usuario autenticado:', usuario);

  const usuarioId = usuario.id;
  const token = localStorage.getItem('token');

  if (usuarioId && token && Capacitor.getPlatform() === 'android') {
    try {
      const fcmToken = await getDeviceToken();
      console.log('📱 Token FCM post-login:', fcmToken);

      if (!fcmToken) return;

      const res = await fetch(`${API_URL}/api/suscripcion`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ usuarioId, fcmToken })
      });

      if (res.ok) {
        console.log('✅ Suscripción FCM completada');
      } else {
        const error = await res.text();
        console.error('❌ Error al guardar FCM:', error);
      }
    } catch (err) {
      console.error('❌ Error en FCM post-login:', err);
    }
  }

  navigate('/dashboard');
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
