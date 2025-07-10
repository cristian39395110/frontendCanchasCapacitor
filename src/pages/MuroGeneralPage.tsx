import React, { useEffect, useState } from 'react';
import { API_URL } from '../config';
import Navbar from '../components/Navbar';
import { useNavigate } from 'react-router-dom';
import './MuroGeneralPage.css';

const MuroGeneralPage: React.FC = () => {
  const [publicaciones, setPublicaciones] = useState<any[]>([]);
  const [comentarioTexto, setComentarioTexto] = useState<{ [key: number]: string }>({});
  const usuarioId = localStorage.getItem('usuarioId');
  const [nuevaPublicacion, setNuevaPublicacion] = useState('');
  const [fotoPublicacion, setFotoPublicacion] = useState<File | null>(null);
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
    if (fotoPublicacion) formData.append('foto', fotoPublicacion);

    try {
      const res = await fetch(`${API_URL}/api/publicaciones`, {
        method: 'POST',
        body: formData,
      });
      const nueva = await res.json();
      setPublicaciones([nueva, ...publicaciones]);
      setNuevaPublicacion('');
      setFotoPublicacion(null);
    } catch (err) {
      console.error('Error al publicar desde el muro', err);
    }
  };

  return (
    <>
      <Navbar />
      <div className="muro-general-container">
        <h2 className="titulo-muro">📰 Muro general</h2>

        <div className="formulario-publicar">
          <h3>📤 Publicá algo en el muro</h3>
          <textarea
            placeholder="¿Qué estás pensando?"
            value={nuevaPublicacion}
            onChange={(e) => setNuevaPublicacion(e.target.value)}
          ></textarea>
          <input
            type="file"
            accept="image/*,video/mp4"
            onChange={(e) => setFotoPublicacion(e.target.files?.[0] || null)}
          />
          <button onClick={handlePublicar}>Publicar</button>
        </div>

        {publicaciones.length === 0 ? (
          <p>No hay publicaciones aún.</p>
        ) : (
          publicaciones.map((publi, i) => (
            <div key={i} className="publicacion">
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
                <video controls className="media-publicacion" src={publi.foto} />
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

              <div className="comentarios">
                {publi.Comentarios?.map((c: any, idx: number) => (
                  <div key={idx} className="comentario">
                    <strong>{c.Usuario?.nombre || 'Anon'}:</strong> {c.contenido}
                  </div>
                ))}
              </div>

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
    </>
  );
};

export default MuroGeneralPage;
