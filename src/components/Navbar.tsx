import React, { useEffect, useState ,useRef} from 'react';
import type { JSX } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../config';
import { suscribirseANotificaciones, desuscribirseANotificaciones } from '../utils/notificaciones';
import { io } from 'socket.io-client';
import './Navbar.css';
import logoMatchClub from '../assets/ChatGPT Image 20 jul 2025, 13_34_06.png'; // ajustá el path si está en otra carpeta



import {
  FaFutbol, FaPlus, FaSearch, FaComments, FaBell, FaBellSlash,
  FaSignOutAlt, FaBars, FaEnvelopeOpenText, FaKey, FaAt,FaThLarge,FaBullhorn 
} from 'react-icons/fa';
import { Preferences } from '@capacitor/preferences';
const socket = io(API_URL);

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const [suscrito, setSuscrito] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [invitaciones, setInvitaciones] = useState(0);
  const [mensajesNoLeidos, setMensajesNoLeidos] = useState(0);
  const [mostrarMenu, setMostrarMenu] = useState(false);
  const usuarioId = localStorage.getItem('usuarioId');
  const [aceptaciones] = useState(0);
  const [esAdmin, setEsAdmin] = useState(false);
  const [esId11 , setEsId11] = useState(false);
  const [mostrarModalPublicidad, setMostrarModalPublicidad] = useState(false);
  const [mostrarModalSoporte, setMostrarModalSoporte] = useState(false);


const [esPremium, setEsPremium] = useState(false);

useEffect(() => {
  const esPremiumLocal = localStorage.getItem('esPremium') === 'true';
  setEsPremium(esPremiumLocal);
}, []);


  




  useEffect(() => {
    if (!usuarioId) return;

 const token = localStorage.getItem('token');
if (token) {
  try {
    const decoded = JSON.parse(atob(token.split('.')[1]));
    if (decoded.id === 11) {
      setEsId11(true); // ✅ para el botón "Nuevo"
    }
    if (decoded.esAdmin === true) {
      setEsAdmin(true); // ✅ para mostrar "Cargar Cancha"
    }
  } catch (err) {
    console.error('❌ Error al leer token', err);
  }
}

    

   fetch(`${API_URL}/api/notificaciones/${usuarioId}`)
  .then(res => res.json())
  .then(async (data) => {
    setSuscrito(data.suscrito);
    setCargando(false);

    // 🚨 Verificamos si ya forzamos notificaciones antes
    const yaForzado = localStorage.getItem(`notificacionesForzadas_${usuarioId}`);

    // ✅ Si no estaba suscripto y nunca se forzó, lo suscribimos automáticamente una sola vez
    if (!data.suscrito && !yaForzado) {
      try {
        await suscribirseANotificaciones(Number(usuarioId));
        setSuscrito(true);
        localStorage.setItem(`notificacionesForzadas_${usuarioId}`, 'true');
        console.log('✅ Notificaciones activadas automáticamente la primera vez');
      } catch (err) {
        console.error('❌ Error al activar notificaciones automáticamente', err);
      }
    }
  })
  .catch(() => setCargando(false));


/*fetch(`${API_URL}/api/solicitudes/aceptadas/${usuarioId}`)
  .then(res => res.json())
  .then(data => setAceptaciones(data.length));
*/

  fetch(`${API_URL}/api/solicitudes/${usuarioId}?estado=pendiente`)
      .then(res => res.json())
      .then(data => setInvitaciones(data.length));

    fetch(`${API_URL}/api/mensajes/no-leidos/${usuarioId}`)
      .then(res => res.json())
      .then(data => setMensajesNoLeidos(data.total));
  }, [usuarioId]);

  const IconButton = ({ onClick, icon, label }: { onClick: () => void; icon: JSX.Element; label: string }) => (
  <button className="icon-button" onClick={onClick} title={label}>
    {icon}
    {label.includes('Chat') && mensajesNoLeidos > 0 && (
      <span className="badge">{mensajesNoLeidos}</span>
    )}
    {label.includes('Invitaciones') && invitaciones > 0 && (
      <span className="badge">{invitaciones}</span>
    )}
    {label.includes('Aceptaciones') && aceptaciones > 0 && (
      <span className="badge">{aceptaciones}</span>
    )}
  </button>
);



  useEffect(() => {
    if (!usuarioId) return;

    socket.emit('join', usuarioId);

    socket.on('actualizar-notificaciones', (data: { receptorId: number }) => {
      if (Number(usuarioId) === data.receptorId) {
        fetch(`${API_URL}/api/solicitudes/${usuarioId}?estado=pendiente`)
          .then(res => res.json())
          .then(data => setInvitaciones(data.length));
      }
    });

    socket.on('mensajeNuevo', () => {
      fetch(`${API_URL}/api/mensajes/no-leidos/${usuarioId}`)
        .then(res => res.json())
        .then(data => setMensajesNoLeidos(data.total));
    });

    return () => {
      socket.off('actualizar-notificaciones');
      socket.off('mensajeNuevo');
    };
  }, [usuarioId]);

  const handleToggleNotificaciones = () => {
    if (!usuarioId) return alert('Iniciá sesión primero');
    const accion = suscrito ? desuscribirseANotificaciones : suscribirseANotificaciones;
    accion(Number(usuarioId))
      .then(() => {
        setSuscrito(!suscrito);
        alert(suscrito ? 'Desactivadas' : 'Activadas');
      });
  };



const handleLogout = async () => {
  try {
    // Borra datos persistentes en Android (Preferences)
    await Preferences.remove({ key: 'token' });
    await Preferences.remove({ key: 'usuarioId' });
    await Preferences.remove({ key: 'esPremium' });

    // Borra datos temporales en WebView
    localStorage.removeItem('token');
    localStorage.removeItem('usuarioId');
    localStorage.removeItem('esPremium');

    // Navega al login (ya tenés navigate declarado arriba del componente)
    navigate('/login');
  } catch (error) {
    console.error('❌ Error al cerrar sesión:', error);
  }
};



const menuRef = useRef<HTMLDivElement | null>(null);

useEffect(() => {
  const handleClickOutside = (event: MouseEvent) => {
    if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
      setMostrarMenu(false);
    }
  };

  if (mostrarMenu) {
    document.addEventListener('mousedown', handleClickOutside);
  } else {
    document.removeEventListener('mousedown', handleClickOutside);
  }

  return () => {
    document.removeEventListener('mousedown', handleClickOutside);
  };
}, [mostrarMenu]);



  return (
    <nav className="navbar">
 <div className="navbar-topbar">
   
       <h2 onClick={() => navigate('/dashboard')} className="navbar-title">
<img
  src={logoMatchClub}
  alt="MatchClub Logo"
  className="navbar-logo"
/>

        Deportes
      </h2>
      <FaBars className="menu-icon" onClick={() => setMostrarMenu(!mostrarMenu)} />
    </div>

      <div className="navbar-buttons">
  {esId11 && (
    <IconButton onClick={() => navigate('/juegonuevo')} icon={<FaPlus />} label="Nuevo" />
  )}
  <IconButton onClick={() => navigate('/buscar-jugadores')} icon={<FaSearch />} label="Buscar" />
  <IconButton onClick={() => navigate('/chat')} icon={<FaComments />} label="Chat" />
  <IconButton onClick={() => navigate('/aceptaciones')} icon={<FaFutbol  />} label="Aceptaciones" />
  <IconButton onClick={() => navigate('/invitaciones')} icon={<FaEnvelopeOpenText />} label="Invitaciones" />
  <IconButton onClick={() => navigate('/canchas')} icon={<FaThLarge />} label="Canchas" />
 

  {!cargando && (
   <IconButton
  onClick={handleToggleNotificaciones}
  icon={suscrito ? <FaBell /> : <FaBellSlash />} // ✅ corregido
  label={suscrito ? 'Desactivar' : 'Activar'}
/>
  )}
  <IconButton onClick={handleLogout} icon={<FaSignOutAlt />} label="Salir" />
</div>
{mostrarMenu && (
  <div className="menu" ref={menuRef}>
    <div className="menu-item" onClick={() => navigate('/EditarPerfilPage')}>
      <FaAt /> Modificar perfil
    </div>
    <div className="menu-item" onClick={() => navigate('/perfil')}>
      <FaKey /> Perfil
    </div>
    <div className="menu-item" onClick={() => navigate('/calificar-jugadores')}>
      <FaKey /> Calificar Jugadores
    </div>
    <div className="menu-item" onClick={() => setMostrarModalPublicidad(true)}>
      <FaBullhorn /> Publicitar mi cancha
    </div>

    <div className="menu-item" onClick={() => setMostrarModalSoporte(true)}>
  <FaEnvelopeOpenText /> Soporte técnico
</div>

    {esAdmin && (
      <div className="menu-item" onClick={() => navigate('/crear-cancha')}>
        <FaPlus /> Cargar Cancha
      </div>
    )}
  </div>
)}



{mostrarModalSoporte && (
  <div className="modal-overlay" onClick={() => setMostrarModalSoporte(false)}>
    <div className="modal-content" onClick={e => e.stopPropagation()}>
      <div className="modal-close" onClick={() => setMostrarModalSoporte(false)}>×</div>
      <div className="modal-publicitar">
        <h3>Soporte Técnico</h3>
        <p>¿Tenés alguna duda o problema con la app?</p>
        <a
          className="btn-contacto"
          href="mailto:lazartepia95@gmail.com?subject=Soporte%20MatchClub&body=Hola,%20necesito%20ayuda%20con%20la%20app%20MatchClub."
        >
          📧 Contactar por Gmail
        </a>
      </div>
    </div>
  </div>
)}

 {mostrarModalPublicidad && (
  <div className="modal-overlay" onClick={() => setMostrarModalPublicidad(false)}>
    <div className="modal-content" onClick={e => e.stopPropagation()}>
      <div className="modal-close" onClick={() => setMostrarModalPublicidad(false)}>×</div>
      <div className="modal-publicitar">
        <h3>Publicitá tu Cancha</h3>
        <p>¿Querés que tu cancha aparezca en la app y reciba más reservas? Contactanos.</p>
        <a
  className="btn-contacto"
  href="mailto:lazartepia95@gmail.com?subject=Publicidad%20Cancha%20en%20la%20App&body=Hola,%20quiero%20publicitar%20mi%20cancha%20en%20la%20app."
>
  📧 Enviar Email
</a>

       <button
  className="btn-contacto"
  onClick={() => {
    const numero = '5492664168649';
    const mensaje = encodeURIComponent('Hola! Quiero publicitar mi cancha en la app 🏟️📲');
    window.open(`https://wa.me/${numero}?text=${mensaje}`, '_blank');
  }}
>
  💬 WhatsApp
</button>
      </div>
    </div>
  </div>
)}

 {esPremium && (
  <div className="franja-premium">
    💎 Usuario Premium
  </div>
)}


    </nav>
   

  );
};

export default Navbar;
