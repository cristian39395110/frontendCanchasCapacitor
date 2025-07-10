import React, { useEffect, useState } from 'react';
import { API_URL } from '../config';
import Navbar from '../components/Navbar';
import { useNavigate } from 'react-router-dom';
import '../components/InvitacionesAuto.css';

const InvitacionesAuto: React.FC = () => {
  const [invitaciones, setInvitaciones] = useState<any[]>([]);
  const usuarioId = localStorage.getItem('usuarioId');
  const navigate = useNavigate();
  const [jugadoresProcesados, setJugadoresProcesados] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    if (usuarioId) {
      fetch(`${API_URL}/api/pendientes/invitaciones-auto/${usuarioId}`)
        .then(res => res.json())
        .then(data => {
          console.log('📦 Datos recibidos (auto):', data);
          setInvitaciones(data);
        })
        .catch(err => console.error(err));
    }
  }, [usuarioId]);

  const enviarMensaje = (receptorId: number, partidoId: number) => {
    navigate(`/chat/${receptorId}?partidoId=${partidoId}`);
  };

  return (
    <div>
      <Navbar />
      <div className="invitaciones-container">
        <h2 className="invitaciones-title">Jugadores sugeridos automáticamente</h2>

        {invitaciones.length > 0 ? (
          <div className="cards-container">
            {invitaciones.map((invitacion, index) => (
              <div key={index} className="card">
                <h3>🎾 {invitacion.deporte}</h3>
                <p><strong>🏙 Localidad:</strong> {invitacion.localidad || 'No especificada'}</p>
                <p><strong>📍 Lugar:</strong> {invitacion.lugar}</p>
                <p><strong>📅 Fecha:</strong> {invitacion.fecha}</p>
                <p><strong>⏰ Hora:</strong> {invitacion.hora}</p>
                <p><strong>👥 Jugadores sugeridos:</strong></p>
                <ul>
                  {invitacion.usuariosAceptados.map((jugador: any) => {
                    const clave = `${invitacion.id}-${jugador.id}`;
                    const deshabilitado = jugadoresProcesados[clave];
                    return (
                      <li key={jugador.id}>
                        <strong>{jugador.nombre}</strong> (Puntaje: {jugador.puntaje})
                        <div className="card-buttons">
                          <button
                            onClick={() => enviarMensaje(jugador.id, invitacion.id)}
                            className="mensaje-btn"
                          >
                            Enviar mensaje
                          </button>

                          <button
                            disabled={deshabilitado}
                            onClick={async () => {
                              setJugadoresProcesados(prev => ({ ...prev, [clave]: true }));
                              const res = await fetch(`${API_URL}/api/partidos/confirmar-jugador`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  organizadorId: usuarioId,
                                  usuarioId: jugador.id,
                                  partidoId: invitacion.id
                                })
                              });
                              const data = await res.json();
                              alert(data.mensaje || 'Jugador confirmado');
                            }}
                            className={`confirmar-btn ${deshabilitado ? 'disabled' : ''}`}
                          >
                            ✅ Confirmar
                          </button>

                          <button
                            onClick={async () => {
                              await fetch(`${API_URL}/api/partidos/rechazar-jugador`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  usuarioId: jugador.id,
                                  partidoId: invitacion.id
                                })
                              });
                              alert(`Jugador ${jugador.nombre} rechazado`);
                            }}
                            className="rechazar-btn"
                          >
                            ❌ Rechazar
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        ) : (
          <p className="invitaciones-vacia">No hay jugadores aceptados automáticamente.</p>
        )}
      </div>
    </div>
    
  );
};

export default InvitacionesAuto;
