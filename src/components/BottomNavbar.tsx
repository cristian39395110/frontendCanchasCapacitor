import React, {  useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaHome, FaSearch, FaUserFriends } from 'react-icons/fa';
import { API_URL } from '../config';
import './BottomNavbar.css';

interface BottomNavbarProps {
  mensajesNoLeidos: number;
  invitaciones: number;
}

const BottomNavbar: React.FC<BottomNavbarProps> = ({ mensajesNoLeidos, invitaciones }) => {
  const navigate = useNavigate();
  const usuarioId = localStorage.getItem('usuarioId');
  const [mostrarModal, setMostrarModal] = useState(false);
  const [solicitudes, setSolicitudes] = useState<any[]>([]);

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
        <div className="modal-solicitudes">
          <h4>👥 Solicitudes</h4>
          {solicitudes.length === 0 ? (
            <p>No tenés nuevas solicitudes</p>
          ) : (
            solicitudes.map((s) => (
              <div key={s.id} className="solicitud-item">
                <img
                  src={
                    s.fotoPerfil
                      ? `${API_URL}/uploads/${s.fotoPerfil}`
                      : '/default-profile.png'
                  }
                  alt="perfil"
                  className="foto-solicitud"
                  onError={(e) => {
                    const img = e.target as HTMLImageElement;
                    img.src = '/default-profile.png';
                  }}
                />
                <span className="nombre-solicitante">{s.emisorNombre}</span>
                <div className="acciones-mini">
<button onClick={() => aceptarSolicitud(s.usuarioId, s.amigoId)}>✅</button>
<button onClick={() => cancelarSolicitud(s.usuarioId, s.amigoId)}>❌</button>




                </div>
              </div>
            ))
          )}
        </div>
      )}
    </>
  );
};

export default BottomNavbar;
