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

const BottomNavbar: React.FC<BottomNavbarProps> = ({  }) => {
  const navigate = useNavigate();
  const usuarioId = localStorage.getItem('usuarioId');
  const [mostrarModal, setMostrarModal] = useState(false);
  const [solicitudes, setSolicitudes] = useState<any[]>([]);
  const [, setNuevasPublicaciones] = useState(0);
 
  const [notificacionesNoLeidas, setNotificacionesNoLeidas] = useState(0);

  const [notificaciones, setNotificaciones] = useState<any[]>([]);
// 👇 Esto va arriba del componente
const notificacionesMostradas = new Set<number>();


  const obtenerNotificaciones = async () => {
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
 useEffect(() => {
  const handleEsc = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      setMostrarModal(false);
    }
  };
  window.addEventListener('keydown', handleEsc);
  return () => window.removeEventListener('keydown', handleEsc);
}, []);

useEffect(() => {
  if (!usuarioId) return;

  socket.emit('join', `usuario-${usuarioId}`);

const manejarNotificacion = async (nueva: any) => {
  if (notificacionesMostradas.has(nueva.id)) return; // ✅ Ya mostramos esta
  notificacionesMostradas.add(nueva.id);

  console.log('🔔 Notificación recibida:', nueva);
  toast.info(nueva.mensaje);

  // 🔄 Actualizar notificaciones
  try {
    const res = await fetch(`${API_URL}/api/envio-notificaciones/${usuarioId}`);
    const data = await res.json();
    setNotificaciones(data);
    const noLeidas = data.filter((n: any) => !n.leida).length;
    setNotificacionesNoLeidas(noLeidas);
  } catch (err) {
    console.error('❌ Error al actualizar notificaciones:', err);
  }

  // 📥 Si es una solicitud de amistad nueva, actualizar solicitudes también
  if (['solicitud', 'amistad'].includes(nueva.tipo)) {
    try {
      const res = await fetch(`${API_URL}/api/amigos/solicitudes/${usuarioId}`);
      const data = await res.json();
      setSolicitudes(data);
    } catch (err) {
      console.error('❌ Error al actualizar solicitudes de amistad:', err);
    }
  }
};


  socket.on('nuevaNotificacion', manejarNotificacion);

  return () => {
    socket.off('nuevaNotificacion', manejarNotificacion);
  };
}, [usuarioId]);



useEffect(() => {
  if (!usuarioId) return;

  const obtenerNuevas = async () => {
    try {
      const res = await fetch(`${API_URL}/api/publicaciones/nuevas/${usuarioId}`);
      const data = await res.json();
      console.log(data)
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
  if (!mostrarModal) {
    obtenerSolicitudes();
    obtenerNotificaciones(); // ✅ ahora también carga notificaciones viejas
  }
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
        
        </button>

        <button onClick={toggleModal} className="bottom-button">
          <FaUserFriends />
          <span>Amigos</span>
       {(solicitudes.length > 0 || notificacionesNoLeidas > 0) && (
  <span className="badge-bottom">
    {solicitudes.length + notificacionesNoLeidas}
  </span>
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
         <div key={n.id} className={`solicitud-item ${n.leida ? 'leida' : 'no-leida'}`}>

           <img
src={n.emisor?.fotoPerfil || '/default-profile.png'}

  alt="perfil"
  className="foto-solicitud"
  onClick={async () => {
    try {
      await fetch(`${API_URL}/api/envio-notificaciones/marcar-leida/${n.id}`, {
        method: 'PATCH',
      });
      setNotificaciones(prev =>
  prev.map(notif =>
    notif.id === n.id ? { ...notif, leida: true } : notif
  )
);
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
{n.tipo === 'solicitud' ? (
  !n.aceptada ? (
    <>
      <button
        onClick={async () => {
          await fetch(`${API_URL}/api/envio-notificaciones/marcar-leida/${n.id}`, {
            method: 'PATCH',
          });

          await aceptarSolicitud(n.usuarioId, n.emisorId);

       setNotificaciones((prev) =>
  prev.filter((notif) => notif.id !== n.id)
);


          toast.success('✅ ¡Ahora son amigos!');
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

         setNotificaciones((prev) =>
  prev.filter((notif) => notif.id !== n.id)
);

        }}
      >
        ❌
      </button>
    </>
  ) : (
    <span className="estado-amigo">✅ Ya son amigos</span>
  )
) : null}

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
