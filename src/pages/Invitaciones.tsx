import React, { useEffect, useState } from 'react';
import { API_URL } from '../config';
import Navbar from '../components/Navbar';
import './Invitaciones.css';

const Invitaciones: React.FC = () => {
  const [invitaciones, setInvitaciones] = useState<any[]>([]);
  const [filtroEstado, setFiltroEstado] = useState('pendiente');
  const usuarioId = localStorage.getItem('usuarioId');

  useEffect(() => {
    if (usuarioId) {
      fetch(`${API_URL}/api/solicitudes/${usuarioId}?estado=${filtroEstado}`)
        .then(res => res.json())
        .then(data => {
            console.log('📥 Invitaciones recibidas del backend:', data);
          setInvitaciones(data);
        })
        .catch(err => console.error(err));
    }
  }, [usuarioId, filtroEstado]);

  const aceptarInvitacion = (partidoId: number) => {
    fetch(`${API_URL}/api/solicitudes/aceptar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuarioId: Number(usuarioId), partidoId })
    })
      .then(async (res) => {
        if (!res.ok) {
          const error = await res.json();
          alert(error.error || '❌ Error al aceptar invitación');
          return;
        }

        alert('✅ Invitación aceptada');
        setInvitaciones(prev =>
          prev.filter(inv => inv.id !== partidoId)
        );
      })
      .catch(err => {
        console.error(err);
        alert('❌ Error al aceptar invitación');
      });
  };

  const rechazarInvitacion = (partidoId: number) => {
    fetch(`${API_URL}/api/solicitudes/rechazar/${partidoId}`, {
      method: 'POST'
    })
      .then(() => {
        alert('❌ Invitación rechazada');
        setInvitaciones(prev =>
          prev.filter(inv => inv.id !== partidoId)
        );
      })
      .catch(err => console.error(err));
  };

  const cancelarAsistencia = (partidoId: number) => {
    fetch(`${API_URL}/api/solicitudes/cancelar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuarioId: Number(usuarioId), partidoId })
    })
      .then(async (res) => {
        if (!res.ok) {
          const error = await res.json();
          alert(error.error || '❌ Error al cancelar asistencia');
          return;
        }

        alert('✅ Asistencia cancelada');
        setInvitaciones(prev =>
          prev.filter(inv => inv.id !== partidoId)
        );
      })
      .catch(err => {
        console.error(err);
        alert('❌ Error al cancelar asistencia');
      });
  };

  return (
    <div>
      <Navbar />
      <div className="invitaciones-container">
        <h2 className="invitaciones-title">Invitaciones</h2>

        <div className="invitaciones-select-wrapper">
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="invitaciones-select"
          >
            <option value="pendiente">🕓 Por responder</option>
            <option value="rechazada">❌ Rechazada</option>
            <option value="confirmado">✅ Confirmado</option>
          </select>
        </div>

        {invitaciones.length > 0 ? (
          <div className="cards-container">
            {invitaciones.map((inv, index) => (
              <div key={index} className="card">
                <h3 className="card-title">🎾 {inv.deporte}</h3>
                <p><strong>🏙 Localidad:</strong> {inv.localidad || 'No especificada'}</p>
                <p><strong>📍 Direccion:</strong> {inv.lugar}</p>
                <p><strong>🏟 Cancha:</strong> {inv.nombreCancha}</p>
                <p><strong>📅 Fecha:</strong> {inv.fecha}</p>
                <p><strong>⏰ Hora:</strong> {inv.hora}</p>
                <p><strong>👤 Organizador:</strong> {inv.organizador}</p>
                <p><strong>🧍 Sexo:</strong> {inv.sexo === 'todos' ? 'Todos' : inv.sexo}</p>
<p><strong>🎂 Rango de edad:</strong> {inv.rangoEdad || 'Sin restricción'}</p>

                {inv.cantidadJugadores && (
                  <p><strong>👥 Jugadores requeridos:</strong> {inv.cantidadJugadores}</p>
                )}
                {(inv.latitud && inv.longitud) && (
                  <p>
                    <strong>📌 Ubicación:</strong>{' '}
                    <a
                      href={`https://www.google.com/maps?q=${inv.latitud},${inv.longitud}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Ver en mapa
                    </a>
                  </p>
                )}

                {filtroEstado === 'pendiente' && (
                  <div className="card-buttons">
                    <button className="btn btn-aceptar" onClick={() => aceptarInvitacion(inv.id)}>
                      Aceptar
                    </button>
                    <button className="btn btn-rechazar" onClick={() => rechazarInvitacion(inv.id)}>
                      Rechazar
                    </button>
                  </div>
                )}

                {filtroEstado === 'confirmado' && (
                  <div style={{ marginTop: '10px' }}>
                    {puedeCalificar(inv.fecha, inv.hora) ? (
                      <button
                        className="btn btn-aceptar"
                        onClick={() => window.location.href = `/calificar/${inv.id}`}
                      >
                        Calificar
                      </button>
                    ) : (
                      <p style={{ fontStyle: 'italic', color: '#888' }}>
                        Podrás calificar 12h después del partido
                      </p>
                    )}
                    <button
                      className="btn btn-rechazar"
                      onClick={() => cancelarAsistencia(inv.id)}
                      style={{ marginTop: '10px' }}
                    >
                      Cancelar asistencia
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p style={{ textAlign: 'center', marginTop: '20px' }}>
            No tienes invitaciones <strong>{filtroEstado}</strong>s.
          </p>
        )}
      </div>
    </div>
  );
};

function puedeCalificar(fecha: string, hora: string): boolean {
  const fechaHoraPartido = new Date(`${fecha}T${hora}`);
  const ahora = new Date();
  const diferenciaHoras = (ahora.getTime() - fechaHoraPartido.getTime()) / (1000 * 60 * 60);
  return diferenciaHoras >= 12;
}

export default Invitaciones;
