// src/pages/EditarPerfilPage.tsx
import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import { API_URL } from '../config';
import { useNavigate } from 'react-router-dom';
import './EditarPerfilPage.css';
import { Toast } from '@capacitor/toast';

type Usuario = {
  id?: number;
  nombre: string;
  email?: string;
  localidad: string;
  sexo: '' | 'masculino' | 'femenino';
  edad: string | number;

  fotoPerfil?: string;

  // === Datos opcionales (MOSTRABLES) ===
  fechaNacimiento?: string;     // yyyy-mm-dd
  lugarNacimiento?: string;
  nacionalidad?: string;
  estadoCivil?: string;
  dondeVivo?: string;
  profesion?: string;
  empleo?: string;
  religion?: string;
  musicaFavorita?: string;
  institucion?: string;

  // === Flags de visibilidad (básicos) ===
  // nombre se deja siempre visible (sin checkbox)
  mostrar_edad?: boolean;
  mostrar_sexo?: boolean;
  mostrar_localidad?: boolean;

  // === Flags de visibilidad (opcionales) ===
  mostrar_fechaNacimiento?: boolean;
  mostrar_lugarNacimiento?: boolean;
  mostrar_nacionalidad?: boolean;
  mostrar_estadoCivil?: boolean;
  mostrar_dondeVivo?: boolean;
  mostrar_profesion?: boolean;
  mostrar_empleo?: boolean;
  mostrar_religion?: boolean;
  mostrar_musicaFavorita?: boolean;
  mostrar_institucion?: boolean;
};

const EditarPerfilPage: React.FC = () => {
  const navigate = useNavigate();
  const usuarioId = localStorage.getItem('usuarioId');

  const [usuario, setUsuario] = useState<Usuario>({
    nombre: '',
    localidad: '',
    sexo: '',
    edad: '',
  });

  const [passwordActual, setPasswordActual] = useState('');
  const [passwordNueva, setPasswordNueva] = useState('');
  const [mostrarPasswordActual, setMostrarPasswordActual] = useState(false);
  const [mostrarPasswordNueva, setMostrarPasswordNueva] = useState(false);

  const [nuevaFotoPerfil, setNuevaFotoPerfil] = useState<File | null>(null);
  const [cargandoFoto, setCargandoFoto] = useState(false);

useEffect(() => {
  if (!usuarioId) return;

  (async () => {
    try {
      const res = await fetch(`${API_URL}/api/usuarios/${usuarioId}/perfil-completo`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!res.ok) {
        const msg = await res.text();
        console.error('❌ Perfil-completo no OK:', res.status, msg);
        await Toast.show({ text: 'No se pudo cargar el perfil (auth)', duration: 'short' });
        return;
      }

      const data: Usuario = await res.json();
      setUsuario(prev => ({ ...prev, ...data }));
    } catch (err) {
      console.error('❌ Error cargando usuario', err);
    }
  })();
}, [usuarioId]);

  const onChange = (campo: keyof Usuario, valor: any) =>
    setUsuario(prev => ({ ...prev, [campo]: valor }));

  const onToggle = (campo: keyof Usuario) =>
    setUsuario(prev => ({ ...prev, [campo]: !(prev as any)[campo] }));

  const guardarCambios = async () => {
    try {
      setCargandoFoto(true);
      const formData = new FormData();

      // básicos (valores)
      formData.append('nombre', String(usuario.nombre || ''));
      formData.append('localidad', String(usuario.localidad || ''));
      formData.append('sexo', String(usuario.sexo || ''));
      formData.append('edad', String(usuario.edad || ''));

      // opcionales (valores)
      const camposOpcionales: (keyof Usuario)[] = [
        'fechaNacimiento','lugarNacimiento','nacionalidad','estadoCivil',
        'dondeVivo','profesion','empleo','religion','musicaFavorita','institucion'
      ];
      camposOpcionales.forEach(c => {
        if ((usuario as any)[c] !== undefined && (usuario as any)[c] !== null) {
          formData.append(String(c), String((usuario as any)[c] ?? ''));
        }
      });

      // visibilidad (básicos + opcionales)
      const camposMostrar: (keyof Usuario)[] = [
        'mostrar_edad','mostrar_sexo','mostrar_localidad',
        'mostrar_fechaNacimiento','mostrar_lugarNacimiento','mostrar_nacionalidad',
        'mostrar_estadoCivil','mostrar_dondeVivo','mostrar_profesion','mostrar_empleo',
        'mostrar_religion','mostrar_musicaFavorita','mostrar_institucion'
      ];
      camposMostrar.forEach(c => {
        formData.append(String(c), String(!!(usuario as any)[c])); // "true"/"false"
      });

      if (nuevaFotoPerfil) formData.append('fotoPerfil', nuevaFotoPerfil);

      const res = await fetch(`${API_URL}/api/usuarios/${usuarioId}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: formData,
      });

      if (res.ok) {
        await Toast.show({ text: '✅ Perfil actualizado', duration: 'short' });
        navigate('/perfil');
      } else {
        await Toast.show({ text: '❌ Error al guardar', duration: 'short' });
      }
    } catch (error) {
      console.error(error);
      await Toast.show({ text: '❌ Error al actualizar perfil', duration: 'short' });
    } finally {
      setCargandoFoto(false);
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
        setPasswordActual(''); setPasswordNueva('');
      } else {
        await Toast.show({ text: '❌ Error al cambiar la contraseña', duration: 'short' });
      }
    } catch {
      await Toast.show({ text: '❌ Error al cambiar la contraseña', duration: 'short' });
    }
  };

  return (
    <>
      <Navbar />
      <div className="editar-perfil-container">
        <h2>Editar Perfil</h2>

        <div className="foto-perfil-wrapper">
          <img
            src={nuevaFotoPerfil ? URL.createObjectURL(nuevaFotoPerfil)
                : usuario.fotoPerfil || 'https://via.placeholder.com/120'}
            alt="Foto de perfil"
            className="foto-perfil"
          />
          <label htmlFor="fotoPerfilInput" className="label-archivo">📷 Cambiar foto de perfil</label>
          <input
            id="fotoPerfilInput"
            type="file"
            accept="image/*"
            onChange={(e) => setNuevaFotoPerfil(e.target.files?.[0] || null)}
            className="input-archivo"
          />
        </div>

<button
  className="btn-ubicacion"
  onClick={async () => {
    try {
      const permiso = await (navigator as any).permissions?.query({ name: 'geolocation' as any });
      if (permiso?.state === 'denied') {
        await Toast.show({ text: '🚫 Tenés que permitir el acceso a tu ubicación en el navegador.', duration: 'short' });
        return;
      }

      const posicion = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000
        });
      });

      const { latitude, longitude } = posicion.coords;

      const res = await fetch(`${API_URL}/api/usuarios/${usuarioId}/ubicacion`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ latitud: latitude, longitud: longitude }),
      });

      if (res.ok) {
        await Toast.show({ text: '📍 Ubicación actualizada. Vas a recibir partidos cerca.', duration: 'short' });
      } else {
        await Toast.show({ text: '❌ No se pudo actualizar la ubicación', duration: 'short' });
      }
    } catch (err) {
      console.error(err);
      await Toast.show({ text: '❌ Error al obtener ubicación', duration: 'short' });
    }
  }}
>
  📡 Actualizar mi ubicación para recibir invitacion de partidos cercanos
</button>

        <div className="form-editar">
          {/* ── Básicos (con checkbox al lado cuando aplica) ── */}
          <h3 className="subtitulo">Datos básicos</h3>

          <div className="row-inline">
            <input type="text" placeholder="Nombre"
              value={usuario.nombre}
              onChange={e => onChange('nombre', e.target.value)} />
            {/* Nombre: sin toggle de visibilidad (si querés lo agregamos) */}
          </div>

          <div className="row-inline">
            <input type="text" placeholder="Localidad"
              value={usuario.localidad}
              onChange={e => onChange('localidad', e.target.value)} />
            <label className="chk-inline">
              <input type="checkbox"
                checked={!!usuario.mostrar_localidad}
                onChange={() => onToggle('mostrar_localidad')} />
              Mostrar
            </label>
          </div>

          <div className="row-inline">
            <select value={usuario.sexo} onChange={e => onChange('sexo', e.target.value)}>
              <option value="">Seleccionar sexo</option>
              <option value="masculino">Masculino</option>
              <option value="femenino">Femenino</option>
            </select>
            <label className="chk-inline">
              <input type="checkbox"
                checked={!!usuario.mostrar_sexo}
                onChange={() => onToggle('mostrar_sexo')} />
              Mostrar
            </label>
          </div>

          <div className="row-inline">
            <input type="number" placeholder="Edad"
              value={usuario.edad}
              onChange={e => onChange('edad', e.target.value)} />
            <label className="chk-inline">
              <input type="checkbox"
                checked={!!usuario.mostrar_edad}
                onChange={() => onToggle('mostrar_edad')} />
              Mostrar
            </label>
          </div>

          {/* ── Opcionales (cada campo con su checkbox al lado) ── */}
          <h3 className="subtitulo">Datos opcionales</h3>

          <div className="row-inline">
            <input type="date" placeholder="Fecha de nacimiento"
              value={usuario.fechaNacimiento || ''}
              onChange={e => onChange('fechaNacimiento', e.target.value)} />
            <label className="chk-inline">
              <input type="checkbox"
                checked={!!usuario.mostrar_fechaNacimiento}
                onChange={() => onToggle('mostrar_fechaNacimiento')} />
              Mostrar
            </label>
          </div>

          <div className="row-inline">
            <input type="text" placeholder="Lugar de nacimiento"
              value={usuario.lugarNacimiento || ''}
              onChange={e => onChange('lugarNacimiento', e.target.value)} />
            <label className="chk-inline">
              <input type="checkbox"
                checked={!!usuario.mostrar_lugarNacimiento}
                onChange={() => onToggle('mostrar_lugarNacimiento')} />
              Mostrar
            </label>
          </div>

          <div className="row-inline">
            <input type="text" placeholder="Nacionalidad"
              value={usuario.nacionalidad || ''}
              onChange={e => onChange('nacionalidad', e.target.value)} />
            <label className="chk-inline">
              <input type="checkbox"
                checked={!!usuario.mostrar_nacionalidad}
                onChange={() => onToggle('mostrar_nacionalidad')} />
              Mostrar
            </label>
          </div>

          <div className="row-inline">
            <input type="text" placeholder="Estado civil"
              value={usuario.estadoCivil || ''}
              onChange={e => onChange('estadoCivil', e.target.value)} />
            <label className="chk-inline">
              <input type="checkbox"
                checked={!!usuario.mostrar_estadoCivil}
                onChange={() => onToggle('mostrar_estadoCivil')} />
              Mostrar
            </label>
          </div>

          <div className="row-inline">
            <input type="text" placeholder="Dónde vivo"
              value={usuario.dondeVivo || ''}
              onChange={e => onChange('dondeVivo', e.target.value)} />
            <label className="chk-inline">
              <input type="checkbox"
                checked={!!usuario.mostrar_dondeVivo}
                onChange={() => onToggle('mostrar_dondeVivo')} />
              Mostrar
            </label>
          </div>

          <div className="row-inline">
            <input type="text" placeholder="Profesión"
              value={usuario.profesion || ''}
              onChange={e => onChange('profesion', e.target.value)} />
            <label className="chk-inline">
              <input type="checkbox"
                checked={!!usuario.mostrar_profesion}
                onChange={() => onToggle('mostrar_profesion')} />
              Mostrar
            </label>
          </div>

          <div className="row-inline">
            <input type="text" placeholder="Empleo"
              value={usuario.empleo || ''}
              onChange={e => onChange('empleo', e.target.value)} />
            <label className="chk-inline">
              <input type="checkbox"
                checked={!!usuario.mostrar_empleo}
                onChange={() => onToggle('mostrar_empleo')} />
              Mostrar
            </label>
          </div>

          <div className="row-inline">
            <input type="text" placeholder="Religión"
              value={usuario.religion || ''}
              onChange={e => onChange('religion', e.target.value)} />
            <label className="chk-inline">
              <input type="checkbox"
                checked={!!usuario.mostrar_religion}
                onChange={() => onToggle('mostrar_religion')} />
              Mostrar
            </label>
          </div>

          <div className="row-inline">
            <input type="text" placeholder="Música favorita"
              value={usuario.musicaFavorita || ''}
              onChange={e => onChange('musicaFavorita', e.target.value)} />
            <label className="chk-inline">
              <input type="checkbox"
                checked={!!usuario.mostrar_musicaFavorita}
                onChange={() => onToggle('mostrar_musicaFavorita')} />
              Mostrar
            </label>
          </div>

          <div className="row-inline">
            <input type="text" placeholder="Institución / Universidad"
              value={usuario.institucion || ''}
              onChange={e => onChange('institucion', e.target.value)} />
            <label className="chk-inline">
              <input type="checkbox"
                checked={!!usuario.mostrar_institucion}
                onChange={() => onToggle('mostrar_institucion')} />
              Mostrar
            </label>
          </div>

          {/* loader foto */}
          {cargandoFoto && <p style={{ color: '#555', textAlign: 'center' }}>🕐 Subiendo foto, por favor esperá...</p>}

          <button className="btn-guardar" onClick={guardarCambios}>💾 Guardar cambios</button>

          <h3>Cambiar contraseña</h3>

          <div className="input-password-wrapper">
            <input
              type={mostrarPasswordActual ? 'text' : 'password'}
              placeholder="Contraseña actual"
              value={passwordActual}
              onChange={e => setPasswordActual(e.target.value)}
            />
            <button type="button" className="btn-ojo" onClick={() => setMostrarPasswordActual(p => !p)}>
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
            <button type="button" className="btn-ojo" onClick={() => setMostrarPasswordNueva(p => !p)}>
              {mostrarPasswordNueva ? '🙈' : '👁️'}
            </button>
          </div>

          <button className="btn-guardar" onClick={cambiarPassword}>🔐 Cambiar contraseña</button>
        </div>
      </div>
    </>
  );
};

export default EditarPerfilPage;
