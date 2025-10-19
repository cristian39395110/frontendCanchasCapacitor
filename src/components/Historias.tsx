import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { API_URL } from "../config";
import { socket } from "../utils/socket";
import "./Historias.css";

type Historia = {
  id: number;
  usuarioId: number;
  usuarioNombre: string;
  usuarioFoto?: string;
  mediaUrl: string;              // jpg/png/mp4 (url final)
  tipo: "imagen" | "video";
  createdAt: string;             // ISO
  // extras backend
  descripcion?: string;
  linkUrl?: string;
  phoneNumber?: string;
  vistos?: number;
  vistoPorMi?: boolean;
  likes?: number;
  likedByMe?: boolean;
  comentariosCount?: number;
  thumbUrl?: string;             // miniatura para videos
};

type Comentario = {
  id: number;
  historiaId: number;
  usuarioId: number;
  contenido: string;
  createdAt: string;
  Autor?: {
    id: number;
    nombre: string;
    fotoPerfil?: string;
  };
};

type HistoriasPorUsuario = {
  usuarioId: number;
  usuarioNombre: string;
  usuarioFoto?: string;
  historias: Historia[];
  vista?: boolean;               // true = todas vistas por mí
};

const ES_24H = (iso: string) =>
  Date.now() - new Date(iso).getTime() < 24 * 60 * 60 * 1000;

export default function Historias() {
  const usuarioId = Number(localStorage.getItem("usuarioId"));
  const [items, setItems] = useState<Historia[]>([]);
  const [abierto, setAbierto] = useState(false);
  const [idxGrupo, setIdxGrupo] = useState(0);
  const [idxHistoria, setIdxHistoria] = useState(0);
  const [subiendo, setSubiendo] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Modal de comentarios
  const [comentariosOpen, setComentariosOpen] = useState(false);

  // Pausas de auto-avance
  const [isTyping, setIsTyping] = useState(false);

  // viewer fit (auto cover/contain según proporción real)
  const [fit, setFit] = useState<"cover" | "contain">("cover");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  // inputs para SUBIR historia
  const [desc, setDesc] = useState("");
  const [link, setLink] = useState("");
  const [phone, setPhone] = useState("");

  // comentarios del modal
  const [comentarios, setComentarios] = useState<Comentario[]>([]);
  const [comentLoading, setComentLoading] = useState(false);
  const [comentTexto, setComentTexto] = useState("");
  // Estado opcional para deshabilitar mientras borra
const [, setDeleting] = useState(false);

// Eliminar historia actual (solo propia) con optimista + rollback
const eliminarHistoria = async (h: Historia) => {
  if (!h) return;

  // snapshot para posible rollback
  const prevItems = items;
  const prevAbierto = abierto;
  const prevIdxGrupo = idxGrupo;
  const prevIdxHistoria = idxHistoria;

  try {
    setDeleting(true);

    // Optimista: sacar del listado ya
    setItems(prev => prev.filter(x => x.id !== h.id));

    // Si era la única del grupo, cierro visor; si no, avanzo
    const g = grupos[idxGrupo];
    if (!g || g.historias.length <= 1) {
      setAbierto(false);
    } else {
      avanzar();
    }

    const res = await fetch(
      `${API_URL}/api/historias/${h.id}?usuarioId=${usuarioId}`,
      { method: "DELETE" }
    );
    if (!res.ok) throw new Error("DELETE falló");
  } catch (e) {
    console.error("❌ Error al eliminar historia:", e);
    // rollback duro
    setItems(prevItems);
    setAbierto(prevAbierto);
    setIdxGrupo(prevIdxGrupo);
    setIdxHistoria(prevIdxHistoria);
    alert("No se pudo eliminar la historia.");
  } finally {
    setShowConfirm(false);
    setDeleting(false);
  }
};


  // Bloquear scroll cuando visor o modal comentarios están abiertos
  useEffect(() => {
    const shouldLock = abierto || comentariosOpen;
    const prev = document.body.style.overflow;
    if (shouldLock) document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev || ""; };
  }, [abierto, comentariosOpen]);

  // Cargar historias (24h)
  useEffect(() => {
    if (!usuarioId) return;
    (async () => {
      try {
        const r = await fetch(`${API_URL}/api/historias?usuarioId=${usuarioId}`);
        if (!r.ok) throw new Error("GET historias failed");
        const data: Historia[] = await r.json();
        setItems(data.filter(h => ES_24H(h.createdAt)));
      } catch (e) {
        console.error("❌ Error cargando historias:", e);
      }
    })();
  }, [usuarioId]);

  // Socket: join/leave + listeners
  useEffect(() => {
    if (!usuarioId) return;

    socket.emit("join", `usuario-${usuarioId}`);

    const onNueva = ({ historia }: { historia: Historia }) => {
      if (!ES_24H(historia.createdAt)) return;
      setItems(prev => (prev.some(x => x.id === historia.id) ? prev : [historia, ...prev]));
    };

    const onLike = ({ historiaId, total }: { historiaId: number; total: number }) => {
      setItems(prev => prev.map(h => h.id === historiaId ? { ...h, likes: total } : h));
    };

    const onComentario = ({ historiaId, comentario }: { historiaId: number; comentario: Comentario }) => {
      const h = grupos[idxGrupo]?.historias[idxHistoria];
      if (h && h.id === historiaId && comentariosOpen) {
        setComentarios(prev => [...prev, comentario]);
      }
      setItems(prev => prev.map(x => x.id === historiaId
        ? { ...x, comentariosCount: (x.comentariosCount || 0) + 1 }
        : x));
    };

    const onEliminada = ({ id }: { id: number }) => {
      setItems(prev => prev.filter(h => h.id !== id));
    };

    socket.on("nueva-historia", onNueva);
    socket.on("historia-like", onLike);
    socket.on("historia-comentario", onComentario);
    socket.on("historia-eliminada", onEliminada);

    return () => {
      socket.emit("leave", `usuario-${usuarioId}`);
      socket.off("nueva-historia", onNueva);
      socket.off("historia-like", onLike);
      socket.off("historia-comentario", onComentario);
      socket.off("historia-eliminada", onEliminada);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuarioId, idxGrupo, idxHistoria, comentariosOpen]);

  // Agrupar por usuario y calcular "vista"
  const grupos: HistoriasPorUsuario[] = useMemo(() => {
    const map = new Map<number, HistoriasPorUsuario>();
    for (const h of items) {
      if (!ES_24H(h.createdAt)) continue;
      if (!map.has(h.usuarioId)) {
        map.set(h.usuarioId, {
          usuarioId: h.usuarioId,
          usuarioNombre: h.usuarioNombre,
          usuarioFoto: h.usuarioFoto,
          historias: [],
        });
      }
      map.get(h.usuarioId)!.historias.push(h);
    }
    return Array.from(map.values()).map(g => {
      const todasVistas = g.historias.every(h =>
        h.vistoPorMi === true || localStorage.getItem(`hist_vista_${h.id}`) === "1"
      );
      return { ...g, vista: todasVistas };
    });
  }, [items]);

  const ajustarFitImagen = useCallback((img: HTMLImageElement | null) => {
    if (!img) return;
    const STAGE_RATIO = 9 / 16;
    const r = img.naturalWidth / img.naturalHeight;
    setFit(r > STAGE_RATIO ? "contain" : "cover");
  }, []);

  const ajustarFitVideo = useCallback((vid: HTMLVideoElement | null) => {
    if (!vid) return;
    const STAGE_RATIO = 9 / 16;
    const r = (vid.videoWidth || 9) / (vid.videoHeight || 16);
    setFit(r > STAGE_RATIO ? "contain" : "cover");
  }, []);

  // reset fit al cambiar
  useEffect(() => {
    setFit("cover");
  }, [idxGrupo, idxHistoria, abierto]);

  const abrirGrupo = async (i: number) => {
    setIdxGrupo(i);
    setIdxHistoria(0);
    setAbierto(true);
    const primera = grupos[i].historias[0];
    marcarVista(primera);
    await cargarComentarios(primera?.id);
  };

  const cargarComentarios = async (historiaId?: number) => {
    if (!historiaId) return;
    setComentLoading(true);
    try {
      const r = await fetch(`${API_URL}/api/historias/${historiaId}/comentarios`);
      if (!r.ok) throw new Error("GET comentarios failed");
      const data: Comentario[] = await r.json();
      setComentarios(data);
    } catch (e) {
      console.error("❌ Error cargando comentarios:", e);
      setComentarios([]);
    } finally {
      setComentLoading(false);
    }
  };

  useEffect(() => {
    if (!abierto) return;
    const h = grupos[idxGrupo]?.historias[idxHistoria];
    if (h?.id) cargarComentarios(h.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierto, idxGrupo, idxHistoria]);

  const marcarVista = (h?: Historia) => {
    if (!h) return;
    if (!localStorage.getItem(`hist_vista_${h.id}`)) {
      localStorage.setItem(`hist_vista_${h.id}`, "1");
      fetch(`${API_URL}/api/historias/${h.id}/visto`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuarioId }),
      }).catch(() => {});
      setItems(prev => prev.map(x => (x.id === h.id ? { ...x, vistoPorMi: true } : x)));
    }
  };

  // === Auto-avance (pausado si estás escribiendo o con el modal de comentarios abierto) ===
  useEffect(() => {
    if (!abierto) return;
    const h = grupos[idxGrupo]?.historias[idxHistoria];
    if (!h) return;

    // Pausar si está el modal de comentarios o si el usuario está escribiendo
    if (comentariosOpen || isTyping) return;

    let t: any;
    if (h.tipo === "imagen") {
      t = setTimeout(avanzar, 5000);
    } else {
      const v = videoRef.current;
      if (v) {
        const onEnd = () => avanzar();
        v.addEventListener("ended", onEnd);
        return () => v.removeEventListener("ended", onEnd);
      }
    }
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierto, idxGrupo, idxHistoria, comentariosOpen, isTyping]);

  const avanzar = () => {
    const g = grupos[idxGrupo];
    if (!g) return;
    if (idxHistoria + 1 < g.historias.length) {
      setIdxHistoria(i => {
        const next = i + 1;
        marcarVista(g.historias[next]);
        return next;
      });
    } else if (idxGrupo + 1 < grupos.length) {
      const nextGrupo = idxGrupo + 1;
      setIdxGrupo(nextGrupo);
      setIdxHistoria(0);
      marcarVista(grupos[nextGrupo].historias[0]);
    } else {
      setAbierto(false);
    }
  };

  const retroceder = () => {
    if (idxHistoria > 0) {
      setIdxHistoria(i => i - 1);
    } else if (idxGrupo > 0) {
      const gPrev = grupos[idxGrupo - 1];
      setIdxGrupo(idxGrupo - 1);
      setIdxHistoria(gPrev.historias.length - 1);
    } else {
      setAbierto(false);
    }
  };

  // Subir historia
const onSubirHistoria = async (file?: File) => {
  if (!file || !usuarioId) return;

  // Evitar doble envío si ya está subiendo
  if (subiendo) return;

  // Detección de tipo
  const mime = file.type?.toLowerCase() || "";
  const esVideo = mime.startsWith("video/");
  const esImagen = mime.startsWith("image/");

  // Validaciones de tipo
  if (!esVideo && !esImagen) {
    alert("Formato no soportado. Subí una imagen o un video MP4.");
    return;
  }
  if (esVideo && mime !== "video/mp4") {
    alert("Solo se permite video/mp4 para historias.");
    return;
  }

  // Límite de tamaño (mismo tope para ambos, ajustá si querés distinto)
  const MAX_BYTES = 50 * 1024 * 1024; // 50 MB
  if (file.size > MAX_BYTES) {
    alert("El archivo es muy pesado (máx. 50 MB).");
    return;
  }

  // Armar payload
  const formData = new FormData();
  formData.append("usuarioId", String(usuarioId));
  formData.append("media", file);
  if (desc.trim()) formData.append("descripcion", desc.trim());
  if (link.trim()) formData.append("linkUrl", link.trim());
  if (phone.trim()) formData.append("phoneNumber", phone.trim());

  try {
    setSubiendo(true);

    const res = await fetch(`${API_URL}/api/historias`, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const msg = await res.text().catch(() => "");
      throw new Error(`Error al subir historia${msg ? ` - ${msg}` : ""}`);
    }

    const nueva: Historia = await res.json();

    // La marco como vista por mí (como ya hacía tu código)
    localStorage.setItem(`hist_vista_${nueva.id}`, "1");

    // Inserto al principio
    setItems(prev => [nueva, ...prev]);

    // Limpio inputs controlados
    setDesc("");
    setLink("");
    setPhone("");
  } catch (err) {
    console.error("❌ Error al subir historia:", err);
    alert("No se pudo subir la historia.");
  } finally {
    setSubiendo(false);
  }
};

  // === Like/Unlike optimista (se pinta al instante) ===
  const toggleLike = async (h: Historia) => {
    const likedPrev = !!h.likedByMe;
    const likesPrev = h.likes ?? 0;

    // Optimista
    setItems(prev =>
      prev.map(x =>
        x.id === h.id
          ? { ...x, likedByMe: !likedPrev, likes: likesPrev + (likedPrev ? -1 : 1) }
          : x
      )
    );

    try {
      const r = await fetch(`${API_URL}/api/historias/${h.id}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuarioId }),
      });
      if (!r.ok) throw new Error("like failed");
      const data = await r.json(); // { ok, liked, total }
      // Ajuste final por si backend devuelve conteo distinto
      setItems(prev =>
        prev.map(x =>
          x.id === h.id ? { ...x, likedByMe: data.liked, likes: data.total } : x
        )
      );
    } catch (e) {
      console.error("❌ Error like:", e);
      // Revertir si falló
      setItems(prev =>
        prev.map(x =>
          x.id === h.id ? { ...x, likedByMe: likedPrev, likes: likesPrev } : x
        )
      );
    }
  };
// aca toque para los comentarios de hist4orias-------------------------
  // Enviar comentario (enviarAlChat opcional)
const enviarComentario = async (enviarAlChat = false) => {
  const h = grupos[idxGrupo]?.historias[idxHistoria];
  if (!h || !comentTexto.trim()) return;

  try {
    const r = await fetch(`${API_URL}/api/historias/${h.id}/comentarios`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        usuarioId,
        contenido: comentTexto.trim(),
        enviarAlChat,
        // 👇 nuevo: adjunto con la historia
        adjunto: enviarAlChat ? {
          tipo: "historia",
          historiaId: h.id,
          mediaUrl: h.mediaUrl,
          thumbUrl: h.thumbUrl || h.mediaUrl,
          autorNombre: grupos[idxGrupo]?.usuarioNombre,
        } : undefined,
      }),
    });
    if (!r.ok) throw new Error("comentario failed");
    const nuevo = await r.json();

    setComentarios(prev => [
      ...prev,
      { ...nuevo, Autor: { id: usuarioId, nombre: "Yo", fotoPerfil: "" } },
    ]);
    setComentTexto("");

    setItems(prev => prev.map(x =>
      x.id === h.id ? { ...x, comentariosCount: (x.comentariosCount || 0) + 1 } : x
    ));
  } catch (e) {
    console.error("❌ Error comentario:", e);
  }
};
// aca finalizee--------------------------------------------

  // handlers de media para ajustar fit al cargar
  const onImgLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    ajustarFitImagen(e.currentTarget);
  };
  const onVideoMetadata = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    ajustarFitVideo(e.currentTarget);
  };

  // abrir/cerrar modal comentarios
  const abrirComentarios = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setComentariosOpen(true);
  };
  const cerrarComentarios = () => setComentariosOpen(false);

  // historia actual
  const historiaActual = grupos[idxGrupo]?.historias[idxHistoria];

  return (
    <>
      {/* Tira de historias */}
      <div className="historias-strip">
        {grupos.map((g, i) => (
          <button
            key={g.usuarioId}
            className={`historia-bubble ${g.vista ? "vista" : "nueva"}`}
            onClick={() => abrirGrupo(i)}
            title={g.usuarioNombre}
          >
            <img
              src={g.usuarioFoto || "/default-avatar.png"}
              alt={g.usuarioNombre}
              loading="lazy"
            />
            <span className="hist-nombre">{g.usuarioNombre}</span>
          </button>
        ))}
      </div>

      {/* Form subir historia */}
      <div className="subir-historia">
        <div className="subir-form">
          <input
            type="text"
            placeholder="Descripción (opcional)"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
          />
          <input
            type="url"
            placeholder="Link (https://...) opcional"
            value={link}
            onChange={(e) => setLink(e.target.value)}
          />
          <input
            type="tel"
            placeholder="Teléfono (opcional)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>

        <label className="boton-subir-historia">
          {subiendo ? "Subiendo..." : "➕ Agregar historia"}
          <input
            type="file"
            accept="image/*,video/mp4"
            disabled={subiendo}
            onChange={(e) => onSubirHistoria(e.target.files?.[0] || undefined)}
          />
        </label>
      </div>

      {/* Visor modal */}
      {abierto && (
        <div className="historia-modal" onClick={avanzar}>
          <div className="historia-topbar">
            <div className="barras-progreso">
              {grupos[idxGrupo]?.historias.map((h, i) => (
                <div key={h.id} className={`barra ${i <= idxHistoria ? "llena" : ""}`} />
              ))}
            </div>

            <div className="historia-usuario">
              <img
                src={grupos[idxGrupo]?.usuarioFoto || "/default-avatar.png"}
                alt=""
              />
              <strong>{grupos[idxGrupo]?.usuarioNombre}</strong>
            </div>

            <button
              className="cerrar"
              onClick={(e) => { e.stopPropagation(); setAbierto(false); }}
            >
              ✕
            </button>
          </div>

          {/* Botón eliminar (solo si es mía) */}
          {historiaActual && historiaActual.usuarioId === usuarioId && (
            <button
              className="borrar-historia"
              onClick={(e) => {
                e.stopPropagation();
                setShowConfirm(true);
              }}
            >
              🗑️ Eliminar
            </button>
          )}

          {/* Media */}
          <div className="historia-canvas" onClick={(e) => e.stopPropagation()}>
<div className="historia-stage">
  {historiaActual?.tipo === "video" ? (
    <video
      ref={videoRef}
      src={historiaActual.mediaUrl}
      autoPlay
      playsInline
      controls
      className={`historia-media ${fit}`}
      onLoadedMetadata={onVideoMetadata}
    />
  ) : (
    <img
      ref={imgRef}
      src={historiaActual?.mediaUrl}
      alt="historia"
      className={`historia-media ${fit}`}
      onLoad={onImgLoad}
    />
  )}

  {/* Overlay flotante tipo Instagram */}
  {historiaActual && (
    <div
      className="historia-overlay"
      onClick={(e) => e.stopPropagation()} // evita avanzar al tocar el overlay
    >
      {historiaActual.descripcion && (
        <div className="overlay-desc">{historiaActual.descripcion}</div>
      )}

      <div className="overlay-cta">
        {historiaActual.linkUrl && (
          <a
            className="overlay-link"
            href={historiaActual.linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
          >
            Ver más
          </a>
        )}
        {historiaActual.phoneNumber && (
          <a
            className="overlay-tel"
            href={`tel:${historiaActual.phoneNumber}`}
            onClick={(e) => e.stopPropagation()}
          >
            Llamar
          </a>
        )}
      </div>
    </div>
  )}
  {historiaActual && (
  <div
    className="historia-overlay"
    onClick={(e) => e.stopPropagation()} // evita avanzar al tocar
  >
    {/* descripción */}
    {historiaActual.descripcion && (
      <div className="overlay-desc">{historiaActual.descripcion}</div>
    )}

    {/* link (texto clickeable simple) */}
    {historiaActual.linkUrl && (
      <a
        className="overlay-link-text"
        href={historiaActual.linkUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
      >
        {historiaActual.linkUrl.replace(/^https?:\/\//, "")}
      </a>
    )}

    {/* teléfono (solo texto) */}
    {historiaActual.phoneNumber && (
      <div className="overlay-phone">📞 {historiaActual.phoneNumber}</div>
    )}
  </div>
)}


  {/* Zonas táctiles */}
  <div className="zona retro" onClick={retroceder} />
  <div className="zona next" onClick={avanzar} />
</div>

          </div>

          {/* Acciones + meta */}
          {historiaActual && (
            <div className="hist-meta-wrap" onClick={(e) => e.stopPropagation()}>
              <div className="hist-actions">
                <button
                  className={`like-btn ${historiaActual.likedByMe ? "on" : ""}`}
                  onClick={() => toggleLike(historiaActual)}
                >
                  {historiaActual.likedByMe ? "❤️" : "🤍"} {historiaActual.likes ?? 0}
                </button>

                <button
                  className="mensajes-btn"
                  onClick={(e) => abrirComentarios(e)}
                  title="Ver comentarios"
                >
                  💬 {historiaActual.comentariosCount ?? 0} &nbsp;Mensajes
                </button>
              </div>

        
            </div>
          )}

          {/* Confirmación eliminar */}
          {showConfirm && historiaActual && (
            <div className="confirm-overlay" onClick={() => setShowConfirm(false)}>
              <div className="confirm-card" onClick={(e) => e.stopPropagation()}>
                <div>¿Eliminar esta historia?</div>
                <div className="confirm-actions">
                  <button className="btn-confirm" onClick={() => eliminarHistoria(historiaActual)}>Eliminar</button>
                  <button className="btn-cancel" onClick={() => setShowConfirm(false)}>Cancelar</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal de Comentarios */}
      {comentariosOpen && (
        <div className="coment-modal-overlay" onClick={cerrarComentarios}>
          <div className="coment-modal" onClick={(e) => e.stopPropagation()}>
            <div className="coment-modal-header">
              <div className="coment-modal-title">
                Mensajes
                {historiaActual?.comentariosCount !== undefined && (
                  <span className="coment-modal-count">
                    {historiaActual.comentariosCount}
                  </span>
                )}
              </div>
              <button className="coment-modal-close" onClick={cerrarComentarios}>✕</button>
            </div>

            <div className="coment-modal-body">
              {comentLoading ? (
                <div className="coment-loading">Cargando comentarios…</div>
              ) : comentarios.length === 0 ? (
                <div className="coment-empty">Sé el primero en comentar</div>
              ) : (
                <div className="lista-comentarios">
                  {comentarios.map((c) => (
                    <div key={c.id} className="coment-item">
                      <img src={c.Autor?.fotoPerfil || "/default-avatar.png"} alt="" />
                      <div>
                        <strong>{c.Autor?.nombre || "Anon"}</strong>
                        <div>{c.contenido}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="coment-modal-input">
              <input
                value={comentTexto}
                onChange={(e) => setComentTexto(e.target.value)}
                onFocus={() => setIsTyping(true)}
                onBlur={() => setIsTyping(false)}
                placeholder="Escribe un comentario…"
                onKeyDown={(e) => { if (e.key === "Enter") enviarComentario(false); }}
              />
              <button onClick={() => enviarComentario(false)}>Ok</button>
              <button title="Enviar también al chat" onClick={() => enviarComentario(true)}>✉️</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
