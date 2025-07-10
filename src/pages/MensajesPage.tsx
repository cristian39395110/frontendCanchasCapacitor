import React, { useEffect, useState, useRef } from 'react';
import { API_URL } from '../config';
import Navbar from '../components/Navbar';
import { io, Socket } from 'socket.io-client';
import { useParams } from 'react-router-dom';
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

const socket: Socket = io(API_URL);

const MensajesPage: React.FC = () => {
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [texto, setTexto] = useState('');
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<Usuario | null>(null);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const usuarioId = localStorage.getItem('usuarioId');
  const mensajesRef = useRef<HTMLDivElement>(null);
  const [filtroNombre, setFiltroNombre] = useState('');
  const { usuarioId: usuarioIdDesdeURL } = useParams();



  useEffect(() => {
  const handleResize = () => {
    const offset = window.visualViewport?.height
      ? window.innerHeight - window.visualViewport.height
      : 0;

    const chatInput = document.querySelector('.chat-input') as HTMLElement;
    if (chatInput) {
      chatInput.style.marginBottom = `${offset}px`;
    }

    const chatMessages = document.querySelector('.chat-messages') as HTMLElement;
    if (chatMessages) {
      chatMessages.style.maxHeight = `calc(100vh - 200px - ${offset}px)`;
    }
  };

  window.visualViewport?.addEventListener('resize', handleResize);
  window.visualViewport?.addEventListener('scroll', handleResize);

  return () => {
    window.visualViewport?.removeEventListener('resize', handleResize);
    window.visualViewport?.removeEventListener('scroll', handleResize);
  };
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
      .then(data => setUsuarios(data))
      .catch(err => console.error(err));
  }, [usuarioId]);

  useEffect(() => {
    if (!usuarioIdDesdeURL) return;

    const cargarUsuarioDesdeURL = async () => {
      const id = Number(usuarioIdDesdeURL);
      let usuario = usuarios.find(u => u.id === id);

      if (!usuario) {
        try {
          const res = await fetch(`${API_URL}/api/usuarios/${id}`);
          const data = await res.json();

          if (data && data.id) {
            setUsuarios((prev) => [...prev, data]);
            seleccionarUsuario(data);
          }
        } catch (err) {
          console.error('❌ Error al buscar usuario desde la URL:', err);
        }
      } else {
        seleccionarUsuario(usuario);
      }
    };

    cargarUsuarioDesdeURL();
  }, [usuarioIdDesdeURL, usuarios]);

  useEffect(() => {
    if (!usuarioId) return;

    socket.on('mensajeNuevo', (nuevoMensaje: Mensaje) => {
      if (
        usuarioSeleccionado &&
        (
          (Number(nuevoMensaje.emisorId) === usuarioSeleccionado.id && Number(nuevoMensaje.receptorId) === Number(usuarioId)) ||
          (Number(nuevoMensaje.receptorId) === usuarioSeleccionado.id && Number(nuevoMensaje.emisorId) === Number(usuarioId))
        )
      ) {
        setMensajes(prev => [...prev, nuevoMensaje]);

        fetch(`${API_URL}/api/mensajes/marcar-leido/${usuarioId}/${usuarioSeleccionado.id}`, {
          method: 'PUT'
        });
      } else {
        fetch(`${API_URL}/api/mensajes/chats/${usuarioId}`)
          .then(res => res.json())
          .then(data => setUsuarios(data))
          .catch(err => console.error(err));
      }
    });

    return () => {
      socket.off('mensajeNuevo');
    };
  }, [usuarioSeleccionado, usuarioId]);

  const seleccionarUsuario = async (usuario: Usuario) => {
    setUsuarioSeleccionado(usuario);
    try {
      const res = await fetch(`${API_URL}/api/mensajes/conversacion/${usuarioId}/${usuario.id}`);
      const data = await res.json();
      setMensajes(data);

      await fetch(`${API_URL}/api/mensajes/marcar-leido/${usuarioId}/${usuario.id}`, {
        method: 'PUT'
      });
    } catch (err) {
      console.error(err);
    }
  };

  const enviarMensaje = async () => {
    if (!texto.trim() || !usuarioSeleccionado) return;

    try {
      const res = await fetch(`${API_URL}/api/mensajes/enviar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emisorId: usuarioId,
          receptorId: usuarioSeleccionado.id,
          mensaje: texto
        })
      });

      if (!res.ok) return;

      const nuevo: Mensaje = await res.json();

      setMensajes(prev => [...prev, { ...nuevo, emisorId: Number(usuarioId) }]);
      setTexto('');
    } catch (error) {
      console.error(error);
    }
  };

  const usuariosFiltrados = usuarios.filter(u =>
    u.nombre?.toLowerCase().includes(filtroNombre.toLowerCase())
  );

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
          {usuariosFiltrados.map(u => (
            <div
              key={u.id}
              className={`user-chat ${usuarioSeleccionado?.id === u.id ? 'selected' : ''}`}
              onClick={() => seleccionarUsuario(u)}
            >
              <span>{u.nombre}</span>
              {u.tieneNoLeidos && <span className="unread-icon">📩</span>}
            </div>
          ))}
        </div>

        <div className="chat-window">
          {usuarioSeleccionado ? (
            <>
              <div className="chat-header">{usuarioSeleccionado.nombre}</div>
              <div className="chat-messages" ref={mensajesRef}>
                {mensajes.map((msg) => (
                  <div
                    key={msg.id}
                    className={`message-bubble ${msg.emisorId === Number(usuarioId) ? 'sent' : 'received'}`}
                  >
                    {msg.contenido}
                  </div>
                ))}
              </div>
             <form className="chat-input" onSubmit={(e) => {
  e.preventDefault();
  enviarMensaje();
}}>
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
            <div className="chat-placeholder">Selecciona un usuario para chatear</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MensajesPage;
