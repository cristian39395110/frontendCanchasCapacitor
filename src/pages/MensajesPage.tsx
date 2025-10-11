//mensajes page 
    // ✅ MensajesPage.tsx con soporte para chats individuales y grupales
    import React, { useEffect, useState, useRef } from 'react';
    import { API_URL } from '../config';
    import Navbar from '../components/Navbar';
    import { socket } from '../utils/socket';
    import { useParams } from 'react-router-dom';
    import { v4 as uuidv4 } from 'uuid';
    import { PushNotifications } from '@capacitor/push-notifications';
    
import { useNavigate } from 'react-router-dom'; // ya tenés que usar esto arriba
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ModalConfirmar from '../components/ModalConfirmar';





    import './MensajesPage.css';

import { Keyboard } from '@capacitor/keyboard';


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
const [puedeHablar, setPuedeHablar] = useState(true); // por defecto sí puede
const [mensajeIdsLeidos, setMensajeIdsLeidos] = useState<number[]>([]);

const ultimoMensajePartidoRef = useRef<HTMLDivElement | null>(null);


const [mostrarModal, setMostrarModal] = useState(false);
const [accionEliminar, setAccionEliminar] = useState<() => void>(() => () => {});


const navigate = useNavigate();

// Al comienzo del componente
const usuarioId: string | null = localStorage.getItem('usuarioId');

useEffect(() => {
  if (tipoChat === 'partido' && ultimoMensajePartidoRef.current) {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          // 🔥 Lógica para marcar como leído
          fetch(`${API_URL}/api/mensajes-partido/marcar-leido/${partidoSeleccionadoId}/${usuarioId}`, {
            method: 'PUT',
          }).then(() => {
            console.log('✅ Mensajes marcados como leídos');
          }).catch(err => {
            console.error('❌ Error al marcar como leídos:', err);
          });
        }
      },
      { threshold: 1.0 }
    );

    observer.observe(ultimoMensajePartidoRef.current);

    return () => {
      observer.disconnect();
    };
  }
}, [mensajes, tipoChat, partidoSeleccionadoId]);

useEffect(() => {
  const obtenerPartidosConMensajesNoLeidos = async () => {
    
    try {
      
      const response = await fetch(`${API_URL}/api/mensajes-partido/no-leidos/${usuarioId}`);
 const data = await response.json();
      const ids = data.partidosConMensajes || []; // 👈 esto es CLAVE
      setPartidosConMensajes(ids); // 
    } catch (error) {
      console.error('❌ Error al obtener partidos con mensajes no leídos:', error);
    }
  };

  if (usuarioId) {
    obtenerPartidosConMensajesNoLeidos();
  }
}, [usuarioId]);


useEffect(() => {
  const obtenerNoLeidos = async () => {
    try {
      const res = await fetch(`${API_URL}/api/mensajes-partido/no-leidos/${usuarioId}`);
      const data = await res.json();
      setPartidosConMensajes(data.partidosConMensajes || []);
      console.log('🔵 Partidos con mensajes no leídos:', data.partidosConMensajes);
    } catch (error) {
      console.error('❌ Error al obtener mensajes no leídos:', error);
    }
  };

  obtenerNoLeidos();
}, []);



useEffect(() => {
  const listener = PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
    const data = notification.notification.data;

    // Solo si es una notificación del tipo "organizador"
    if (data?.tipo === 'organizador' && data.partidoId) {
      console.log('📲 Notificación FCM tocada - partidoId:', data.partidoId);
      navigate(`/chat/${data.partidoId}`);
    }
  });

  return () => {
    listener.then(unsub => unsub.remove());
  };
}, []);



useEffect(() => {
  Keyboard.setScroll({ isDisabled: true }); // Evita el scroll automático que puede romper diseño

  Keyboard.addListener('keyboardWillShow', () => {
    document.body.classList.add('keyboard-visible');
  });

  Keyboard.addListener('keyboardWillHide', () => {
    document.body.classList.remove('keyboard-visible');
  });

  return () => {
    Keyboard.removeAllListeners();
  };
}, []);





      const { usuarioId: usuarioIdUrl } = useParams(); // <- viene de la URL



      
      const mensajesRef = useRef<HTMLDivElement>(null);
      const [filtroNombre, setFiltroNombre] = useState('');
    const formatearFecha = (fechaISO: string): string => {
  const fecha = new Date(fechaISO);
  return fecha.toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false // si querés 14:30 en vez de 2:30 p. m.
  });
};


useEffect(() => {
  setTimeout(() => {
    if (mensajesRef.current) {
      mensajesRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, 400); // 🔁 pequeño delay para asegurarte de que el DOM ya se pintó
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
  const setVH = () => {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
  };
  window.addEventListener('resize', setVH);
  setVH();
  return () => window.removeEventListener('resize', setVH);
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
 setTimeout(() => {
    const input = document.querySelector('.chat-input input');
    if (input) input.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, 300);


      };

const seleccionarPartido = async (partidoId: number, nombre: string) => {
  try {
    setTipoChat('partido');
    setUsuarioSeleccionado({ id: 0, nombre });
    setPartidoSeleccionadoId(partidoId);

    const res = await fetch(`${API_URL}/api/mensajes-partido/partido/${partidoId}?usuarioId=${usuarioId}`);

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

    // 🔵 Obtenemos mensajes leídos
   const leidosRes = await fetch(`${API_URL}/api/mensajes-partido/leidos/${partidoId}/${usuarioId}`);
const { mensajeIdsLeidos: ids } = await leidosRes.json();
console.log('🔵 Leídos:', ids);
setMensajeIdsLeidos(ids || []);


    // ✅ Marcamos leídos
    const mensajesConLeido = data.map((m: any) => ({
      ...m,
      leido: mensajeIdsLeidos.includes(m.id),
    }));

    setMensajes(mensajesConLeido);
    

    socket.emit('join-partido', partidoId);

    await fetch(`${API_URL}/api/mensajes-partido/marcar-leido/${partidoId}/${usuarioId}`, {
      method: 'PUT',
    });

 setPartidosConMensajes((prev) => prev.filter((id) => id !== partidoId));

  // 🧠 Si el último mensaje es del sistema, marcar partido como con mensaje pendiente
if (data.length > 0) {
  const ultimo = data[data.length - 1];
  if (ultimo.tipo === 'sistema') {
    setPartidosConMensajes((prev) => {
      if (!prev.includes(partidoId)) return [...prev, partidoId];
      return prev;
    });
  }
}

   
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
  

      window.dispatchEvent(new CustomEvent('nuevoMensaje', { detail: { tipo: 'usuario', usuarioId: nuevo.emisorId } }));

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

    if (!puedeHablar && nuevo.partidoId === partidoSeleccionadoRef.current) {
  console.log('⛔ Ignorado: usuario fue removido del partido');
  return;
}


  if (esChatActual) {
    setMensajes(prev => {
      const yaExiste = prev.some(m =>
        m.id === nuevo.id || (m._manual && (m.mensaje === nuevo.mensaje || m.frontendId === nuevo.frontendId))
      );
      if (yaExiste) return prev;
      return [...prev, { ...nuevo }];
    });
  } else {


    window.dispatchEvent(new CustomEvent('nuevoMensaje', { detail: { tipo: 'partido', partidoId: nuevo.partidoId } }));

    // 👇 SOLO pintamos en azul el partido si no es el chat actual
 if (puedeHablar) {
  setPartidosConMensajes(prev => {
    if (!prev.includes(nuevo.partidoId)) return [...prev, nuevo.partidoId];
    return prev;
  });
}

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

useEffect(() => {
  if (!usuarioId) return;

  // 🔵 Cargar mensajes no leídos de chats individuales
  fetch(`${API_URL}/api/mensajes/no-leidos/${usuarioId}`)
    .then(res => res.json())
    .then(data => {
      if (data.usuariosConMensajes) {
        setUsuariosConMensajes(data.usuariosConMensajes);
      }
    });

  // ⚽ Cargar mensajes no leídos de partidos
  fetch(`${API_URL}/api/mensajes-partido/no-leidos/${usuarioId}`)
    .then(res => res.json())
    .then(data => {

      console.log("que mierda",data)
      if (data.partidosConMensajes) {
        setPartidosConMensajes(data.partidosConMensajes);
      }
    });
}, [usuarioId]);



useEffect(() => {
  const input = document.querySelector('.chat-input input');

  const scrollToBottom = () => {
    if (mensajesRef.current) {
      mensajesRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleFocus = () => {
    setTimeout(() => {
      scrollToBottom();
    }, 300);
  };

  if (input) {
    input.addEventListener('focus', handleFocus);
  }

  return () => {
    if (input) {
      input.removeEventListener('focus', handleFocus);
    }
  };
}, []);

const eliminarMensaje = async (mensajeId: number) => {
  try {
   await fetch(`${API_URL}/api/mensajes/eliminar/${mensajeId}?usuarioId=${usuarioId}`, {
  method: 'DELETE'
});


    setMensajes(prev => prev.filter(m => m.id !== mensajeId));
  } catch (err) {
    console.error('❌ Error al eliminar mensaje:', err);
  }
};

const inputForzadoVisible = tipoChat === 'usuario' && !usuarioSeleccionado && usuarioIdUrl;
useEffect(() => {
  const verificarSiSigue = async () => {
    if (tipoChat === 'partido') {
      try {
        const res = await fetch(`${API_URL}/api/partidos/sigue-en-el-partido?partidoId=${partidoSeleccionadoId}&usuarioId=${usuarioId}`);
        const data = await res.json();
        setPuedeHablar(data.sigue); // true o false
      } catch (err) {
        console.error('❌ Error al verificar estado del jugador:', err);
        setPuedeHablar(false); // por precaución, lo bloqueamos
      }
    }
  };

  verificarSiSigue();
}, [partidoSeleccionadoId]);

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
  ${partidosConMensajes.includes(Number(p.id)) ? 'nuevo-mensaje' : ''}`}

    onClick={() => seleccionarPartido(p.id, p.nombre)}
  >
    <span>{p.nombre}</span>

   {partidosConMensajes.includes(Number(p.id)) && (
  <span className="emoji-sobrecito">📩</span>
)}

  </div>
))}

            </div>

            <div className="chat-window">
              {usuarioSeleccionado || inputForzadoVisible ? (
                <>
                  <div className="chat-header">
{usuarioSeleccionado?.nombre || 'Cargando...'}

<button
  onClick={() => {
    setAccionEliminar(() => async () => {
    if (tipoChat === 'usuario' && usuarioSeleccionado) {
      await fetch(`${API_URL}/api/mensajes/conversacion/${usuarioId}/${usuarioSeleccionado.id}`, {
        method: 'DELETE',
      });
      // 👇 Eliminar del estado usuarios (opcional)
      setUsuarios(prev => prev.filter(u => u.id !== usuarioSeleccionado.id));
    } else if (tipoChat === 'partido' && partidoSeleccionadoId) {
     await fetch(`${API_URL}/api/mensajes/partido/${partidoSeleccionadoId}?usuarioId=${usuarioId}`, {
  method: 'DELETE'
});

      // 👇 Eliminar del estado de partidos
      setPartidos(prev => prev.filter(p => p.id !== partidoSeleccionadoId));
    }

    setMensajes([]);
    toast.success('✅ Chat eliminado');
    setMostrarModal(false);
    setUsuarioSeleccionado(null);
    setPartidoSeleccionadoId(null);
    setTipoChat(null);
  });
    setMostrarModal(true);
  }}
  style={{
    marginLeft: '10px',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontSize: '1.2rem'
  }}
  title="Eliminar chat completo"
>
  🗑️
</button>

{mostrarModal && (
  <ModalConfirmar
    texto="¿Eliminar todo el chat?"
    onConfirmar={accionEliminar}
    onCancelar={() => setMostrarModal(false)}
  />
)}


</div>

 <div className="chat-messages" ref={mensajesRef}>
{mensajes.map((msg, i) => {
  const miId = Number(usuarioId);
  const esMio = (tipoChat === 'usuario' && msg.emisorId === miId) ||
                (tipoChat === 'partido' && msg.usuarioId === miId);
  const contenido = msg.contenido || msg.mensaje || '';
  const esUltimo = i === mensajes.length - 1;

  // 🔸 Mensaje de sistema
  if (msg.tipo === 'sistema') {
    return (
      <div key={i} className="message-bubble sistema" ref={esUltimo ? mensajesRef : null}>
        <em>⚠ {contenido}</em>
        <small className="message-date">{formatearFecha(msg.createdAt || msg.fecha)}</small>
      </div>
    );
  }

  // 🔸 Mensaje normal (usuario o partido)
  return (
    <div
      key={i}
      className={`message-bubble ${esMio ? 'sent' : 'received'} ${!esMio && tipoChat === 'partido' && !mensajeIdsLeidos.includes(msg.id) ? 'no-leido' : ''}`}

      ref={esUltimo ? (tipoChat === 'partido' ? ultimoMensajePartidoRef : mensajesRef) : null}

      onContextMenu={(e) => {
        e.preventDefault();
        if (esMio && window.confirm('¿Eliminar este mensaje?')) {
          eliminarMensaje(msg.id);
        } else if (!esMio) {
          toast.error('❌ Solo podés eliminar tus propios mensajes');
        }
      }}
    >
      {!esMio && tipoChat === 'partido' && (
        <div className="message-author">
          <strong>{msg.Usuario?.nombre || 'Jugador'}:</strong>
        </div>
      )}
      <div>{contenido}</div>
      <small className="message-date">{formatearFecha(msg.createdAt || msg.fecha)}</small>
    </div>
    
  );
  

})}



<div style={{ height: '20px' }}></div>

                  </div>
                 {tipoChat === 'partido' && !puedeHablar ? (
  <div className="mensaje-bloqueado">
    ⚠ Fuiste removido del partido. No podés enviar mensajes.
  </div>
) : (
  <form className="chat-input" onSubmit={(e) => { e.preventDefault(); enviarMensaje(); }}>
    <input
      type="text"
      value={texto}
      onChange={(e) => setTexto(e.target.value)}
      placeholder="Escribe tu mensaje..."
    />
    <button type="submit">Enviar</button>
  </form>
)}

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
