// src/hooks/useUbicacion.ts
import { useEffect, useState } from 'react';
import { Geolocation } from '@capacitor/geolocation';

type Coordenadas = {
  lat: number;
  lng: number;
};

export const useUbicacion = () => {
  const [coordenadas, setCoordenadas] = useState<Coordenadas | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState<boolean>(true);

  useEffect(() => {
    const obtenerUbicacion = async () => {
      try {
        const position = await Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 10000, // 10 segundos máx
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

    obtenerUbicacion();
  }, []);

  return { coordenadas, error, cargando };
};
