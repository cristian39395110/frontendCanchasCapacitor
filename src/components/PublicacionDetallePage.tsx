import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { API_URL } from '../config';
import Navbar from '../components/Navbar';
import './PublicacionDetallePage.css';

const PublicacionDetallePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [publicacion, setPublicacion] = useState<any>(null);
  const [nuevoComentario, setNuevoComentario] = useState('');
  const [comentarios, setComentarios] = useState<any[]>([]);
  const [videoAgrandado, setVideoAgrandado] = useState<string | null>(null);

  const usuarioId = Number(localStorage.getItem('usuarioId'));

  useEffect(() => {
    if (!id) return;
    const obtenerPublicacion = async () => {
      try {
        const res = await fetch(`${API_URL}/api/publicaciones/detalle/${id}`);
        const data = await res.json();
        setPublicacion(data);
        setComentarios(data.Comentarios || []);
      } catch (err) {
        console.error('❌ Error al obtener publicación:', err);
      }
    };

    obtenerPublicacion();
  }, [id]);

  const manejarComentario = async () => {
    if (!nuevoComentario.trim()) return;

    try {
      const res = await fetch(`${API_URL}/api/publicaciones/${id}/comentarios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuarioId, contenido: nuevoComentario })
      });

      const nuevo = await res.json();
      setComentarios(prev => [...prev, nuevo]);
      setNuevoComentario('');
    } catch (err) {
      console.error('❌ Error al comentar:', err);
    }
  };

  if (!publicacion) return <p className="cargando">Cargando publicación...</p>;

return (
  <>
    <Navbar />

    <div className="publicacion-detalle">
      <div className="tarjeta-publicacion">
        <h3>{publicacion.Usuario?.nombre}</h3>

        {publicacion.foto?.endsWith('.mp4') ? (
          <video
            src={publicacion.foto}
            className="video-miniatura"
            onClick={() => setVideoAgrandado(publicacion.foto)}
            preload="metadata"
            muted
          />
        ) : (
          publicacion.foto && (
            <img
              src={publicacion.foto}
              alt="publicación"
              className="imagen-publicacion"
            />
          )
        )}

        {publicacion.contenido && (
          <p className="contenido-publicacion">{publicacion.contenido}</p>
        )}

        <p className="fecha-publicacion">
          Publicado el: {new Date(publicacion.createdAt).toLocaleString()}
        </p>

        {/* Comentarios */}
        <div className="comentarios-seccion">
          <h4>Comentarios</h4>
          <ul className="lista-comentarios">
            {comentarios.map((comentario) => (
              <li key={comentario.id}>
                <strong>{comentario.Usuario?.nombre}:</strong> {comentario.contenido}
              </li>
            ))}
          </ul>

          <div className="comentario-form">
            <textarea
              value={nuevoComentario}
              onChange={(e) => setNuevoComentario(e.target.value)}
              rows={3}
              placeholder="Escribí tu comentario..."
            />
            <button onClick={manejarComentario}>Comentar</button>
          </div>
        </div>
      </div>
    </div>

    {videoAgrandado && (
      <div className="modal-overlay" onClick={() => setVideoAgrandado(null)}>
        <div className="modal-video-contenido" onClick={(e) => e.stopPropagation()}>
          <button className="cerrar-modal" onClick={() => setVideoAgrandado(null)}>❌</button>
          <video src={videoAgrandado} controls autoPlay className="video-grande" />
        </div>
      </div>
    )}
  </>
);

};

export default PublicacionDetallePage;
