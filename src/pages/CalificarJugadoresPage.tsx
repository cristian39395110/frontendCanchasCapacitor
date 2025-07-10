import React, { useEffect, useState } from 'react';
import { API_URL } from '../config';
import Navbar from '../components/Navbar';
import StarRating from '../components/StarRating'; // ⭐ Importamos el componente
import '../utils/CalificarJugadoresPage.css';

const CalificarJugadoresPage: React.FC = () => {
  const [partidos, setPartidos] = useState<any[]>([]);
  const [seleccionado, setSeleccionado] = useState<any | null>(null);
  const [jugadores, setJugadores] = useState<any[]>([]);
  const [comentarios, setComentarios] = useState<{ [id: number]: string }>({});
  const [puntajes, setPuntajes] = useState<{ [id: number]: number }>({});
  const usuarioId = localStorage.getItem('usuarioId');

  useEffect(() => {
    fetch(`${API_URL}/api/puntuacion/organizados-finalizados/${usuarioId}`)
      .then(res => res.json())
      .then(setPartidos);
      console.log("📦 usuarioId:", usuarioId);
  }, [usuarioId]);

  const seleccionarPartido = async (partido: any) => {
    setSeleccionado(partido);

    const res = await fetch(`${API_URL}/api/puntuacion/jugadores-confirmados-con-calificacion/${partido.id}/${usuarioId}`);
    console.log('🧪 Fetch ejecutado para:', `${API_URL}/api/puntuacion/jugadores-confirmados-con-calificacion/${partido.id}/${usuarioId}`);

    const data = await res.json();
    console.log('🧪 Fetch ejecutado para:', `${API_URL}/api/puntuacion/jugadores-confirmados-con-calificacion/${partido.id}/${usuarioId}`);

    console.log("data")
    setJugadores(data);
  };

  const calificar = async (jugadorId: number) => {
    const res = await fetch(`${API_URL}/api/puntuacion`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        usuarioId: Number(usuarioId),
        partidoId: seleccionado.id,
        puntuadoId: jugadorId,
        puntaje: puntajes[jugadorId],
        comentario: comentarios[jugadorId]
      })
    });

     console.log("data")

    const data = await res.json();
    alert(data.mensaje || 'Guardado');
    seleccionarPartido(seleccionado); // recargar
  };

  return (
    <>
      <Navbar />
      <div className="calificar-container">
        <h2 className="titulo">Calificar jugadores</h2>

        {!seleccionado ? (
          <>
            <h3 className="subtitulo">Partidos finalizados</h3>
            <ul className="partido-lista">
              {partidos.map(p => (
                <li key={p.id} className="partido-item">
                  <span>{p.nombre} - {p.fecha}</span>
                  <button className="boton" onClick={() => seleccionarPartido(p)}>Seleccionar</button>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <>
            <h3 className="subtitulo">Jugadores en "{seleccionado.nombre}"</h3>
            <ul className="jugador-lista">
              {jugadores.map(j => (
                <li key={j.id} className={`jugador-card ${j.yaCalificado ? 'calificado' : ''}`}>
                  <strong>{j.nombre}</strong>

                  {j.yaCalificado ? (
                    <>
                      <p className="calificado-texto">✅ Ya calificado</p>
                      <div className="star-rating disabled">
                        {[1, 2, 3, 4, 5].map(star => (
                          <span key={star} className={`star ${star <= j.puntaje ? 'filled' : ''}`}>★</span>
                        ))}
                      </div>
                      <p><em>{j.comentario || 'Sin comentario'}</em></p>
                    </>
                  ) : (
                    <>
                      <StarRating
                        value={puntajes[j.id] || 0}
                        onChange={(value) => setPuntajes(prev => ({ ...prev, [j.id]: value }))}
                      />
                      <textarea
                        placeholder="Comentario"
                        className="textarea"
                        onChange={e =>
                          setComentarios(prev => ({ ...prev, [j.id]: e.target.value }))
                        }
                      />
                      <button className="boton-guardar" onClick={() => calificar(j.id)}>Guardar</button>
                    </>
                  )}
                </li>
              ))}
            </ul>

            <button className="boton volver" onClick={() => setSeleccionado(null)}>← Volver</button>
          </>
        )}
      </div>
    </>
  );
};

export default CalificarJugadoresPage;
