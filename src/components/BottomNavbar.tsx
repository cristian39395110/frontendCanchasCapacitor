import React, {  useState,useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaHome, FaSearch, FaUserFriends } from 'react-icons/fa';
import { API_URL } from '../config';
import './BottomNavbar.css';
  import { socket } from '../utils/socket'; // o la ruta correcta
  import { toast } from 'react-toastify';

interface BottomNavbarProps {
  mensajesNoLeidos: number;
  invitaciones: number;
}

const BottomNavbar: React.FC<BottomNavbarProps> = ({ mensajesNoLeidos, invitaciones }) => {
  const navigate = useNavigate();
  const usuarioId = localStorage.getItem('usuarioId');
  const [mostrarModal, setMostrarModal] = useState(false);
  const [solicitudes, setSolicitudes] = useState<any[]>([]);
  const [, setNuevasPublicaciones] = useState(0);
  const [, setNotificacionesNoLeidas] = useState(0);
  const [notificaciones, setNotificaciones] = useState<any[]>([]);


useEffect(() => {
  if (!usuarioId) return;

  socket.emit('join', `usuario-${usuarioId}`);

  socket.on('nuevaNotificacion', (nueva) => {
    console.log('🔔 Notificación recibida por socket:', nueva);

    setNotificaciones((prev) => [nueva, ...prev]);
    setNotificacionesNoLeidas((prev) => prev + 1);
    toast.info(nueva.mensaje);
  });

  return () => {
    socket.off('nuevaNotificacion');
  };
}, [usuarioId]);


useEffect(() => {
  if (!usuarioId) return;

  const fetchNotificaciones = async () => {
    try {
      const res = await fetch(`${API_URL}/api/envio-notificaciones/${usuarioId}`);
      const data = await res.json();
      setNotificaciones(data);

      const noLeidas = data.filter((n: any) => !n.leida).length;
      setNotificacionesNoLeidas(noLeidas);
    } catch (err) {
      console.error('❌ Error al obtener notificaciones:', err);
    }
  };

  fetchNotificaciones();
  const intervalo = setInterval(fetchNotificaciones, 15000);
  return () => clearInterval(intervalo);
}, [usuarioId]);



useEffect(() => {
  if (!usuarioId) return;

  const obtenerNuevas = async () => {
    try {
      const res = await fetch(`${API_URL}/api/publicaciones/nuevas/${usuarioId}`);
      const data = await res.json();
      setNuevasPublicaciones(data.nuevas || 0);
    } catch (err) {
      console.error('❌ Error al obtener nuevas publicaciones', err);
    }
  };

  obtenerNuevas();
  const intervalo = setInterval(obtenerNuevas, 15000);
  return () => clearInterval(intervalo);
}, [usuarioId]);


  const obtenerSolicitudes = async () => {
    try {
      const res = await fetch(`${API_URL}/api/amigos/solicitudes/${usuarioId}`);
      
      const data = await res.json();
          console.log('📥 Solicitudes recibidas:', data); 
      setSolicitudes(data);
    } catch (error) {
      console.error('❌ Error al obtener solicitudes', error);
    }
  };

const aceptarSolicitud = async (usuarioId: number, amigoId: number) => {
  await fetch(`${API_URL}/api/amigos/aceptar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usuarioId, amigoId }),
  });
  setSolicitudes(solicitudes.filter(s => s.usuarioId !== usuarioId || s.amigoId !== amigoId));
};


const cancelarSolicitud = async (usuarioId: number, amigoId: number) => {
  try {
    await fetch(`${API_URL}/api/amigos/cancelar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ usuarioId, amigoId }),
    });
     setSolicitudes(solicitudes.filter(s => s.usuarioId !== usuarioId || s.amigoId !== amigoId));
  } catch (error) {
    console.error('❌ Error al cancelar solicitud:', error);
  }
};


  const toggleModal = () => {
    if (!mostrarModal) obtenerSolicitudes();
    setMostrarModal(!mostrarModal);
  };

  return (
    <>
      <div className="bottom-navbar">
        <button onClick={() => navigate('/muro')} className="bottom-button">
          <FaHome />
          <span>Inicio</span>
        </button>

        <button onClick={() => navigate('/BuscarUsuario')} className="bottom-button">
          <FaSearch />
          <span>Buscar</span>
          {(mensajesNoLeidos > 0 || invitaciones > 0) && (
            <span className="badge-bottom">
              {mensajesNoLeidos + invitaciones}
            </span>
          )}
        </button>

        <button onClick={toggleModal} className="bottom-button">
          <FaUserFriends />
          <span>Amigos</span>
          {solicitudes.length > 0 && (
            <span className="badge-bottom">{solicitudes.length}</span>
          )}
        </button>
      </div>

{mostrarModal && (
  <>
    <div className="overlay-modal" onClick={() => setMostrarModal(false)}></div>

    <div className="modal-solicitudes" onClick={(e) => e.stopPropagation()}>
      <h4>🔔 Notificaciones</h4>
      {notificaciones.length === 0 ? (
        <p>No tenés nuevas notificaciones</p>
      ) : (
        notificaciones.map((n) => (
          <div key={n.id} className="solicitud-item">
           <img
  src={n.foto ? n.foto : '/default-profile.png'}
  alt="perfil"
  className="foto-solicitud"
  onClick={async () => {
    try {
      await fetch(`${API_URL}/api/envio-notificaciones/marcar-leida/${n.id}`, {
        method: 'PATCH',
      });
      navigate(`/perfil/${n.emisorId}`);
      setMostrarModal(false);
    } catch (err) {
      console.error('❌ Error al marcar como leída:', err);
    }
  }}
  onError={(e) => {
    const img = e.target as HTMLImageElement;
    img.src = '/default-profile.png';
  }}
/>


            <span className="nombre-solicitante">{n.mensaje}</span>

            <div className="acciones-mini">
              {n.tipo === 'solicitud' && (
                <>
                  <button
                    onClick={async () => {
                      await fetch(`${API_URL}/api/envio-notificaciones/marcar-leida/${n.id}`, {
                        method: 'PATCH',
                      });
                      await aceptarSolicitud(n.usuarioId, n.emisorId);
                    }}
                  >
                    ✅
                  </button>
                  <button
                    onClick={async () => {
                      await fetch(`${API_URL}/api/envio-notificaciones/marcar-leida/${n.id}`, {
                        method: 'PATCH',
                      });
                      await cancelarSolicitud(n.usuarioId, n.emisorId);
                    }}
                  >
                    ❌
                  </button>
                </>
              )}

              {(n.tipo === 'comentario' || n.tipo === 'like') && (
                <button
                  onClick={async () => {
                    try {
                      await fetch(`${API_URL}/api/envio-notificaciones/marcar-leida/${n.id}`, {
                        method: 'PATCH',
                      });
                      setMostrarModal(false);
                      navigate(`/publicacion/${n.publicacionId}`);
                    } catch (err) {
                      console.error('❌ Error al redirigir a publicación:', err);
                    }
                  }}
                >
                  Ver
                </button>
              )}

              {n.tipo === 'amistad' && (
                <button
                  onClick={async () => {
                    try {
                      await fetch(`${API_URL}/api/envio-notificaciones/marcar-leida/${n.id}`, {
                        method: 'PATCH',
                      });
                      navigate(`/perfil/${n.emisorId}`);
                      setMostrarModal(false);
                    } catch (err) {
                      console.error('❌ Error al redirigir a perfil:', err);
                    }
                  }}
                >
                  Ver perfil
                </button>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  </>
)}



    </>
  );
};

export default BottomNavbar;
