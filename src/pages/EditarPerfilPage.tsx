import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import { API_URL } from '../config';
import { useNavigate } from 'react-router-dom';
import './EditarPerfilPage.css';
import { Toast } from '@capacitor/toast';

const EditarPerfilPage: React.FC = () => {
  const navigate = useNavigate();
  const usuarioId = localStorage.getItem('usuarioId');
  const [usuario, setUsuario] = useState<any>({
    nombre: '',
    email: '',
    localidad: '',
    sexo: '',
    edad: '',
  });
  const [passwordActual, setPasswordActual] = useState('');
  const [passwordNueva, setPasswordNueva] = useState('');

  const [mostrarPasswordActual, setMostrarPasswordActual] = useState(false);
const [mostrarPasswordNueva, setMostrarPasswordNueva] = useState(false);


  useEffect(() => {
    if (!usuarioId) return;
    fetch(`${API_URL}/api/usuarios/${usuarioId}`)
      .then(res => res.json())
      .then(data => setUsuario(data))
      .catch(err => console.error('❌ Error cargando usuario', err));
  }, [usuarioId]);

  const guardarCambios = async () => {
    try {
      const res = await fetch(`${API_URL}/api/usuarios/${usuarioId}`, {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  },
  body: JSON.stringify(usuario),
});

      if (res.ok) {
          await Toast.show({ text: '✅ Perfil actualizado correctamente', duration: 'short' });
        navigate('/perfil');
      } else {
       await Toast.show({ text: '❌ Error al guardar los cambios', duration: 'short' });
      }
    } catch (error) {

      await Toast.show({ text: '❌ Error al actualizar perfil', duration: 'short' });
      
    }
  };

  const cambiarPassword = async () => {
    try {
      const res = await fetch(`${API_URL}/api/usuarios/${usuarioId}/password`, {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  },
  body: JSON.stringify({ passwordActual, passwordNueva }),
});
      if (res.ok) {
       await Toast.show({ text: '🔐 Contraseña actualizada', duration: 'short' });
        setPasswordActual('');
        setPasswordNueva('');
      } else {
         await Toast.show({ text: '❌ Error al cambiar la contraseña', duration: 'short' });
      }
    } catch (err) {
       await Toast.show({ text: '❌ Error al cambiar la contraseña', duration: 'short' });
    }
  };

  return (
    <>
      <Navbar />
      <div className="editar-perfil-container">
        <h2>Editar Perfil</h2>
        <div className="form-editar">
          <input type="text" placeholder="Nombre" value={usuario.nombre} onChange={e => setUsuario({ ...usuario, nombre: e.target.value })} />
          <input type="text" placeholder="Localidad" value={usuario.localidad} onChange={e => setUsuario({ ...usuario, localidad: e.target.value })} />
          <select value={usuario.sexo} onChange={e => setUsuario({ ...usuario, sexo: e.target.value })}>
            <option value="">Seleccionar sexo</option>
            <option value="masculino">Masculino</option>
            <option value="femenino">Femenino</option>
          </select>
          <input type="number" placeholder="Edad" value={usuario.edad} onChange={e => setUsuario({ ...usuario, edad: e.target.value })} />
          <button className="btn-guardar" onClick={guardarCambios}>💾 Guardar cambios</button>

         <h3>Cambiar contraseña</h3>

<div className="input-password-wrapper">
  <input
    type={mostrarPasswordActual ? 'text' : 'password'}
    placeholder="Contraseña actual"
    value={passwordActual}
    onChange={e => setPasswordActual(e.target.value)}
  />
  <button
    type="button"
    className="btn-ojo"
    onClick={() => setMostrarPasswordActual(prev => !prev)}
  >
    {mostrarPasswordActual ? '🙈' : '👁️'}
  </button>
</div>

<div className="input-password-wrapper">
  <input
    type={mostrarPasswordNueva ? 'text' : 'password'}
    placeholder="Nueva contraseña"
    value={passwordNueva}
    onChange={e => setPasswordNueva(e.target.value)}
  />
  <button
    type="button"
    className="btn-ojo"
    onClick={() => setMostrarPasswordNueva(prev => !prev)}
  >
    {mostrarPasswordNueva ? '🙈' : '👁️'}
  </button>
</div>

          <button className="btn-password" onClick={cambiarPassword}>🔐 Cambiar contraseña</button>
        </div>
      </div>
    </>
  );
};

export default EditarPerfilPage;
