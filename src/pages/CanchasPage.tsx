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

    obtenerUbicacion();
  }, []);

  useEffect(() => {
    const fetchCanchas = async () => {
      try {
        const res = await fetch(`${API_URL}/api/canchas`);
        const data = await res.json();

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

          setCanchas(conDistancia.sort((a: any, b: any) => a.distancia - b.distancia));
        }
      } catch (err) {
        console.error('❌ Error al cargar canchas:', err);
      }
    };

    if (lat && lon) fetchCanchas();
  }, [lat, lon]);

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

        {canchas.map((cancha) => (
          <div className="cancha-card" key={cancha.id}>
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

              {/* 🌍 Mapa embebido */}
              {cancha.latitud && cancha.longitud && (
                <div className="mapa-iframe">
                  <iframe
                    width="100%"
                    height="200"
                    loading="lazy"
                    style={{ border: 0, marginTop: '8px', borderRadius: '8px' }}
                    allowFullScreen
                    src={`https://www.google.com/maps/embed/v1/place?key=${
                      import.meta.env.VITE_GOOGLE_MAPS_API_KEY
                    }&q=${cancha.latitud},${cancha.longitud}`}
                  ></iframe>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default CanchasPage;
