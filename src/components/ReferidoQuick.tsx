// src/components/ReferidoQuick.tsx
import { useMemo, useState } from "react";
import "./ReferidoQuick.css";

type Props = {
  codigo: string;
};

export default function ReferidoQuick({ codigo }: Props) {
  const [open, setOpen] = useState(false);

  const link = useMemo(
    () =>
      `https://play.google.com/store/apps/details?id=com.canchas.app&referrer=${encodeURIComponent(
        "ref=" + codigo
      )}`,
    [codigo]
  );

  // 🔹 Mensaje predeterminado para compartir
  const mensajePredeterminado = useMemo(
    () =>
      `🔥 Ayudame a ganar increíbles premios descargando la app *MatchClub*.\n\n` +
      `📲 Descargala gratis desde Google Play:\n${link}\n\n` +
      `Cuando te registres, pegá este código en el campo "Referido":\n👉 *${codigo}*\n\n` +
      `¡Sumate a los partidos, ganá puntos y participá por premios! ⚽🏆`,
    [link, codigo]
  );

  const copiarMensaje = async () => {
    try {
      await navigator.clipboard.writeText(mensajePredeterminado);
      alert("✅ Mensaje copiado");
    } catch {
      alert("No se pudo copiar automáticamente. Copialo manualmente.");
    }
  };

  const compartirMensaje = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "MatchClub",
          text: mensajePredeterminado,
        });
      } catch {
        window.open(`https://wa.me/?text=${encodeURIComponent(mensajePredeterminado)}`, "_blank");
      }
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(mensajePredeterminado)}`, "_blank");
    }
  };

  return (
    <>
      <button className="icon-round" title="Invitar" onClick={() => setOpen(true)}>
        🎁
      </button>

      {open && (
        <div className="rq-overlay" onClick={() => setOpen(false)}>
          <div className="rq-modal" onClick={(e) => e.stopPropagation()}>
            <h4>Invitá amigos 🏆</h4>
            <p>
              Tu código de referido: <b>{codigo}</b>
            </p>

            <textarea
              readOnly
              value={mensajePredeterminado}
              style={{
                width: "100%",
                minHeight: 130,
                marginTop: 8,
                borderRadius: 8,
                border: "1px solid #2b394a",
                background: "#0f1720",
                color: "#fff",
                padding: 8,
                resize: "vertical",
              }}
              onClick={(e) => (e.target as HTMLTextAreaElement).select()}
            />

            <div className="row" style={{ marginTop: 10 }}>
              <button onClick={copiarMensaje}>Copiar mensaje</button>
              <button onClick={compartirMensaje}>Compartir</button>
            </div>

            <button className="full" onClick={() => setOpen(false)}>
              Cerrar
            </button>
          </div>
        </div>
      )}
    </>
  );
}
