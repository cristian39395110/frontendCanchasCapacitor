// src/pages/CalificarPage.tsx
import React, { useEffect, useState } from 'react';
import { API_URL } from '../config';
import Navbar from '../components/Navbar';
import { useParams, useNavigate } from 'react-router-dom';

const CalificarPage: React.FC = () => {
  const { partidoId } = useParams();
  const usuarioId = localStorage.getItem('usuarioId');
  const [puntaje, setPuntaje] = useState(5);
  const [comentario, setComentario] = useState('');
  const [yaCalificado, setYaCalificado] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!usuarioId || !partidoId) return;

    fetch(`${API_URL}/api/puntuacion/ya-calificado?usuarioId=${usuarioId}&partidoId=${partidoId}`)
      .then(res => res.json())
      .then(data => setYaCalificado(data.yaCalificado))
      .catch(err => console.error(err));
  }, [usuarioId, partidoId]);

  const enviarPuntaje = () => {
    fetch(`${API_URL}/api/puntuacion`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        usuarioId: Number(usuarioId),
        partidoId: Number(partidoId),
        puntaje,
        comentario,
      })
    })
      .then(res => res.json())
      .then(data => {
        alert(data.mensaje || 'Puntuación enviada');
        navigate('/invitaciones');
      })
      .catch(err => {
        console.error(err);
        alert('Error al enviar puntuación');
      });
  };

  if (yaCalificado) {
    return (
      <>
        <Navbar />
        <div style={{ marginTop: 80, textAlign: 'center' }}>
          <h2>✅ Ya calificaste este partido</h2>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div style={{ padding: '20px', marginTop: '80px', maxWidth: '500px', margin: '0 auto' }}>
        <h2 style={{ textAlign: 'center' }}>Calificar el partido</h2>

        <label>Puntaje (1 a 5):</label>
        <input
          type="number"
          min={1}
          max={5}
          value={puntaje}
          onChange={(e) => setPuntaje(Number(e.target.value))}
          style={{ width: '100%', marginBottom: 10 }}
        />

        <label>Comentario (opcional):</label>
        <textarea
          value={comentario}
          onChange={(e) => setComentario(e.target.value)}
          style={{ width: '100%', minHeight: 100, marginBottom: 20 }}
        />

        <button
          onClick={enviarPuntaje}
          style={{ padding: '12px', backgroundColor: '#4CAF50', color: 'white', border: 'none', width: '100%' }}
        >
          Enviar calificación
        </button>
      </div>
    </>
  );
};

export default CalificarPage;
