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
    const [mostrarModalReseñas, setMostrarModalReseñas] = useState(false);
    const [esAmigo, setEsAmigo] = useState(false);
const [haySolicitudPendiente, setHaySolicitudPendiente] = useState(false);
const [videoAgrandado, setVideoAgrandado] = useState<string | null>(null);

const handleEliminarComentario = async (comentarioId: number, publicacionId: number) => {
  try {
 await fetch(`${API_URL}/api/publicaciones/comentarios/${comentarioId}?usuarioId=${usuarioId}`, {
  method: 'DELETE',
});


    setPublicaciones(prev =>
      prev.map(publi =>
        publi.id === publicacionId
          ? {
              ...publi,
              Comentarios: publi.Comentarios.filter((c: any) => c.id !== comentarioId),
            }
          : publi
      )
    );
  } catch (err) {
    console.error('❌ Error al eliminar comentario', err);
  }
};



useEffect(() => {
  if (!usuarioId || !idPerfil) return;

  setEsPropioPerfil(idPerfil === usuarioId);

  // 1️⃣ Primero traemos los datos del usuario
  fetch(`${API_URL}/api/usuarios/${idPerfil}?solicitanteId=${usuarioId}`)
    .then((res) => res.json())
    .then((data) => {
      setUsuario(data);
      setEsAmigo(data.esAmigo);
      setHaySolicitudPendiente(data.haySolicitudPendiente);

      // 2️⃣ Si somos amigos o es nuestro perfil → cargamos publicaciones
      if (data.esAmigo || idPerfil === usuarioId) {
        fetch(`${API_URL}/api/publicaciones/${idPerfil}?solicitanteId=${usuarioId}`)
          .then(res => res.json())
          .then(data => setPublicaciones(data))
          .catch(err => console.error('Error al cargar publicaciones', err));
      }
    });

  // Cargar reseñas (esto sí puede ir siempre)
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
console.log("id de id  ",id)
      const formData = new FormData();
      formData.append('contenido', nuevaPublicacion);
      formData.append('usuarioId', String(usuarioId));
formData.append('perfilId', String(idPerfil)); // siempre será propio o ajeno



      if (fotoPublicacion) formData.append('foto', fotoPublicacion);


   try {
  const res = await fetch(`${API_URL}/api/publicaciones`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const error = await res.json();
    await Toast.show({ text: `❌ ${error.error || 'Error al publicar'}` });
    return;
  }

  const nueva = await res.json();
  setPublicaciones([nueva, ...publicaciones]);
  setNuevaPublicacion('');
  setFotoPublicacion(null);
} catch (err) {
  console.error('Error al publicar', err);
  await Toast.show({ text: '❌ Error de red al publicar' });
}

    };

   const handleEliminarPublicacion = async (publicacionId: number) => {
  try {
    const res = await fetch(`${API_URL}/api/publicaciones/${publicacionId}?usuarioId=${usuarioId}`, {
      method: 'DELETE',
    });

    if (!res.ok) {
      const error = await res.json();
      await Toast.show({ text: `❌ ${error.error || 'No se pudo eliminar'}` });
      return;
    }

    setPublicaciones(publicaciones.filter(p => p.id !== publicacionId));
    await Toast.show({ text: '✅ Publicación eliminada' });
  } catch (err) {
    console.error('Error al eliminar publicación', err);
    await Toast.show({ text: '❌ Error al eliminar publicación' });
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

const agregarAmigo = async () => {
  try {
     const res = await fetch(`${API_URL}/api/amistad/solicitar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuarioId: usuarioId, amigoId: idPerfil }) // 👈 FIXED
    });

    const data = await res.json();
    await Toast.show({ text: data.mensaje || 'Solicitud enviada ✅' });
    setHaySolicitudPendiente(true);
  } catch (err) {
    await Toast.show({ text: '❌ Error al enviar solicitud' });
  }
};

const eliminarAmistad = async () => {
  try {
    const res = await fetch(`${API_URL}/api/amigos/eliminar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuarioId, amigoId: idPerfil })
    });

    const data = await res.json();
    await Toast.show({ text: data.mensaje || 'Amistad eliminada' });

    setEsAmigo(false);
    setHaySolicitudPendiente(false);
  } catch (err) {
    await Toast.show({ text: '❌ Error al eliminar amistad' });
  }
};


const cancelarSolicitud = async () => {
  try {
    const res = await fetch(`${API_URL}/api/amigos/cancelar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuarioId, amigoId: idPerfil })
    });

    const data = await res.json();
    await Toast.show({ text: data.mensaje || 'Solicitud cancelada' });
    setHaySolicitudPendiente(false);
  } catch (err) {
    await Toast.show({ text: '❌ Error al cancelar solicitud' });
  }
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
 {!esPropioPerfil && (
  <div style={{ marginTop: '10px' }}>
    {esAmigo ? (
      <button className="boton-accion" onClick={eliminarAmistad}>❌ Eliminar amistad</button>
    ) : haySolicitudPendiente ? (
      <button className="boton-accion" onClick={cancelarSolicitud}>❌ Cancelar solicitud</button>
    ) : (
      <button className="boton-accion" onClick={agregarAmigo}>➕ Agregar como amigo</button>
    )}
  </div>
)}


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

            <button
  className="btn-ver-reseñas"
  onClick={() => setMostrarModalReseñas(true)}
>
  📋 Ver Reseñas
</button>


{mostrarModalReseñas && (
  <div className="modal-overlay" onClick={() => setMostrarModalReseñas(false)}>
    <div className="modal-contenido" onClick={(e) => e.stopPropagation()}>
      <button className="cerrar-modal" onClick={() => setMostrarModalReseñas(false)}>❌</button>
      <h2>Reseñas del Usuario</h2>

      {reseñas.length > 0 ? (
        reseñas.map((r, index) => (
  <React.Fragment key={index}>
    <div className="reseña-item">
      {r.Calificador?.fotoPerfil && (
        <img src={r.Calificador.fotoPerfil} className="reseña-foto" />
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
   {index < reseñas.length - 1 && <hr className="reseña-divider" />}
  </React.Fragment>
))

      ) : (
        <p>Este usuario aún no tiene reseñas.</p>
      )}
    </div>
  </div>
)}

          </div>



          
          <div className="muro">
           {(esPropioPerfil || esAmigo) ? (
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
             ) : null}
            

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
      <div
        key={idx}
        className={`comentario ${c.usuarioId === Number(usuarioId) ? 'comentario-propio' : ''}`}
      >
        {c.Usuario?.fotoPerfil && (
          <img
            src={c.Usuario.fotoPerfil}
            alt="comentador"
            className="comentario-foto"
          />
        )}
        <strong>{c.Usuario?.nombre || 'Anon'}:</strong> {c.contenido}

        {c.usuarioId === Number(usuarioId) && (
          <button
            className="btn-eliminar-comentario"
            onClick={() => handleEliminarComentario(c.id, publi.id)}
          >
            🗑️
          </button>
        )}
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
{(esPropioPerfil || usuarioId === String(publi.usuarioId)) && (
  <button onClick={() => handleEliminarPublicacion(publi.id)}>🗑️ Eliminar</button>
)}


                </div>
              ))}
            </div>
          </div>
        </div>
        {videoAgrandado && (
  <div className="modal-video" onClick={() => setVideoAgrandado(null)}>
    <video src={videoAgrandado} controls autoPlay />
  </div>
)}

      </>
    );
  };

  export default PerfilUsuarioPage;
