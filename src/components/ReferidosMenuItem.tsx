import React, { useEffect, useMemo, useState } from "react";
import { FaUsers } from "react-icons/fa";

type Referido = {
  id: number;
  nombre?: string;
  createdAt: string;
};

type Props = {
  usuarioId: string | number;
  apiUrl: string;
  soloVerificados?: boolean;
  distinctDevice?: boolean;
  // Para integrarlo con tu menú existente:
  classNameItem?: string;   // por defecto "menu-item"
  classNameBadge?: string;  // por defecto "badge"
};

const PRIZE_THRESHOLD = 40;

const ReferidosMenuItem: React.FC<Props> = ({
  usuarioId,
  apiUrl,
  soloVerificados = true,
  distinctDevice = true,
  classNameItem = "menu-item",
  classNameBadge = "badge",
}) => {
  const [count, setCount] = useState<number>(0);
  const [open, setOpen] = useState(false);
  const [lista, setLista] = useState<Referido[]>([]);
  const [loading, setLoading] = useState(false);
  const [claiming, setClaiming] = useState(false);

  const q = useMemo(() => {
    const params = new URLSearchParams();
    if (soloVerificados) params.set("soloVerificados", "1");
    if (distinctDevice) params.set("distinctDevice", "1");
    return params.toString();
  }, [soloVerificados, distinctDevice]);

  useEffect(() => {
    if (!usuarioId) return;
    (async () => {
      try {
        const r = await fetch(`${apiUrl}/api/usuarios/${usuarioId}/referidos/count?${q}`);
        const d = await r.json();
        const total = Number(d?.total || 0);
        setCount(total);
      } catch {
        setCount(0);
      }
    })();
  }, [usuarioId, apiUrl, q]);

  const abrirModal = async () => {
    setOpen(true);
    setLoading(true);
    try {
      const r = await fetch(`${apiUrl}/api/usuarios/${usuarioId}/referidos?${q}&limit=100`);
      const d = await r.json();
      setLista(Array.isArray(d) ? d : []);
    } catch {
      setLista([]);
    } finally {
      setLoading(false);
    }
  };

  const puedeReclamar = count >= PRIZE_THRESHOLD;

 const reclamarPremio = async () => {
  if (!puedeReclamar || claiming) return;
  setClaiming(true);
  try {
    const token = localStorage.getItem("token"); // tu JWT guardado tras login
    const r = await fetch(`${apiUrl}/api/usuarios/${usuarioId}/referidos/reclamar`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`, // 🔒 token aquí
      },
      body: JSON.stringify({ total: count }),
    });
    const d = await r.json();
    if (!r.ok) throw new Error(d?.error || "No se pudo reclamar el premio");
    alert(d?.mensaje || "🎉 ¡Premio reclamado con éxito!");
  } catch (e: any) {
    alert(e?.message || "No se pudo reclamar el premio en este momento.");
  } finally {
    setClaiming(false);
  }
};


  return (
    <>
      {/* Ítem del menú (usa tus clases) */}
      <div className={`${classNameItem} referidos-item`} onClick={abrirModal}>
        <FaUsers /> Mis referidos
        <span className={`${classNameBadge} referidos-badge`} style={{ marginLeft: "auto" }}>
          {count}
        </span>
      </div>

      {/* Modal */}
      {open && (
        <div className="referidos-overlay" onClick={() => setOpen(false)}>
          <div className="referidos-modal" onClick={(e) => e.stopPropagation()}>
            <div className="referidos-close" onClick={() => setOpen(false)}>×</div>

            <h3 style={{ marginTop: 0 }}>👥 Tus referidos</h3>

            <p className="referidos-info">
              {soloVerificados && "Mostrando solo verificados"}
              {distinctDevice && " · 1 por dispositivo"}
            </p>

            {/* Estado / Premio */}
            <div className="referidos-head">
              <div className="referidos-total">
                <strong>{count}</strong> / {PRIZE_THRESHOLD}
              </div>

              {puedeReclamar ? (
                <button
                  className="referidos-claim-btn"
                  onClick={reclamarPremio}
                  disabled={claiming}
                >
                  {claiming ? "Reclamando..." : "🎁 Reclamar premio"}
                </button>
              ) : (
                <div className="referidos-restantes">
                  Te faltan <strong>{PRIZE_THRESHOLD - count}</strong> para el premio
                </div>
              )}
            </div>

            {loading ? (
              <p>Cargando…</p>
            ) : lista.length === 0 ? (
              <p>No tenés referidos todavía.</p>
            ) : (
              <ul className="referidos-list">
                {lista.map((r) => (
                  <li key={r.id} className="referido-item">
                    {/* nombre en color destacado */}
                    <span className="referido-nombre">{r.nombre || "Usuario"}</span>
                    <small className="referido-fecha">
                      Alta: {new Date(r.createdAt).toLocaleDateString()}
                    </small>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default ReferidosMenuItem;
