import React, { useState, useEffect } from 'react';
import GameCard from '../components/GameCard';
import Navbar from '../components/Navbar';
import { API_URL } from '../config';
import '../utils/DashboardPage.css';

const DashboardPage: React.FC = () => {
  const [deportes, setDeportes] = useState<any[]>([]);
  const [deportesInscriptos, setDeportesInscriptos] = useState<number[]>([]);
  const [nivel, setNivel] = useState<string>('amateur');
  const [modalVisible, setModalVisible] = useState(false);
  const [deporteSeleccionado, setDeporteSeleccionado] = useState<{ id: number; nombre: string } | null>(null);
  const [filtro, setFiltro] = useState<string>('');
  const [filtroVista, setFiltroVista] = useState<'todos' | 'inscriptos' | 'no-inscriptos'>('todos');
  const [suspendidoHasta, setSuspendidoHasta] = useState<Date | null>(null);

  const usuarioId = localStorage.getItem('usuarioId');

  // ✅ Verificar suspensión
  useEffect(() => {
    if (!usuarioId) return;

    fetch(`${API_URL}/api/historialpuntuacion/estado/${usuarioId}`)
      .then(res => res.json())
      .then(data => {
        if (data?.suspensionHasta && new Date(data.suspensionHasta) > new Date()) {
          setSuspendidoHasta(new Date(data.suspensionHasta));
        }
      })
      .catch(err => console.error('Error al verificar suspensión:', err));
  }, [usuarioId]);

  // ✅ Cargar deportes y deportes inscriptos
  useEffect(() => {
    fetch(`${API_URL}/api/deportes`)
      .then(async (res) => {
        const text = await res.text();
        try {
          const data = JSON.parse(text);
          setDeportes(data);
        } catch (e) {
          console.error('Error parseando JSON:', e);
        }
      })
      .catch((err) => console.error('Error de red:', err));

    if (usuarioId) {
      fetch(`${API_URL}/api/usuariodeporte/${usuarioId}`)
        .then((res) => res.json())
        .then((data) => {
          const ids = data.map((d: any) => d.deporteId);
          setDeportesInscriptos(ids);
        })
        .catch((err) => console.error('Error al obtener deportes inscriptos:', err));
    }
  }, [usuarioId]);

  const handleSelectJuego = (deporteId: number, deporteNombre: string) => {
    if (!usuarioId) {
      alert('No se encontró el ID del usuario. Inicia sesión.');
      return;
    }
    setDeporteSeleccionado({ id: deporteId, nombre: deporteNombre });
    setModalVisible(true);
  };

  const confirmarNivel = () => {
    if (!usuarioId || !deporteSeleccionado) return;

    fetch(`${API_URL}/api/usuariodeporte`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        usuarioId: Number(usuarioId),
        deporteId: deporteSeleccionado.id,
        nivel,
      }),
    })
      .then((res) => {
        if (!res.ok) throw new Error('Error al registrar el deporte');
        return res.json();
      })
      .then(() => {
        alert(`¡Te registraste en ${deporteSeleccionado.nombre} como ${nivel}!`);
        setDeportesInscriptos([...deportesInscriptos, deporteSeleccionado.id]);
        setModalVisible(false);
      })
      .catch((err) => {
        console.error(err);
        alert('Error al registrarte en el deporte');
      });
  };

  const handleDesuscribirse = (deporteId: number) => {
    if (!usuarioId) return;

    fetch(`${API_URL}/api/usuariodeporte`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuarioId: Number(usuarioId), deporteId }),
    })
      .then((res) => {
        if (!res.ok) throw new Error('Error al desuscribirse');
        setDeportesInscriptos(deportesInscriptos.filter((id) => id !== deporteId));
        alert('Te desuscribiste del deporte.');
      })
      .catch((err) => {
        console.error(err);
        alert('Error al desuscribirte del deporte.');
      });
  };

  return (
    <div>
      <Navbar />

      {suspendidoHasta && (
        <div className="suspension-alert">
          🚫 Estás suspendido hasta el <strong>{suspendidoHasta.toLocaleString()}</strong> y no podrás recibir invitaciones.
        </div>
      )}

      <div className="dashboard-container">
        <h2>¿A qué deportes quieres ser invitado?</h2>

        <input
          type="text"
          placeholder="Buscar deporte..."
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          style={{
            padding: '10px',
            width: '90%',
            maxWidth: '400px',
            margin: '0 auto 20px auto',
            display: 'block',
            borderRadius: '8px',
            border: '1px solid #ccc'
          }}
        />

        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <label style={{ marginRight: '10px' }}>
            <input
              type="radio"
              name="filtroDeportes"
              value="todos"
              checked={filtroVista === 'todos'}
              onChange={() => setFiltroVista('todos')}
            />
            Todos
          </label>
          <label style={{ marginRight: '10px' }}>
            <input
              type="radio"
              name="filtroDeportes"
              value="inscriptos"
              checked={filtroVista === 'inscriptos'}
              onChange={() => setFiltroVista('inscriptos')}
            />
            Inscriptos
          </label>
          <label>
            <input
              type="radio"
              name="filtroDeportes"
              value="no-inscriptos"
              checked={filtroVista === 'no-inscriptos'}
              onChange={() => setFiltroVista('no-inscriptos')}
            />
            No inscriptos
          </label>
        </div>

        <div className="dashboard-list">
          {deportes
            .filter((deporte) => {
              const nombreCoincide = deporte.nombre.toLowerCase().includes(filtro.toLowerCase());
              const estaInscripto = deportesInscriptos.includes(deporte.id);

              if (filtroVista === 'inscriptos') return nombreCoincide && estaInscripto;
              if (filtroVista === 'no-inscriptos') return nombreCoincide && !estaInscripto;
              return nombreCoincide;
            })
            .map((deporte) => {
              const estaInscripto = deportesInscriptos.includes(deporte.id);
              return (
                <div key={deporte.id} className={`game-card-wrapper ${estaInscripto ? 'inscripto' : ''}`}>
                  <GameCard
                    title={deporte.nombre}
                    image={deporte.imagen}
                    onSelect={() =>
                      estaInscripto
                        ? handleDesuscribirse(deporte.id)
                        : handleSelectJuego(deporte.id, deporte.nombre)
                    }
                  />
                  <div className="game-card-boton">
                    {estaInscripto ? (
                      <button className="btn-desuscribir" onClick={() => handleDesuscribirse(deporte.id)}>
                        Desuscribirme
                      </button>
                    ) : (
                      <button className="btn-inscribir" onClick={() => handleSelectJuego(deporte.id, deporte.nombre)}>
                        Inscribirme
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {modalVisible && (
        <div className="modal">
          <div className="modal-content">
            <h3>Seleccioná tu nivel en {deporteSeleccionado?.nombre}</h3>
            <select value={nivel} onChange={(e) => setNivel(e.target.value)}>
              <option value="amateur">Amateur (recién empiezo)</option>
              <option value="medio">Intermedio (juego seguido)</option>
              <option value="alto">Avanzado (buen nivel)</option>
              <option value="pro">Profesional (compito)</option>
            </select>
            <br />
            <button onClick={confirmarNivel}>Confirmar</button>
            <button onClick={() => setModalVisible(false)}>Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
