import React, { useState } from 'react';
import { API_URL } from '../config';
import { FingerprintAIO } from '@awesome-cordova-plugins/fingerprint-aio';
import '../utils/Login.css';

type LoginProps = {
  onLogin: (email: string, password: string) => void;
};

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [emailRecuperacion, setEmailRecuperacion] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(email, password);
    localStorage.setItem('ultimoUsuarioEmail', email);
    localStorage.setItem('ultimoUsuarioPassword', password);
  };

  const loginConHuella = async () => {
    try {
      await FingerprintAIO.show({
        title: 'Autenticación biométrica',
        subtitle: 'Usa tu huella digital',
        description: 'Para ingresar rápidamente',
        disableBackup: true,
      });

      const emailGuardado = localStorage.getItem('ultimoUsuarioEmail');
      const passwordGuardado = localStorage.getItem('ultimoUsuarioPassword');

      if (emailGuardado && passwordGuardado) {
        onLogin(emailGuardado, passwordGuardado);
      } else {
        alert('No hay credenciales guardadas. Iniciá sesión normalmente primero.');
      }
    } catch (error) {
      console.error('❌ Falló autenticación biométrica', error);
    }
  };

  const handleRecuperar = async () => {
    if (!emailRecuperacion) {
      alert("Por favor, ingresá tu correo.");
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

      alert(data.mensaje);
      setMostrarModal(false);
      setEmailRecuperacion('');
    } catch (error: any) {
      alert(error.message || 'Ocurrió un error.');
    }
  };

  return (
    <div
      className="login-container"
      style={{
        backgroundImage: `url(${API_URL}/uploads/4d80706e7052c2c1fff1814a07b84041.jpg)`
      }}
    >
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
              fontSize: '14px'
            }}
          >
            ¿Olvidaste tu contraseñas?
          </button>
        </p>

        <div className="huella-wrapper" onClick={loginConHuella}>
          <button className="btn-huella-circular" title="Iniciar con huella">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              width="32"
              height="32"
              fill="#ffffff"
            >
              <path d="M0 0h24v24H0z" fill="none" />
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4S8 5.79 8 8s1.79 4 4 4zm0 2c-3.31 0-6 2.69-6 6h2a4 4 0 018 0h2c0-3.31-2.69-6-6-6z" />
            </svg>
          </button>
          <p className="texto-huella">Iniciar con huella</p>
        </div>

        <p>
          ¿No tienes cuenta? <a href="/registro">Regístrate aquí</a>
        </p>
      </div>

      {/* MODAL RECUPERACIÓN */}
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
    </div>
  );
};

export default Login;
