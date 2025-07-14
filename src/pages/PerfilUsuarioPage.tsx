  import React, { useEffect, useState } from 'react';
  import { useParams } from 'react-router-dom';
  import Navbar from '../components/Navbar';
  import CambiarFotoPerfil from '../components/CambiarFotoPerfil';
  import { API_URL } from '../config';
  import './PerfilPage.css';
  import { Toast } from '@capacitor/toast';


  const PerfilUsuarioPage: React.FC = () => {
    const { id } = useParams();
    const usuarioId = localStorage.getItem('usuarioId');
    const idPerfil = id || usuarioId;

    const [usuario, setUsuario] = useState<any>(null);
    const [publicaciones, setPublicaciones] = useState<any[]>([]);
    const [nuevaPublicacion, setNuevaPublicacion] = useState('');
    const [fotoPublicacion, setFotoPublicacion] = useState<File | null>(null);
    const [esPropioPerfil, setEsPropioPerfil] = useState(false);
    const [comentarioTexto, setComentarioTexto] = useState<{ [key: number]: string }>({});
    const [reseñas, setReseñas] = useState<any[]>([]);

    useEffect(() => {
      if (!usuarioId || !idPerfil) return;

      setEsPropioPerfil(idPerfil === usuarioId);

      fetch(`${API_URL}/api/usuarios/${idPerfil}`)
        .then((res) => res.json())
        .then((data) => setUsuario(data))
        .catch((err) => console.error('Error al cargar perfil', err));

      fetch(`${API_URL}/api/publicaciones/${idPerfil}?solicitanteId=${usuarioId}`)
        .then(res => res.json())
        .then(data => setPublicaciones(data))
        .catch(err => console.error('Error al cargar publicaciones', err));

      fetch(`${API_URL}/api/historialpuntuacion/${idPerfil}`)
        .then(res => res.json())
        .then(data => setReseñas(data))
        .catch(err => console.error('Error al cargar reseñas', err));
    }, [usuarioId, idPerfil]);

    const handlePublicar = async () => {
      await Toast.show({ text: '📤 Subiendo publicación...' });
      

      if (!nuevaPublicacion.trim() && !fotoPublicacion) return;

            const validarDuracionVideo = (file: File): Promise<boolean> => {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src);
      resolve(video.duration <= 30);
    };
    video.src = URL.createObjectURL(file);
  });
};
if (fotoPublicacion && fotoPublicacion.type.startsWith('video/')) {
  const esValido = await validarDuracionVideo(fotoPublicacion);
  if (!esValido) {
    await Toast.show({ text: '⚠️ El video no puede superar los 30 segundos' });
    return;
  }
}

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
        console.error('Error al publicar', err);
      }
    };

    const handleEliminarPublicacion = async (publicacionId: number) => {
      try {
        await fetch(`${API_URL}/api/publicaciones/${publicacionId}`, {
          method: 'DELETE'
        });
        setPublicaciones(publicaciones.filter(p => p.id !== publicacionId));
      } catch (err) {
        console.error('Error al eliminar publicación', err);
      }
    };

    const comentar = async (publicacionId: number) => {
      const contenido = comentarioTexto[publicacionId];
      if (!contenido?.trim()) return;

      const res = await fetch(`${API_URL}/api/publicaciones/${publicacionId}/comentarios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuarioId, contenido })
      });
      const nuevoComentario = await res.json();

      setPublicaciones(prev => prev.map(publi =>
        publi.id === publicacionId
          ? {
              ...publi,
              Comentarios: Array.isArray(publi.Comentarios)
                ? [...publi.Comentarios, nuevoComentario]
                : [nuevoComentario]
            }
          : publi
      ));
      setComentarioTexto(prev => ({ ...prev, [publicacionId]: '' }));
    };

    const toggleLike = async (publicacionId: number) => {
      try {
        const res = await fetch(`${API_URL}/api/publicaciones/${publicacionId}/like`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ usuarioId })
        });
        const updated = await res.json();
        setPublicaciones(prev => prev.map(publi =>
          publi.id === publicacionId ? { ...publi, Likes: updated.Likes } : publi
        ));
      } catch (err) {
        console.error('Error al dar me gusta', err);
      }
    };

    if (!usuario) return <p>Cargando perfil...</p>;

    const promedio = reseñas.length > 0
      ? (reseñas.reduce((sum, r) => sum + r.puntaje, 0) / reseñas.length).toFixed(1)
      : null;

    return (
      <>
        <Navbar />
        <div className="perfil-container">
          <div className="perfil-card">
            <div className="perfil-foto">
          {esPropioPerfil ? (
    <CambiarFotoPerfil
      usuarioId={usuarioId || ''}
      fotoActual={usuario.fotoPerfil}
      onFotoActualizada={(nuevaUrl) =>
        setUsuario((prev: any) => ({ ...prev, fotoPerfil: nuevaUrl }))
      }
    />
  ) : (
    <img
      src={usuario.fotoPerfil}
      alt="foto perfil"
      className="perfil-foto-img"
    />
  )}

            </div>

            <h2>{usuario.nombre}</h2>
            <p className="perfil-email">📧 {usuario.email}</p>
            <div className="perfil-datos">
              <p><strong>Localidad:</strong> {usuario.localidad}</p>
              <p><strong>Partidos Jugados:</strong> {usuario.partidosJugados || 0}</p>
            <p><strong>Sexo:</strong> {
    usuario.sexo === 'masculino'
      ? 'Masculino'
      : usuario.sexo === 'femenino'
        ? 'Femenino'
        : 'No especificado'
  }</p>

              <p><strong>Edad:</strong> {usuario.edad} años</p>


              <div className="deportes-favoritos">
                <strong>Deportes Favoritos:</strong>
                <div className="badge-container">
                  {Array.isArray(usuario.deportes) && usuario.deportes.length > 0
                    ? usuario.deportes.map((dep: string, index: number) => (
                        <span key={index} className="deporte-badge">{dep}</span>
                      ))
                    : <span style={{ fontStyle: 'italic', color: '#777' }}>N/A</span>}
                </div>
              </div>

              {promedio && (
                <p><strong>⭐ Promedio de Calificación:</strong> {promedio} / 5</p>
              )}
            </div>
          </div>

          {reseñas.length > 0 && (
            <div className="reseñas-box">
              <h3>Reseñas</h3>
              <ul className="reseñas-lista">
                {reseñas.map((r, index) => (
                  <li key={index} className="reseña-item">
                    <div className="reseña-contenido">
                      {r.Calificador?.fotoPerfil && (
                        <img
                          src={r.Calificador.fotoPerfil}
                          alt="calificador"
                          className="reseña-foto"
                        />
                      )}
                      <div>
                        <p><strong>{r.Calificador?.nombre || 'Anon'}:</strong> {r.comentario || '(Sin comentario)'}</p>
                        <div className="estrella-row">
                          {[1, 2, 3, 4, 5].map((n) => (
                            <span key={n} className={n <= r.puntaje ? 'estrella llena' : 'estrella'}>★</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="muro">
            {esPropioPerfil && (
              <>
                <h3>Muro</h3>
                <textarea
                  placeholder="¿Qué querés compartir?"
                  value={nuevaPublicacion}
                  onChange={(e) => setNuevaPublicacion(e.target.value)}
                ></textarea>
              <input
  type="file"
  accept="image/jpeg,image/png,video/mp4,video/webm"

  onChange={(e) => setFotoPublicacion(e.target.files?.[0] || null)}
/>

                <button onClick={handlePublicar}>Publicar</button>
              </>
            )}

            <div className="publicaciones">
              {publicaciones.map((publi, index) => (
                <div key={index} className="publicacion">
                  <div className="autor-publicacion">
                    {publi.Usuario?.fotoPerfil && (
                      <img src={publi.Usuario.fotoPerfil} alt="autor" className="autor-foto" />
                    )}
                    <p><strong>{publi.Usuario?.nombre || usuario.nombre}</strong></p>
                  </div>
                  <p>{publi.contenido}</p>
                 {publi.foto && (
  publi.foto.endsWith('.mp4') ? (
 <video
  controls
  playsInline
  preload="metadata"
  onClick={(e) => {
    const video = e.currentTarget;
    if (video.requestFullscreen) {
      video.requestFullscreen();
    } else if ((video as any).webkitEnterFullscreen) {
      (video as any).webkitEnterFullscreen(); // iOS fallback
    }
  }}
>
  <source src={publi.foto} type="video/mp4" />
  Tu navegador no soporta el video.
</video>


  ) : (
    <img src={publi.foto} alt="foto" className="foto-publicacion" />
  )
)}

                  <div className="like-section">
                    <button onClick={() => toggleLike(publi.id)}>
                      ❤️ {publi.Likes?.length || 0} Me gusta
                    </button>
                  </div>

                  <div className="comentarios">
                    {Array.isArray(publi.Comentarios) && publi.Comentarios.length > 0 ? (
                      publi.Comentarios.map((c: any, idx: number) => (
                        <div key={idx} className="comentario">
                          {c.Usuario?.fotoPerfil && (
                            <img
                              src={c.Usuario.fotoPerfil}
                              alt="comentador"
                              className="comentario-foto"
                            />
                          )}
                          <strong>{c.Usuario?.nombre || 'Anon'}:</strong> {c.contenido}
                        </div>
                      ))
                    ) : (
                      <div className="comentario-vacio">Sé el primero en comentar 🗨️</div>
                    )}
                  </div>

                  <div className="formulario-comentario">
                    <input
                      type="text"
                      placeholder="Escribe un comentario..."
                      value={comentarioTexto[publi.id] || ''}
                      onChange={e => setComentarioTexto(prev => ({ ...prev, [publi.id]: e.target.value }))}
                    />
                    <button onClick={() => comentar(publi.id)}>Comentar</button>
                  </div>

                  {esPropioPerfil && (
                    <button
                      onClick={() => handleEliminarPublicacion(publi.id)}
                      className="btn-eliminar"
                    >
                      🗑️ Eliminar
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </>
    );
  };

  export default PerfilUsuarioPage;
