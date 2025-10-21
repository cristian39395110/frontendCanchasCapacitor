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
  classNameItem?: string;
  classNameBadge?: string;
};

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
  const [claimed, setClaimed] = useState<number[]>([]); // ✅ definir ANTES de derivadas

  const TIERS = [40, 100]; // podés sumar 200, 500, etc.

  const q = useMemo(() => {
    const params = new URLSearchParams();
    if (soloVerificados) params.set("soloVerificados", "1");
    if (distinctDevice) params.set("distinctDevice", "1");
    return params.toString();
  }, [soloVerificados, distinctDevice]);

  // Cargar conteo
  useEffect(() => {
    if (!usuarioId) return;
    (async () => {
      try {
        const r = await fetch(`${apiUrl}/api/usuarios/${usuarioId}/referidos/count?${q}`);
        const d = await r.json();
        setCount(Number(d?.total || 0));
      } catch {
        setCount(0);
      }
    })();
  }, [usuarioId, apiUrl, q]);

  // Cargar tiers reclamados
  useEffect(() => {
    if (!usuarioId) return;
    (async () => {
      try {
        const r = await fetch(`${apiUrl}/api/usuarios/${usuarioId}/referidos/premios`);
        const d = await r.json(); // { claimed: number[] }
        setClaimed(Array.isArray(d?.claimed) ? d.claimed : []);
      } catch {
        setClaimed([]);
      }
    })();
  }, [usuarioId, apiUrl]);

  // Derivadas
  const claimableTier = TIERS.find((t) => count >= t && !claimed.includes(t)) ?? null;
  const nextTier = TIERS.find((t) => count < t) ?? null;

  // Progreso hacia el próximo tier (o 100% si no hay próximo)
  const currentBase = (() => {
    const alcanzados = [0, ...TIERS.filter((t) => count >= t)];
    return Math.max(...alcanzados);
  })();
  const target = nextTier ?? currentBase;
  const tramo = Math.max(1, target - currentBase);
  const progresoRaw = (count - currentBase) / tramo;
  const progreso = nextTier ? Math.max(0, Math.min(1, progresoRaw)) : 1; // ✅ 100% si no hay próximo
  const porcentaje = Math.round(progreso * 100);

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

  const reclamarPremio = async () => {
    if (!claimableTier || claiming) return;
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Debes iniciar sesión para reclamar el premio.");
      return;
    }
    setClaiming(true);
    try {
      const r = await fetch(`${apiUrl}/api/usuarios/${usuarioId}/referidos/reclamar`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ tier: claimableTier }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d?.error || "No se pudo reclamar el premio");

      const nuevo = [...new Set([...claimed, claimableTier])];
      setClaimed(nuevo);

      alert(d?.mensaje || `🎉 ¡Premio de ${claimableTier} referidos reclamado!`);
    } catch (e: any) {
      alert(e?.message || "No se pudo reclamar el premio en este momento.");
    } finally {
      setClaiming(false);
    }
  };

  return (
    <>
      {/* Ítem del menú */}
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
            <div className="referidos-close" onClick={() => setOpen(false)}>
              ×
            </div>

            <h3 style={{ marginTop: 0 }}>👥 Tus referidos</h3>

            <p className="referidos-info">
              {soloVerificados && "Mostrando solo verificados"}
              {distinctDevice && " · 1 por dispositivo"}
            </p>

            {/* Estado / Premio */}
            <div className="referidos-head">
              <div className="referidos-total">
                <strong>{count}</strong>
                {nextTier ? <> / {nextTier}</> : <>+</>}
              </div>

              {claimableTier ? (
                <button
                  className="referidos-claim-btn"
                  onClick={reclamarPremio}
                  disabled={claiming}
                >
                  {claiming ? "Reclamando..." : `🎁 Reclamar premio (${claimableTier})`}
                </button>
              ) : (
                <div className="referidos-restantes">
                  {nextTier ? (
                    <>
                      Te faltan <strong>{nextTier - count}</strong> para el premio de {nextTier}
                    </>
                  ) : (
                    <>¡Seguí sumando! 🎯</>
                  )}
                </div>
              )}
            </div>

            {/* Barra de progreso */}
            <div
              className="ref-progress"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={porcentaje}
            >
              <div className="ref-progress-fill" style={{ width: `${porcentaje}%` }} />
            </div>
            <p className="ref-progress-label">
              {nextTier ? (
                <>
                  Progreso: <strong>{porcentaje}%</strong> ({count - currentBase}/
                  {target - currentBase})
                </>
              ) : (
                <>¡Máximo alcanzado de momento! 💪</>
              )}
            </p>

            {/* Mensaje entre 40 y 100 (una sola vez) */}
            {count >= 40 && count < 100 && !claimed.includes(100) && (
              <p style={{ marginTop: 6, opacity: 0.9 }}>
                🔔 Ya alcanzaste el de <strong>40</strong>. A los <strong>100</strong> tenés otro
                premio.
              </p>
            )}

            {loading ? (
              <p>Cargando…</p>
            ) : lista.length === 0 ? (
              <p>No tenés referidos todavía.</p>
            ) : (
              <ul className="referidos-list">
                {lista.map((r) => (
                  <li key={r.id} className="referido-item">
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
