import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { API_URL } from '../config';
import './BuscarUsuariosPage.css';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

let debounceTimeout: NodeJS.Timeout;

const BuscarUsuariosPage: React.FC = () => {
  const navigate = useNavigate();
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [nombre, setNombre] = useState('');
  const [deporte, setDeporte] = useState('');
  const [localidad, setLocalidad] = useState('');
  const [latitud, setLatitud] = useState<number | null>(null);
  const [longitud, setLongitud] = useState<number | null>(null);
  const [pagina, setPagina] = useState(1);
  const [mostrarSoloAmigos, setMostrarSoloAmigos] = useState(false);
  const [amistades, setAmistades] = useState<number[]>([]);
  const [pendientes, setPendientes] = useState<number[]>([]);
  const [, setRecibidas] = useState<any[]>([]);
  const [, setCargando] = useState(false);

  const usuarioActualId = localStorage.getItem('usuarioId');

  const buscarUsuarios = async () => {
    const query = new URLSearchParams();
    if (nombre) query.append('nombre', nombre);
    if (deporte) query.append('deporte', deporte);
    if (localidad) query.append('localidad', localidad);
    if (latitud !== null) query.append('latitud', latitud.toString());
    if (longitud !== null) query.append('longitud', longitud.toString());
    if (usuarioActualId) query.append('usuarioId', usuarioActualId);
    query.append('pagina', pagina.toString());
    if (mostrarSoloAmigos) query.append('soloAmigos', 'true');

    try {
      setCargando(true);
      const res = await fetch(`${API_URL}/api/usuarios/buscar?${query.toString()}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setUsuarios(data);
      } else {
        setUsuarios([]);
      }
    } catch (error) {
      toast.error('❌ Error al buscar usuarios');
    } finally {
      setCargando(false);
    }
  };

  const obtenerAmigosYPendientes = async () => {
    if (!usuarioActualId) return;

    const resAmigos = await fetch(`${API_URL}/api/amistad/lista/${usuarioActualId}`);
    const amigosData = await resAmigos.json();
    const amigosIds = amigosData.map((a: any) => a.id);
    setAmistades(amigosIds);

    const resPendientes = await fetch(`${API_URL}/api/amistad/pendientes/${usuarioActualId}`);
    const pendientesData = await resPendientes.json();
    const pendientesIds = pendientesData.map((p: any) => p.id);

    setPendientes(pendientesIds);
  };

  const obtenerSolicitudesRecibidas = async () => {
    if (!usuarioActualId) return;
    try {
      const res = await fetch(`${API_URL}/api/amistad/recibidas/${usuarioActualId}`);
      const data = await res.json();
      setRecibidas(data);
    } catch (error) {
      console.error('❌ Error al obtener solicitudes recibidas:', error);
    }
  };

  const enviarSolicitud = async (receptorId: number) => {
    try {
      const res = await fetch(`${API_URL}/api/amistad/solicitar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuarioId: usuarioActualId, amigoId: receptorId }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('✅ Solicitud enviada');
        setPendientes([...pendientes, receptorId]);
      } else {
        toast.info(`⚠️ ${data.error}`);
      }
    } catch {
      toast.error('❌ Error al enviar solicitud');
    }
  };

  const cancelarSolicitud = async (amigoId: number) => {
    try {
      const res = await fetch(`${API_URL}/api/amistad/${usuarioActualId}/${amigoId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        toast.success('❌ Solicitud cancelada');
        setPendientes(pendientes.filter(id => id !== amigoId));
      }
    } catch {
      toast.error('❌ Error al cancelar solicitud');
    }
  };


  const eliminarAmigo = async (amigoId: number) => {
    try {
      const res = await fetch(`${API_URL}/api/amistad/${usuarioActualId}/${amigoId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        toast.success('🗑️ Amigo eliminado');
        setAmistades(amistades.filter(id => id !== amigoId));
      }
    } catch {
      toast.error('❌ Error al eliminar amigo');
    }
  };

  const iniciarChat = (receptorId: number) => {
    console.log("??????????????")
     console.log(receptorId)
    navigate(`/chat/${receptorId}`);
  };

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      pos => {
        setLatitud(pos.coords.latitude);
        setLongitud(pos.coords.longitude);
      },
      err => console.warn(err)
    );
  }, []);

  useEffect(() => {
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => buscarUsuarios(), 500);
    return () => clearTimeout(debounceTimeout);
  }, [nombre, deporte, localidad, latitud, longitud, pagina, mostrarSoloAmigos]);

  useEffect(() => {
    obtenerAmigosYPendientes();
    obtenerSolicitudesRecibidas();
  }, []);

  return (
    <>
      <Navbar />
      <ToastContainer position="top-center" autoClose={2000} />
      <div className="perfil-container">
        <h2>🔍 Buscar Usuarios</h2>

        <div className="filtros-busqueda">
          <input type="text" placeholder="Nombre" value={nombre} onChange={e => { setNombre(e.target.value); setPagina(1); }} />
          <input type="text" placeholder="Deporte" value={deporte} onChange={e => { setDeporte(e.target.value); setPagina(1); }} />
          <input type="text" placeholder="Localidad" value={localidad} onChange={e => { setLocalidad(e.target.value); setPagina(1); }} />
          <div className="toggle-container">
            <span>👥 Solo amigos</span>
            <label className="switch">
              <input type="checkbox" checked={mostrarSoloAmigos} onChange={() => setMostrarSoloAmigos(prev => !prev)} />
              <span className="slider round"></span>
            </label>
          </div>
        </div>

        <div className="resultados-busqueda">
          {usuarios.map((usuario, idx) => {
            const fotoSrc = usuario.fotoPerfil || '/default-profile.png';

            const esAmigo = amistades.includes(usuario.id);
            const solicitudEnviada = pendientes.includes(usuario.id);

            return (
              <div key={idx} className="usuario-card">
                <img src={fotoSrc} className="foto-usuario" onClick={() => navigate(`/perfil/${usuario.id}`)} />
                <div>
                  <h4>{usuario.nombre}</h4>
                  <p>📍 {usuario.localidad}</p>
                  <p>🏅 {usuario.deportes?.join(', ')}</p>
                  <div className="acciones-usuario">
                    {esAmigo ? (
                      <button onClick={() => eliminarAmigo(usuario.id)} title="Eliminar amigo">🗑️</button>
                    ) : solicitudEnviada ? (
                      <button onClick={() => cancelarSolicitud(usuario.id)} title="Cancelar solicitud">🚫</button>
                    ) : (
                      <button onClick={() => enviarSolicitud(usuario.id)} title="Enviar solicitud">➕</button>
                    )}

                    {esAmigo ? (
                     
                      <button onClick={() => iniciarChat(usuario.id)} title="Enviar mensaje">💬</button>
                    ) : (
                      <button disabled title="Solo puedes chatear con amigos">🔒</button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="paginacion">
          {pagina > 1 && <button onClick={() => setPagina(p => p - 1)}>⬅️ Anterior</button>}
          {usuarios.length === 5 && <button onClick={() => setPagina(p => p + 1)}>Siguiente ➡️</button>}
        </div>
      </div>
    </>
  );
};

export default BuscarUsuariosPage;