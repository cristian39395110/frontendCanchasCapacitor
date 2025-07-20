import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import './CanchasPage.css';
import { Geolocation } from '@capacitor/geolocation';
import { API_URL } from '../config';

const rad = (x: number) => (x * Math.PI) / 180;

const calcularDistanciaKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371;
  const dLat = rad(lat2 - lat1);
  const dLon = rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const CanchasPage: React.FC = () => {
  const [lat, setLat] = useState<number | null>(null);
  const [lon, setLon] = useState<number | null>(null);
  const [canchas, setCanchas] = useState<any[]>([]);
  const [deportes, setDeportes] = useState<string[]>([]);
  const [deporteSeleccionado, setDeporteSeleccionado] = useState('');
  const [mostrarMapa, setMostrarMapa] = useState(false);
const [latMapa, setLatMapa] = useState<number | null>(null);
const [lonMapa, setLonMapa] = useState<number | null>(null);
const abrirMapa = (lat: string, lon: string) => {
  setLatMapa(parseFloat(lat));
  setLonMapa(parseFloat(lon));
  setMostrarMapa(true);
};



  useEffect(() => {
    const obtenerUbicacion = async () => {
      try {
        const { coords } = await Geolocation.getCurrentPosition();
        setLat(coords.latitude);
        setLon(coords.longitude);
      } catch (error) {
        console.error('❌ Error obteniendo ubicación:', error);
      }
    };

    const obtenerDeportes = async () => {
      try {
        const res = await fetch(`${API_URL}/api/deportes`);
        const data = await res.json();
        setDeportes(data.map((d: any) => d.nombre));
      } catch (error) {
        console.error('❌ Error cargando deportes:', error);
      }
    };

    obtenerUbicacion();
    obtenerDeportes();
  }, []);

  useEffect(() => {
  const fetchCanchas = async () => {
    try {
      let url = `${API_URL}/api/canchas`;
      if (deporteSeleccionado) {
        url += `?deporte=${encodeURIComponent(deporteSeleccionado)}`;
      }

      const res = await fetch(url);
      const data: any[] = await res.json();

      if (lat && lon) {
        const conDistancia = data.map((c: any) => ({
          ...c,
          distancia: parseFloat(
            calcularDistanciaKm(
              lat,
              lon,
              parseFloat(c.latitud),
              parseFloat(c.longitud)
            ).toFixed(1)
          ),
        }));

        const filtradas = conDistancia
          .filter((c: { distancia: number }) => !isNaN(c.distancia))
          .sort(
            (a: { distancia: number }, b: { distancia: number }) =>
              a.distancia - b.distancia
          );

        setCanchas(filtradas);
      }
    } catch (err) {
      console.error('❌ Error al cargar canchas:', err);
    }
  };

  if (lat && lon) fetchCanchas();
}, [lat, lon, deporteSeleccionado]);

  const abrirWhatsApp = (telefono: string, establecimiento: string) => {
    const mensaje = `Hola! Quisiera consultar por una cancha en ${establecimiento}.`;
    const url = `https://wa.me/${telefono.replace('+', '')}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
  };

  return (
    <>
      <Navbar />
      <div className="canchas-container">
        <h2>🏟️ Establecimientos deportivos cerca tuyo</h2>

        <div className="filtro-deporte">
          <select
            value={deporteSeleccionado}
            onChange={(e) => setDeporteSeleccionado(e.target.value)}
          >
            <option value="">Todos los deportes</option>
            {deportes.map((dep) => (
              <option key={dep} value={dep}>{dep}</option>
            ))}
          </select>
        </div>

        {canchas.map((cancha) => (
          <div className="cancha-card-h" key={cancha.id}>
            <img
              src={cancha.foto}
              alt={cancha.nombre}
              onClick={() => abrirWhatsApp(cancha.whatsapp, cancha.nombre)}
            />
            <div className="cancha-info">
              <h3>{cancha.nombre}</h3>
              <p>📍 A {cancha.distancia} km de tu ubicación</p>
              <p>🎯 Deportes: {cancha.deportes?.split(',').join(', ')}</p>
              <button onClick={() => abrirWhatsApp(cancha.whatsapp, cancha.nombre)}>
                Consultar por WhatsApp
              </button>

              {cancha.latitud && cancha.longitud && (
  <button
    onClick={() => abrirMapa(cancha.latitud, cancha.longitud)}
    className="btn-ver-mapa"
  >
    Ver mapa
  </button>
)}

            </div>
          </div>
        ))}
      </div>
      {mostrarMapa && latMapa && lonMapa && (
  <div className="modal-overlay" onClick={() => setMostrarMapa(false)}>
    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
      <div className="modal-close" onClick={() => setMostrarMapa(false)}>✕</div>
      <iframe
        src={`https://www.google.com/maps/embed/v1/place?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&q=${latMapa},${lonMapa}`}
        loading="lazy"
        allowFullScreen
      ></iframe>
    </div>
  </div>
)}

    </>
  );
};

export default CanchasPage;
