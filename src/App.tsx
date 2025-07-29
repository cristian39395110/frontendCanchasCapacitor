import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { getDeviceToken } from './utils/fcm';
import { PushNotifications } from '@capacitor/push-notifications';
import MuroGeneralPage from './pages/MuroGeneralPage';
import AceptacionesPage from './pages/AceptacionesPage';
import LoginPage from './pages/LoginPage';
import Registro from './components/Registro';
import DashboardPage from './pages/DashboardPage';
import NuevoJuegoPage from './pages/NuevoJuegoPage';
import BuscarJugadoresPage from './pages/BuscarJugadoresPage';
import NotificacionesPage from './pages/NotificacionesPage';
import InvitacionesPage from './pages/Invitaciones';
import TestBackendPage from './pages/TestBackendPage';
import MensajesPage from './pages/MensajesPage';
import NotificarJugadoresPremiumPage from './pages/PremiumNotificarPage';
import InvitacionesAutoPage from './pages/InvitacionesAuto';
import CalificarPage from './pages/CalificarPage';
import CalificarJugadoresPage from './pages/CalificarJugadoresPage';
import PerfilUsuarioPage from './pages/PerfilUsuarioPage';
import CanchasPage from './pages/CanchasPage';
import CrearCanchaPage from './pages/CrearCanchaPage';
import EditarPerfilPage from './pages/EditarPerfilPage';
import RutaProtegidaSoloAdmin from './components/RutaProtegidaSoloAdmin'; // si está ahí, si no ajustá el path
import PublicacionDetallePage from './components/PublicacionDetallePage';

import SplashPage from './pages/SplashPage';

import PrivateRoute from './components/PrivateRoute';
import BottomNavbar from './components/BottomNavbar';

  import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { API_URL } from './config';
import './index.css';
import BuscarUsuariosPage from './pages/BuscarUsuariosPage';

if (Capacitor.getPlatform() !== 'web') {
  PushNotifications.addListener('pushNotificationReceived', (notification) => {
    console.log('📩 Notificación recibida:', notification);
  });

  PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
    console.log('👉 Notificación abierta:', notification);
  });
}

function AppInner() {
  const navigate = useNavigate();
  const location = useLocation();

  const [usuarioId, setUsuarioId] = useState<string | null>(localStorage.getItem('usuarioId'));
  const [mensajesNoLeidos, setMensajesNoLeidos] = useState(0);
  const [invitaciones, setInvitaciones] = useState(0);


  

  // ✅ Detectar cambios de ruta y sincronizar estado
  useEffect(() => {
    const id = localStorage.getItem('usuarioId');
    if (location.pathname === '/' || location.pathname === '/registro') {
      setUsuarioId(null);
    } else {
      setUsuarioId(id);
    }
  }, [location.pathname]);

  // 🌍 Geolocalización
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        () => {},
        (error) => {
          if (error.code === error.PERMISSION_DENIED) {
            alert('🚫 Debes permitir el acceso a tu ubicación para buscar jugadores cercanos.');
          }
        }
      );
    }
  }, []);

  // 🔔 Notificaciones push
  useEffect(() => {
   PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
  const data = notification.notification?.data;
  console.log('🔔 Notificación abierta:', data);

  if (data?.url) {
    navigate(data.url); // Ej: "/invitaciones", "/chat/123", etc.
  } else {
    navigate('/');
  }
});

    const iniciarNotificaciones = async () => {
      const token = localStorage.getItem('token');
      const usuarioId = localStorage.getItem('usuarioId');

      if (!token || !usuarioId) return;

      if (Capacitor.getPlatform() === 'android') {
        try {
          const deviceToken = await getDeviceToken();
          if (!deviceToken) return;

          await fetch(`${API_URL}/api/suscripcion`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ usuarioId, fcmToken: deviceToken })
          });

          console.log('✅ Token FCM enviado al backend');
        } catch (err) {
          console.error('❌ Error al enviar el token FCM:', err);
        }
      }
    };

    iniciarNotificaciones();
  }, []);

  // 🔄 Mensajes e invitaciones
  useEffect(() => {
    if (!usuarioId) return;

    fetch(`${API_URL}/api/mensajes/no-leidos/${usuarioId}`)
      .then(res => res.json())
      .then(data => setMensajesNoLeidos(data.total));

    fetch(`${API_URL}/api/solicitudes/${usuarioId}`)
      .then(res => res.json())
      .then(data => setInvitaciones(data.length));
  }, [usuarioId]);

  const ocultarBottomNavbar = !usuarioId || location.pathname === '/login' || location.pathname === '/registro';

  return (
    <>



      <Routes>
            {/* 🔄 Actualizador de ubicación cada 10 minutos */}
   
        <Route path="/login" element={<LoginPage />} />
        <Route path="/registro" element={<Registro />} />

        <Route path="/dashboard" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
        <Route path="/juegonuevo" element={<PrivateRoute><NuevoJuegoPage /></PrivateRoute>} />
        <Route path="/buscar-jugadores" element={<PrivateRoute><BuscarJugadoresPage /></PrivateRoute>} />
        <Route path="/notificaciones" element={<PrivateRoute><NotificacionesPage /></PrivateRoute>} />
        <Route path="/invitaciones" element={<PrivateRoute><InvitacionesPage /></PrivateRoute>} />
        <Route path="/chat" element={<PrivateRoute><MensajesPage /></PrivateRoute>} />
        <Route path="/chat/:usuarioId" element={<PrivateRoute><MensajesPage /></PrivateRoute>} />
        <Route path="/test-backend" element={<PrivateRoute><TestBackendPage /></PrivateRoute>} />
        <Route path="/perfil/:id" element={<PrivateRoute><PerfilUsuarioPage /></PrivateRoute>} />
         <Route path="/chat/partido/:partidoId" element={<PrivateRoute><MensajesPage /></PrivateRoute>} />

          <Route path="/perfil" element={<PrivateRoute><PerfilUsuarioPage /></PrivateRoute>} />

        <Route path="/notificar-jugadores/:deporteId" element={<PrivateRoute><NotificarJugadoresPremiumPage /></PrivateRoute>} />
         <Route path="/EditarPerfilPage" element={<PrivateRoute><EditarPerfilPage /></PrivateRoute>} />
        <Route path="/calificar-jugadores" element={<PrivateRoute><CalificarJugadoresPage /></PrivateRoute>} />
        <Route path="/calificar/:partidoId" element={<CalificarPage />} />
        <Route path="/aceptaciones" element={<PrivateRoute><AceptacionesPage /></PrivateRoute>} />
        <Route path="/invitaciones-auto" element={<PrivateRoute><InvitacionesAutoPage /></PrivateRoute>} />
        <Route path="/muro" element={<PrivateRoute><MuroGeneralPage /></PrivateRoute>} />
         <Route path="/BuscarUsuario" element={<PrivateRoute><BuscarUsuariosPage /></PrivateRoute>} />
         <Route path="/canchas" element={<CanchasPage />} />
      
         <Route path="/publicacion/:id" element={<PublicacionDetallePage />} />


         <Route path="/crear-cancha" element={<RutaProtegidaSoloAdmin><CrearCanchaPage /></RutaProtegidaSoloAdmin>} />
         <Route path="/" element={<SplashPage />} />



        <Route path="*" element={<LoginPage />} />
      </Routes>

       <ToastContainer
  position="top-center"
  autoClose={4000}
  hideProgressBar={false}
  newestOnTop
  closeOnClick
  pauseOnFocusLoss={false}
  pauseOnHover={false}
  draggable
  closeButton // 🔁 activa botón de cerrar (es true por defecto)
  theme="light" // o "dark" si estás usando modo oscuro
/>

      {/* ✅ BottomNavbar solo si hay sesión activa y no estamos en login/registro */}
      {!ocultarBottomNavbar && (
        <BottomNavbar
          mensajesNoLeidos={mensajesNoLeidos}
          invitaciones={invitaciones}
        />
      )}
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppInner />
    </BrowserRouter>
  );
}
