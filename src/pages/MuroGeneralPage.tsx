import React, { useEffect, useState, useRef } from 'react';
import { API_URL } from '../config';
import Navbar from '../components/Navbar';
import { useNavigate, } from 'react-router-dom';
import './MuroGeneralPage.css';
    import { socket } from '../utils/socket'; // si ya lo tenés
    import Historias from "../components/Historias";


import { useLocation } from 'react-router-dom';

const MuroGeneralPage: React.FC = () => {
  const [publicaciones, setPublicaciones] = useState<any[]>([]);
  const [comentarioTexto, setComentarioTexto] = useState<{ [key: number]: string }>({});
  const usuarioId = localStorage.getItem('usuarioId');
  const [nuevaPublicacion, setNuevaPublicacion] = useState('');
  const [fotoPublicacion, setFotoPublicacion] = useState<File | null>(null);
  const [mostrarComentarios, setMostrarComentarios] = useState<{ [key: number]: boolean }>({});
  const [videoAgrandado, setVideoAgrandado] = useState<string | null>(null);

  const location = useLocation();
  const refPublicaciones = useRef<{ [key: number]: HTMLDivElement | null }>({});
  

const queryParams = new URLSearchParams(location.search);
const publicacionIdDestacada = queryParams.get('publicacionId');
const scrollHastaNueva = location.state?.scrollHastaNueva;

useEffect(() => {
  if (scrollHastaNueva) {
    const int = setInterval(() => {
      const primera = document.querySelector('.publicacion');
      if (primera) {
        primera.scrollIntoView({ behavior: 'smooth', block: 'center' });
        clearInterval(int);
      }
    }, 300);
    return () => clearInterval(int);
  }
}, [scrollHastaNueva]);



useEffect(() => {
  if (!usuarioId) return;
  fetch(`${API_URL}/api/publicaciones/leidas`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usuarioId }),
  });
}, []);

useEffect(() => {
  if (!usuarioId) return;

  socket.emit('join', `usuario-${usuarioId}`);

  socket.on('nueva-publicacion', ({ publicacion }) => {
    console.log('🆕 Publicación recibida por socket:', publicacion);

    setPublicaciones(prev => [publicacion, ...prev]);
  });

  return () => {
    socket.emit('leave', `usuario-${usuarioId}`);
    socket.off('nueva-publicacion');
  };
}, [usuarioId]);


const obtenerThumbnail = (urlVideo: string) => {
  try {
    const parts = urlVideo.split('/upload/');
    const base = parts[0];
    const path = parts[1].replace('.mp4', '');
    return `${base}/upload/so_1,w_400,h_250,c_fill/${path}.jpg`;
  } catch (error) {
    console.error('Error generando thumbnail:', error);
    return urlVideo; // fallback
  }
};

useEffect(() => {
  if (!publicacionIdDestacada) return;
  const idDestacado = Number(publicacionIdDestacada);
  const int = setInterval(() => {
    if (refPublicaciones.current[idDestacado]) {
      refPublicaciones.current[idDestacado]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      clearInterval(int);
    }
  }, 100);
  return () => clearInterval(int);
}, [publicacionIdDestacada]);




  const navigate = useNavigate();

  useEffect(() => {
    if (!usuarioId) return;
    fetch(`${API_URL}/api/publicaciones/amigos/${usuarioId}`)
      .then(res => res.json())
      .then(data => setPublicaciones(data))
      .catch(err => console.error('Error al cargar muro general', err));
  }, [usuarioId]);

  const toggleLike = async (publicacionId: number) => {
    try {
      const res = await fetch(`${API_URL}/api/publicaciones/${publicacionId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuarioId }),
      });
      const publicacionActualizada = await res.json();

      setPublicaciones(prev =>
        prev.map(publi =>
          publi.id === publicacionId ? { ...publi, Likes: publicacionActualizada.Likes } : publi
        )
      );
    } catch (error) {
      console.error('Error al dar like en muro general', error);
    }
  };

  const comentar = async (publicacionId: number) => {
    const contenido = comentarioTexto[publicacionId];
    if (!contenido?.trim()) return;

    const res = await fetch(`${API_URL}/api/publicaciones/${publicacionId}/comentarios`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuarioId, contenido }),
    });
    const nuevoComentario = await res.json();

    setPublicaciones(prev =>
      prev.map(publi =>
        publi.id === publicacionId
          ? { ...publi, Comentarios: [...publi.Comentarios, nuevoComentario] }
          : publi
      )
    );
    setComentarioTexto(prev => ({ ...prev, [publicacionId]: '' }));
  };

const handlePublicar = async () => {
  if (!nuevaPublicacion.trim() && !fotoPublicacion) return;

  const formData = new FormData();
  formData.append('contenido', nuevaPublicacion);
  formData.append('usuarioId', usuarioId || '');
  formData.append('perfilId', usuarioId || ''); // ✅ NECESARIO para que no devuelva 400

  if (fotoPublicacion) formData.append('foto', fotoPublicacion);

  try {
    const res = await fetch(`${API_URL}/api/publicaciones`, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const error = await res.json();
      console.error('❌ Error al publicar:', error.error || 'Error desconocido');
      return;
    }

    const nueva = await res.json();
    setPublicaciones([nueva, ...publicaciones]);
    setNuevaPublicacion('');
    setFotoPublicacion(null);
  } catch (err) {
    console.error('❌ Error de red al publicar:', err);
  }
};

  return (
    <>
      <Navbar />
      <div className="muro-general-container">
        <h2 className="titulo-muro">📰 Muro general</h2>
          <Historias />

        <div className="formulario-publicar">
          <h3>📤 Publicá algo en el muro</h3>
          <textarea
          className="formu"
            placeholder="¿Qué estás pensando?"
            value={nuevaPublicacion}
            onChange={(e) => setNuevaPublicacion(e.target.value)}
          ></textarea>
<div className="grupo-botones-publicacion">
  <label className="custom-file-upload">
    📎 subir 
    <input
      type="file"
      accept="image/*,video/mp4"
      onChange={(e) => setFotoPublicacion(e.target.files?.[0] || null)}
    />
  </label>
  <button className="boton-publicar" onClick={handlePublicar}>📤 Publicar</button>
</div>
{fotoPublicacion && (
  <span className="nombre-archivo">{fotoPublicacion.name}</span>
)}

        </div>

        {publicaciones.length === 0 ? (
          <p>No hay publicaciones aún.</p>
        ) : (
          publicaciones.map((publi, i) => (
          <div
  key={i}
ref={(el) => {
  if (el) refPublicaciones.current[publi.id] = el;
}}

  className={`publicacion ${publi.id.toString() === publicacionIdDestacada ? 'resaltada' : ''}`}
>

              <div
                className="publicacion-header"
                onClick={() => navigate(`/perfil/${publi.Usuario?.id}`)}
                style={{ cursor: 'pointer' }}
              >
                <img
                  src={publi.Usuario?.fotoPerfil || '/default-avatar.png'}
                  alt="Foto de perfil"
                  className="foto-perfil"
                />
                <strong>{publi.Usuario?.nombre || 'Usuario'}</strong>
              </div>

              <p className="publicacion-texto">{publi.contenido}</p>

              {publi.foto && publi.foto.match(/\.(jpg|jpeg|png)$/i) && (
                <img
                  src={publi.foto}
                  alt="Publicación"
                  className="media-publicacion"
                />
              )}
{publi.foto && publi.foto.match(/\.mp4$/i) && (
  <div className="contenedor-thumbnail-video" onClick={() => setVideoAgrandado(publi.foto)}>
    <img
      src={obtenerThumbnail(publi.foto)}
      alt="Miniatura del video"
      className="media-publicacion"
    />
    <div className="icono-play">▶</div>
  </div>
)}


              <div className="acciones-publicacion">
                <button
                  onClick={() => toggleLike(publi.id)}
                  className="like-button"
                >
                  {Array.isArray(publi.Likes) &&
                  publi.Likes.some((l: any) => l.usuarioId === Number(usuarioId))
                    ? '❤️'
                    : '🤍'}
                </button>
                <span>{publi.Likes?.length || 0} me gusta</span>
              </div>

              <button
  onClick={() =>
    setMostrarComentarios((prev) => ({
      ...prev,
      [publi.id]: !prev[publi.id],
    }))
  }
  className="toggle-comentarios"
>
  {mostrarComentarios[publi.id] ? 'Ocultar comentarios' : 'Ver comentarios'}
</button>

{mostrarComentarios[publi.id] && (
  <div className="comentarios-container">
    {(publi.Comentarios || [])
      .slice(0, publi.ComentariosExpanded ? publi.Comentarios.length : 2)
      .map((c: any, idx: number) => (
        <div key={idx} className="comentario-burbuja">
          <span className="comentario-nombre">{c.Usuario?.nombre || 'Anon'}:</span>
          <span className="comentario-texto">{c.contenido}</span>
          {c.usuarioId === Number(usuarioId) && (
            <button
              className="btn-eliminar-comentario"
              onClick={async () => {
                try {
                  await fetch(`${API_URL}/api/publicaciones/comentarios/${c.id}?usuarioId=${usuarioId}`, {
                    method: 'DELETE',
                  });

                  setPublicaciones(prev =>
                    prev.map(publiAnterior =>
                      publiAnterior.id === publi.id
                        ? {
                            ...publiAnterior,
                            Comentarios: publiAnterior.Comentarios.filter(
                              (com: any) => com.id !== c.id
                            ),
                          }
                        : publiAnterior
                    )
                  );
                } catch (err) {
                  console.error('Error al eliminar comentario:', err);
                }
              }}
            >
              🗑️
            </button>
          )}
        </div>
      ))}

    {(publi.Comentarios || []).length > 2 && (
      <button
        className="ver-mas-comentarios"
        onClick={() =>
          setPublicaciones(prev =>
            prev.map(pub =>
              pub.id === publi.id
                ? {
                    ...pub,
                    ComentariosExpanded: !pub.ComentariosExpanded,
                  }
                : pub
            )
          )
        }
      >
        {publi.ComentariosExpanded ? 'Ver menos' : 'Ver más comentarios'}
      </button>
    )}
  </div>
)}


              <div className="formulario-comentario">
                <input
                  type="text"
                  placeholder="Escribe un comentario..."
                  value={comentarioTexto[publi.id] || ''}
                  onChange={(e) =>
                    setComentarioTexto((prev) => ({
                      ...prev,
                      [publi.id]: e.target.value,
                    }))
                  }
                />
                <button onClick={() => comentar(publi.id)}>Comentar</button>
              </div>
         

            </div>
          ))
        )}
      </div>

{videoAgrandado && (
  <div className="video-overlay" onClick={() => setVideoAgrandado(null)}>
    <video
      src={videoAgrandado}
      controls
      autoPlay
      className="video-ampliado-modal"
      onClick={(e) => e.stopPropagation()}
    />
    <button className="boton-cerrar-video" onClick={() => setVideoAgrandado(null)}>
      ❌
    </button>
  </div>
)}


        
    </>
  );
};

export default MuroGeneralPage;
