    // ✅ MensajesPage.tsx con soporte para chats individuales y grupales
    import React, { useEffect, useState, useRef } from 'react';
    import { API_URL } from '../config';
    import Navbar from '../components/Navbar';
    import { socket } from '../utils/socket';
    import { useParams } from 'react-router-dom';
    import { v4 as uuidv4 } from 'uuid';



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
       frontendId?: string; 
      leido: boolean;
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
      const usuarioSeleccionadoRef = useRef<Usuario | null>(null);
      const partidoSeleccionadoRef = useRef<number | null>(null);
      const tipoChatRef = useRef<'usuario' | 'partido' | null>(null);
      const [usuariosConMensajes, setUsuariosConMensajes] = useState<number[]>([]);
const [partidosConMensajes, setPartidosConMensajes] = useState<number[]>([]);




      const { usuarioId: usuarioIdUrl } = useParams(); // <- viene de la URL



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
  setTimeout(() => {
    if (mensajesRef.current) {
      mensajesRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, 100); // 🔁 pequeño delay para asegurarte de que el DOM ya se pintó
}, [mensajes]);
  
  useEffect(() => {
    tipoChatRef.current = tipoChat;
  }, [tipoChat]);


  useEffect(() => {
    usuarioSeleccionadoRef.current = usuarioSeleccionado;
  }, [usuarioSeleccionado]);

  useEffect(() => {
    partidoSeleccionadoRef.current = partidoSeleccionadoId;
  }, [partidoSeleccionadoId]);



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
  if (!socket || !usuarioId) return;
const salaPrivada = `usuario-${usuarioId}`;
  const handleConnect = () => {
    
  

    socket.emit('join', salaPrivada);
    console.log('🟢 Emitido join desde frontend a sala', salaPrivada);
  };

  socket.on('connect', handleConnect);

  if (socket.connected) {
    // Si ya está conectado, unirse de una
    handleConnect();
  }

  return () => {
    socket.off('connect', handleConnect);
    socket.emit('leave', salaPrivada);
    console.log('🔴 Emitido leave desde frontend de sala', salaPrivada);
  };
}, [usuarioId]);


 
      useEffect(() => {
        fetch(`${API_URL}/api/mensajes/chats/${usuarioId}`)
          .then(res => res.json())
          .then(data => setUsuarios(data));

        fetch(`${API_URL}/api/mensajes/partidos-confirmados/${usuarioId}`)
          .then(res => res.json())
          .then(data => setPartidos(data));
      }, [usuarioId]);

  useEffect(() => {
    const cargarUsuarioNuevo = async () => {
      if (!usuarioIdUrl || usuarios.some(u => u.id === parseInt(usuarioIdUrl))) return;

      try {
        const res = await fetch(`${API_URL}/api/usuarios/${usuarioIdUrl}`);
        const usuarioNuevo = await res.json();

        if (usuarioNuevo && usuarioNuevo.id) {
          const usuarioFormateado = {
            id: usuarioNuevo.id,
            nombre: usuarioNuevo.nombre
          };

          setUsuarios(prev => {
    const yaExiste = prev.some(u => u.id === usuarioFormateado.id);
    if (yaExiste) return prev;
    return [...prev, usuarioFormateado];
  });

          seleccionarUsuario(usuarioFormateado);
          

        }
      } catch (err) {
        console.error('❌ Error al cargar usuario nuevo para chat:', err);
      }
    };

    cargarUsuarioNuevo();
  }, [usuarioIdUrl, usuarios]);


      useEffect(() => {
    if (usuarioIdUrl && usuarios.length > 0) {
      const id = parseInt(usuarioIdUrl);
      const usuario = usuarios.find(u => u.id === id);
      if (usuario) {
        seleccionarUsuario(usuario);
      }
    }
  }, [usuarioIdUrl, usuarios]);


      const seleccionarUsuario = async (usuario: Usuario) => {
        usuarioSeleccionadoRef.current = usuario;
        setUsuariosConMensajes(prev => prev.filter(id => id !== usuario.id));


        setTipoChat('usuario');
        setUsuarioSeleccionado(usuario);
        setPartidoSeleccionadoId(null);
        const res = await fetch(`${API_URL}/api/mensajes/conversacion/${usuarioId}/${usuario.id}`);
        const data = await res.json();
        setMensajes(data);
        await fetch(`${API_URL}/api/mensajes/marcar-leido/${usuarioId}/${usuario.id}`, { method: 'PUT' });
      };

    const seleccionarPartido = async (partidoId: number, nombre: string) => {
      setPartidosConMensajes(prev => prev.filter(id => id !== partidoId));

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
          socket.emit('join-partido', partidoId);

    } catch (error) {
      console.error('❌ Error al seleccionar partido:', error);
      setMensajes([]);
    }
  };


      const enviarMensaje = async () => {
         if (!texto.trim()) return;

  let frontendId: string | null = null;
  if (tipoChat === 'usuario' && usuarioSeleccionado) {

      frontendId = uuidv4(); 
    const mensajeTemporal = {
 id: frontendId, // ← ID único que también llegará al backend
  emisorId: Number(usuarioId),
  receptorId: usuarioSeleccionado.id,
  contenido: texto,
  leido: true,
  fecha: new Date().toISOString(),
  esMio: true,
  _manual: true
};

    setMensajes(prev => [...prev, mensajeTemporal]);
  }
  setTexto('');
        try {
          if (tipoChat === 'usuario' && usuarioSeleccionado) {
          await fetch(`${API_URL}/api/mensajes/enviar`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ emisorId: usuarioId, receptorId: usuarioSeleccionado.id, mensaje: texto, frontendId  })
            });
            
          } else if (tipoChat === 'partido' && partidoSeleccionadoId) {
                 const frontendIdPartido = uuidv4();

  // ⏱ Mensaje temporal para mostrar al instante
  const mensajeTemporal = {
    id: frontendIdPartido,
    usuarioId: Number(usuarioId),
    partidoId: partidoSeleccionadoId,
    mensaje: texto,
    fecha: new Date().toISOString(),
    esMio: true,
    _manual: true
  };
  setMensajes(prev => [...prev, mensajeTemporal]);



      await fetch(`${API_URL}/api/mensajes-partido/partido/enviar`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
      partidoId: partidoSeleccionadoId,
      usuarioId,
      mensaje: texto,
      frontendId: frontendIdPartido // 👈
    })
            });



            
          }
          setTexto('');
        } catch (err) {
          console.error(err);
        }
      };
  useEffect(() => {
    if (!socket || !usuarioId) return;

const recibirMensaje = (nuevo: Mensaje) => {
  setTimeout(() => {
    const seleccionado = usuarioSeleccionadoRef.current;
    const emisor = Number(nuevo.emisorId);
    const receptor = Number(nuevo.receptorId);
    const yo = Number(usuarioId);
    const seleccionadoId = seleccionado?.id;

    const esChatActual =
      (emisor === yo && receptor === seleccionadoId) ||
      (receptor === yo && emisor === seleccionadoId);

    if (esChatActual) {
      setMensajes(prev => {
        const yaExiste = prev.some(m =>
          m.id === nuevo.id || (m._manual && nuevo.frontendId && m.id === nuevo.frontendId)
        );
        if (yaExiste) return prev;
        return [...prev, nuevo];
      });
    } else {
      setUsuariosConMensajes(prev => {
        if (!prev.includes(emisor)) return [...prev, emisor];
        return prev;
      });
      console.log('📩 Mensaje recibido pero NO es del chat actual', nuevo);
    }
  }, 50);
};





  const recibirMensajePartido = (nuevo: any) => {
  const esChatActual = 
    tipoChatRef.current === 'partido' &&
    nuevo.partidoId === partidoSeleccionadoRef.current;

  if (esChatActual) {
    setMensajes(prev => {
      const yaExiste = prev.some(m =>
        m.id === nuevo.id || (m._manual && (m.mensaje === nuevo.mensaje || m.frontendId === nuevo.frontendId))
      );
      if (yaExiste) return prev;
      return [...prev, { ...nuevo }];
    });
  } else {
    // 👇 SOLO pintamos en azul el partido si no es el chat actual
    setPartidosConMensajes(prev => {
      if (!prev.includes(nuevo.partidoId)) return [...prev, nuevo.partidoId];
      return prev;
    });
    console.log('📩 Mensaje de partido recibido pero NO es del chat actual', nuevo);
  }
};


    socket.on('mensajeNuevo', recibirMensaje);
    socket.on('nuevo-mensaje-partido', recibirMensajePartido);

    return () => {
      socket.off('mensajeNuevo', recibirMensaje);
      socket.off('nuevo-mensaje-partido', recibirMensajePartido);
    };
  }, []);


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
               <div
  key={u.id}
  className={`user-chat 
    ${usuarioSeleccionado?.id === u.id ? 'selected' : ''} 
    ${usuariosConMensajes.includes(u.id) ? 'nuevo-mensaje' : ''}`}
  onClick={() => seleccionarUsuario(u)}
>

                  <span>{u.nombre}</span>
                  {u.tieneNoLeidos && <span className="unread-icon">📩</span>}
                </div>
              ))}

              <div style={{ marginTop: '15px' }}>⚽ Chats de partidos</div>
              {partidos.map(p => (
              <div
  key={p.id}
  className={`user-chat 
    ${partidoSeleccionadoId === p.id ? 'selected' : ''} 
    ${partidosConMensajes.includes(p.id) ? 'nuevo-mensaje' : ''}`}
  onClick={() => seleccionarPartido(p.id, p.nombre)}
>

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
 const esMio = tipoChatRef.current === 'usuario'
  ? msg.emisorId === Number(usuarioId)
  : msg.usuarioId === Number(usuarioId);


  const contenido = tipoChat === 'usuario' ? msg.contenido : msg.mensaje;

  const esUltimo = i === mensajes.length - 1; // ✅ Detecta el último mensaje

  return (
    <div
      key={i}
      className={`message-bubble ${esMio ? 'sent' : 'received'}`}
      ref={esUltimo ? mensajesRef : null} // ✅ Solo el último mensaje tiene el ref
    >
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
