//use ubicaiones 
//hook 
// src/hooks/useUbicacion.ts
import { useState } from 'react';
import { Geolocation } from '@capacitor/geolocation';

type Coordenadas = {
  lat: number;
  lng: number;
};

export const useUbicacion = () => {
  const [coordenadas, setCoordenadas] = useState<Coordenadas | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState<boolean>(false);

  const obtenerUbicacionDirecta = async () => {
  try {
    const pos = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 10000,
    });
    return { lat: pos.coords.latitude, lng: pos.coords.longitude };
  } catch (err) {
    console.error('❌ Error ubicación directa:', err);
    return null;
  }
};


  const obtenerUbicacion = async () => {
    setCargando(true);
    try {
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
      });

      const { latitude, longitude } = position.coords;

      if (latitude && longitude) {
        setCoordenadas({ lat: latitude, lng: longitude });
      } else {
        setError('Ubicación no disponible. Intenta nuevamente.');
      }
    } catch (err: any) {
      console.error('❌ Error al obtener ubicación:', err);
      if (err.message?.includes('timeout')) {
        setError('Tiempo de espera agotado al obtener la ubicación.');
      } else {
        setError('No se pudo obtener la ubicación. Activá el GPS y aceptá los permisos.');
      }
    } finally {
      setCargando(false);
    }
  };

  return { coordenadas, error, cargando, obtenerUbicacion, obtenerUbicacionDirecta  };
};
