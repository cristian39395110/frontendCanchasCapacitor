import React, { useState, useEffect } from 'react';
import { API_URL } from '../config';
import '../utils/Login.css';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Preferences } from '@capacitor/preferences';
import { Device } from '@capacitor/device';
import './login.css';
type Usuario = {
  id: number;
  nombre: string;
  email: string;
  fotoPerfil: string;
  localidad: string;
  sexo: string;
  edad: number;
  premium: boolean;
};

type LoginProps = {
  onLogin: (usuario: Usuario) => void;
};

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [emailRecuperacion, setEmailRecuperacion] = useState('');
  const [confirmarCambio, setConfirmarCambio] = useState(false);


  useEffect(() => {
    const verificarSesion = async () => {
      let token = localStorage.getItem('token');

      if (!token) {
        const result = await Preferences.get({ key: 'token' });
        token = result.value;

        if (token) {
          localStorage.setItem('token', token);
          const { value: usuarioId } = await Preferences.get({ key: 'usuarioId' });
          const { value: esPremium } = await Preferences.get({ key: 'esPremium' });
          if (usuarioId) localStorage.setItem('usuarioId', usuarioId);
          if (esPremium) localStorage.setItem('esPremium', esPremium);
        }
      }

      if (token) {
        try {
          const res = await fetch(`${API_URL}/api/usuarios/yo`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const usuario = await res.json();
            onLogin(usuario);
            toast.success(`Bienvenido de nuevo, ${usuario.nombre}`);
          } else {
            localStorage.removeItem('token');
            await Preferences.remove({ key: 'token' });
          }
        } catch {
          localStorage.removeItem('token');
          await Preferences.remove({ key: 'token' });
        }
      }
    };

    verificarSesion();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let { identifier: deviceId } = await Device.getId();
      deviceId="f44fae0bc7c1c63c";
      const res = await fetch(`${API_URL}/api/usuarios/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, deviceId }),
      });

      const data = await res.json();
     if (!res.ok) {
  if (data.message?.includes('otro celular')) {
    toast.error('❌ Este correo ya está vinculado a otro celular. Solo podés iniciar sesión desde ese dispositivo.');
  } else if (data.message?.includes('una vez cada 7 días')) {
    toast.error('⚠️ Solo podés cambiar de celular una vez cada 7 días. Intentá más adelante.');
  } else {
    toast.error(data.message || 'Error al iniciar sesión');
  }
  return;
}


      await Preferences.set({ key: 'token', value: data.token });
      await Preferences.set({ key: 'usuarioId', value: String(data.usuarioId) });
      await Preferences.set({ key: 'esPremium', value: String(data.esPremium) });

      localStorage.setItem('token', data.token);
      localStorage.setItem('usuarioId', data.usuarioId);
      localStorage.setItem('esPremium', data.esPremium);

      const usuario = await fetch(`${API_URL}/api/usuarios/yo`, {
        headers: { Authorization: `Bearer ${data.token}` },
      }).then(r => r.json());

      onLogin(usuario);
      toast.success('✅ Sesión iniciada');
    } catch (error: any) {
      toast.error(error.message || 'Error al iniciar sesión');
    }
  };

  const handleRecuperar = async () => {
    if (!emailRecuperacion) {
      toast.warn('Por favor, ingresá tu correo');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/usuarios/recuperar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailRecuperacion }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al recuperar contraseña');

      toast.success(data.mensaje);
      setMostrarModal(false);
      setEmailRecuperacion('');
    } catch (error: any) {
      toast.error(error.message || 'Ocurrió un error.');
    }
  };

const handleCambioDeCelular = async () => {
  if (!email || !password) {
    toast.warn('📧 Ingresá tu correo y contraseña primero.');
    return;
  }

  try {
    const { identifier: deviceId } = await Device.getId();

    const res = await fetch(`${API_URL}/api/usuarios/limpiar-device`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, deviceId }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message);

    toast.success('✅ Dispositivo actualizado. Ahora podés iniciar sesión.');
    setConfirmarCambio(false); // Cierra el modal si fue exitoso
  } catch (error: any) {
    toast.error(error.message || 'Error al actualizar el dispositivo.');
  }
};

  return (
    <div
      className="login-container responsive"
      style={{
        backgroundImage: `url(${API_URL}/uploads/4d80706e7052c2c1fff1814a07b84041.jpg)`,
      }}
    >
      <ToastContainer />
      <div className="login-box">
        <h2>Iniciar sesión</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Correo electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <div style={{ position: 'relative', marginBottom: '15px' }}>
            <input
              type={mostrarPassword ? 'text' : 'password'}
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                paddingRight: '40px',
                backgroundColor: '#fff',
                color: '#000',
                boxSizing: 'border-box',
              }}
            />
            <span
              onClick={() => setMostrarPassword(!mostrarPassword)}
              style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                cursor: 'pointer',
                fontSize: '20px',
                color: '#000',
                userSelect: 'none',
              }}
              aria-label="Mostrar u ocultar contraseña"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') setMostrarPassword(!mostrarPassword);
              }}
            >
              {mostrarPassword ? '🙈' : '👁️'}
            </span>
          </div>
          <button type="submit">Iniciar sesión</button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '10px' }}>
          <button
            type="button"
            onClick={() => setMostrarModal(true)}
            style={{
              background: 'none',
              border: 'none',
              color: '#0ea5e9',
              cursor: 'pointer',
              textDecoration: 'underline',
              fontSize: '14px',
            }}
          >
            ¿Olvidaste tu contraseña?
          </button>
        </p>
<p style={{ textAlign: 'center' }}>
  <button
    type="button"
    onClick={() => setConfirmarCambio(true)}
    style={{
      background: 'none',
      border: 'none',
      color: '#f43f5e',
      cursor: 'pointer',
      textDecoration: 'underline',
      fontSize: '14px',
    }}
  >
    ¿Cambiaste de celular?
  </button>
</p>


        <p>¿No tienes cuenta? <a href="/registro">Regístrate aquí</a></p>
      </div>

      {mostrarModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Recuperar contraseña</h3>
            <input
              type="email"
              placeholder="Tu correo electrónico"
              value={emailRecuperacion}
              onChange={(e) => setEmailRecuperacion(e.target.value)}
              required
            />
            <div className="modal-buttons">
              <button onClick={handleRecuperar}>Enviar enlace</button>
              <button onClick={() => setMostrarModal(false)}>Cancelar</button>
            </div>
          </div>
        </div>
        
      )}
      {confirmarCambio && (
  <div className="modal-overlay">
    <div className="modal">
      <h3>¿Querés desvincular tu cuenta del celular anterior?</h3>
      <p style={{ marginBottom: '15px' }}>
        Esto te permitirá iniciar sesión desde este nuevo dispositivo.
      </p>
      <div className="modal-buttons">
        <button onClick={handleCambioDeCelular}>Sí, desvincular</button>
        <button onClick={() => setConfirmarCambio(false)}>Cancelar</button>
      </div>
    </div>
  </div>
)}

    </div>

    
  );
  
};

export default Login;
