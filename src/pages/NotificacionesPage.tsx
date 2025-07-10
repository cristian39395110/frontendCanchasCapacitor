import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { suscribirseANotificaciones } from '../utils/notificaciones'; 



const NotificacionesPage: React.FC = () => {
  const [notificaciones, setNotificaciones] = useState<any[]>([]);
  // 🔥 Cambia por el ID real
  const [suscripto, setSuscripto] = useState<boolean>(false);

   let usuarioId = null;
    const token = localStorage.getItem('token');

    if (token) {
      try {
        const decoded = JSON.parse(atob(token.split('.')[1]));
        usuarioId = decoded.id;
      } catch (error) {
        console.error('Error decodificando el token:', error);
      }
    }


  // Cargar notificaciones al iniciar
  useEffect(() => {
    fetch(`http://192.168.0.172:3000/api/usuarioPartido?usuarioId=${usuarioId}`)
      .then((res) => res.json())
      .then((data) => setNotificaciones(data))
      .catch((err) => console.error(err));

    // Verificar si el usuario está suscripto a notificaciones
    fetch(`http://192.168.0.172:3000/api/suscripcion/usuario/${usuarioId}`)
      .then((res) => res.json())
      .then((data) => setSuscripto(data.suscripto))
      .catch((err) => console.error(err));
  }, [usuarioId]);

  // Función para activar o desactivar notificaciones
  const manejarNotificaciones = async () => {
    if (suscripto) {
      // Eliminar suscripción
      await fetch(`http://192.168.0.172:3000/api/suscripcion/usuario/${usuarioId}`, {
        method: 'DELETE',
      });
      alert('Notificaciones desactivadas');
      setSuscripto(false);
    } else {
      // Activar suscripción
      await suscribirseANotificaciones(usuarioId);
      alert('Notificaciones activadas');
      setSuscripto(true);
    }
  };

  // Aceptar o rechazar una notificación
  const manejarRespuesta = (id: number, estado: string) => {
    fetch(`http://192.168.0.172:3000/api/usuarioPartido/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado }),
    })
      .then((res) => res.json())
      .then(() => {
        alert(`Notificación ${estado}`);
        // Recargar notificaciones
        fetch(`http://192.168.0.172:3000/api/usuarioPartido?usuarioId=${usuarioId}`)
          .then((res) => res.json())
          .then((data) => setNotificaciones(data));
      })
      .catch((err) => alert('Error: ' + err.message));
  };

  return (
    <div>
      <Navbar />
      <div style={{ padding: '80px' }}>
        <h2>Mis Notificaciones</h2>

        <button onClick={manejarNotificaciones} style={{ marginBottom: '20px' }}>
          {suscripto ? 'Desactivar notificaciones' : 'Activar notificaciones'}
        </button>

        {notificaciones.length === 0 ? (
          <p>No tienes notificaciones.</p>
        ) : (
          notificaciones.map((n) => (
            <div key={n.id} style={{ border: '1px solid #ccc', padding: '10px', marginBottom: '10px' }}>
              <p><strong>Deporte:</strong> {n.Partido.deporteId}</p>
              <p><strong>Ubicación:</strong> {n.Partido.lugar}</p>
              <p><strong>Fecha:</strong> {n.Partido.fecha} - {n.Partido.hora}</p>
              <p><strong>Estado:</strong> {n.estado}</p>
              {n.estado === 'pendiente' && (
                <div>
                  <button onClick={() => manejarRespuesta(n.id, 'aceptado')} style={{ marginRight: '10px' }}>Aceptar</button>
                  <button onClick={() => manejarRespuesta(n.id, 'rechazado')}>Rechazar</button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificacionesPage;
