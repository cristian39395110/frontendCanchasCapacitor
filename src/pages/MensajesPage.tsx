  // ✅ MensajesPage.tsx con soporte para chats individuales y grupales
  import React, { useEffect, useState, useRef } from 'react';
  import { API_URL } from '../config';
  import Navbar from '../components/Navbar';
  import { socket } from '../utils/socket';


  import './MensajesPage.css';

  interface Usuario {
    id: number;
    nombre: string;
    tieneNoLeidos?: boolean;
  }

  interface Mensaje {
    id: number;
    emisorId: number;
    receptorId: number;
    contenido: string;
    fecha: string;
    leido: boolean;
  }

  interface MensajePartido {
    id: number;
    usuarioId: number;
    partidoId: number;
    mensaje: string;
    createdAt: string;
  }

  interface PartidoChat {
    id: number;
    nombre: string;
  }

  const MensajesPage: React.FC = () => {
    const [mensajes, setMensajes] = useState<any[]>([]);
    const [texto, setTexto] = useState('');
    const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<Usuario | null>(null);
    const [usuarios, setUsuarios] = useState<Usuario[]>([]);
    const [partidos, setPartidos] = useState<PartidoChat[]>([]);
    const [partidoSeleccionadoId, setPartidoSeleccionadoId] = useState<number | null>(null);
    const [tipoChat, setTipoChat] = useState<'usuario' | 'partido' | null>(null);


    const usuarioId = localStorage.getItem('usuarioId');
    const mensajesRef = useRef<HTMLDivElement>(null);
    const [filtroNombre, setFiltroNombre] = useState('');
    const formatearFecha = (fechaISO: string): string => {
  const fecha = new Date(fechaISO);
  return fecha.toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};



    useEffect(() => {
    const input = document.querySelector('.chat-input input');
    if (!input) return;

    const focusInput = () => {
      setTimeout(() => {
        input.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }, 200);
    };

    input.addEventListener('focus', focusInput);
    return () => input.removeEventListener('focus', focusInput);
  }, []);



    useEffect(() => {
      if (usuarioId) {
        socket.emit('join', usuarioId);
      }
      return () => {
        socket.emit('leave', usuarioId);
      };
    }, [usuarioId]);

    useEffect(() => {
      if (mensajesRef.current) {
        mensajesRef.current.scrollTop = mensajesRef.current.scrollHeight;
      }
    }, [mensajes]);

    useEffect(() => {
      fetch(`${API_URL}/api/mensajes/chats/${usuarioId}`)
        .then(res => res.json())
        .then(data => setUsuarios(data));

      fetch(`${API_URL}/api/mensajes/partidos-confirmados/${usuarioId}`)
        .then(res => res.json())
        .then(data => setPartidos(data));
    }, [usuarioId]);

    const seleccionarUsuario = async (usuario: Usuario) => {
      setTipoChat('usuario');
      setUsuarioSeleccionado(usuario);
      setPartidoSeleccionadoId(null);
      const res = await fetch(`${API_URL}/api/mensajes/conversacion/${usuarioId}/${usuario.id}`);
      const data = await res.json();
      setMensajes(data);
      await fetch(`${API_URL}/api/mensajes/marcar-leido/${usuarioId}/${usuario.id}`, { method: 'PUT' });
    };

   const seleccionarPartido = async (partidoId: number, nombre: string) => {
  try {
    setTipoChat('partido');
    setUsuarioSeleccionado({ id: 0, nombre });
    setPartidoSeleccionadoId(partidoId);

    const res = await fetch(`${API_URL}/api/mensajes-partido/partido/${partidoId}`);

    if (!res.ok) {
      console.error('Error HTTP:', res.status);
      setMensajes([]);
      return;
    }

    const data = await res.json();
    if (!Array.isArray(data)) {
      console.error('❌ Respuesta inesperada del servidor:', data);
      setMensajes([]);
      return;
    }

    setMensajes(data);
  } catch (error) {
    console.error('❌ Error al seleccionar partido:', error);
    setMensajes([]);
  }
};


    const enviarMensaje = async () => {
      if (!texto.trim()) return;
      try {
        if (tipoChat === 'usuario' && usuarioSeleccionado) {
          const res = await fetch(`${API_URL}/api/mensajes/enviar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ emisorId: usuarioId, receptorId: usuarioSeleccionado.id, mensaje: texto })
          });
          const nuevo = await res.json();
          setMensajes(prev => [...prev, { ...nuevo, emisorId: Number(usuarioId) }]);
        } else if (tipoChat === 'partido' && partidoSeleccionadoId) {
          const res = await fetch(`${API_URL}/api/mensajes-partido/partido/enviar`, {

            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ partidoId: partidoSeleccionadoId, usuarioId, mensaje: texto })
          });
          const nuevo = await res.json();
          setMensajes(prev => [...prev, nuevo]);
        }
        setTexto('');
      } catch (err) {
        console.error(err);
      }
    };

    useEffect(() => {
      if (tipoChat === 'usuario') {
        socket.on('mensajeNuevo', (nuevo: Mensaje) => {
          if (usuarioSeleccionado &&
            (nuevo.emisorId === usuarioSeleccionado.id || nuevo.receptorId === usuarioSeleccionado.id)) {
            setMensajes(prev => [...prev, nuevo]);
          }
        });
      } else if (tipoChat === 'partido' && partidoSeleccionadoId) {
        socket.emit('join', `partido-${partidoSeleccionadoId}`);
        socket.on('nuevo-mensaje-partido', (nuevo: MensajePartido) => {
          if (nuevo.partidoId === partidoSeleccionadoId) {
            setMensajes(prev => [...prev, nuevo]);
          }
        });
      }
      return () => {
        socket.off('mensajeNuevo');
        socket.off('nuevo-mensaje-partido');
      };
    }, [usuarioSeleccionado, tipoChat, partidoSeleccionadoId]);

    return (
      <div>
        <Navbar />
        <div className="chat-container">
          <div className="sidebar">
            <input
              type="text"
              placeholder="Buscar..."
              value={filtroNombre}
              onChange={(e) => setFiltroNombre(e.target.value)}
              className="search-input"
            />

            <div style={{ marginBottom: '10px' }}>🔵 Chats individuales</div>
            {usuarios.filter(u => u.nombre.toLowerCase().includes(filtroNombre.toLowerCase())).map(u => (
              <div key={u.id} className={`user-chat ${usuarioSeleccionado?.id === u.id ? 'selected' : ''}`}
                onClick={() => seleccionarUsuario(u)}>
                <span>{u.nombre}</span>
                {u.tieneNoLeidos && <span className="unread-icon">📩</span>}
              </div>
            ))}

            <div style={{ marginTop: '15px' }}>⚽ Chats de partidos</div>
            {partidos.map(p => (
              <div key={p.id} className={`user-chat ${partidoSeleccionadoId === p.id ? 'selected' : ''}`}
                onClick={() => seleccionarPartido(p.id, p.nombre)}>
                <span>{p.nombre}</span>
              </div>
            ))}
          </div>

          <div className="chat-window">
            {usuarioSeleccionado ? (
              <>
                <div className="chat-header">{usuarioSeleccionado.nombre}</div>
                <div className="chat-messages" ref={mensajesRef}>
      {mensajes.map((msg, i) => {
  const esMio = tipoChat === 'usuario'
    ? msg.emisorId === Number(usuarioId)
    : msg.usuarioId === Number(usuarioId);

  const contenido = tipoChat === 'usuario' ? msg.contenido : msg.mensaje;

  return (
    <div key={i} className={`message-bubble ${esMio ? 'sent' : 'received'}`}>
  <div>{contenido}</div>
  <small className="message-date">{formatearFecha(msg.createdAt || msg.fecha)}</small>
</div>

  );
})}


                </div>
                <form className="chat-input" onSubmit={(e) => { e.preventDefault(); enviarMensaje(); }}>
                  <input
                    type="text"
                    value={texto}
                    onChange={(e) => setTexto(e.target.value)}
                    placeholder="Escribe tu mensaje..."
                  />
                  <button type="submit">Enviar</button>
                </form>
              </>
            ) : (
              <div className="chat-placeholder">Selecciona un usuario o partido para chatear</div>
            )}
          </div>
        </div>
      </div>
    );
  };

  export default MensajesPage;
