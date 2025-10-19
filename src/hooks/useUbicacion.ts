import { useState, useCallback } from 'react';
import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';

export type Coordenadas = { lat: number; lng: number };

function getIsSecureContext(): boolean {
  // En web, geoloc solo funciona en HTTPS o http://localhost
  if (typeof window === 'undefined') return false;
  const isLocalhost = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  return isLocalhost || location.protocol === 'https:';
}

export const useUbicacion = () => {
  const [coordenadas, setCoordenadas] = useState<Coordenadas | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState<boolean>(false);

  const obtenerUbicacion = useCallback(async (): Promise<Coordenadas | null> => {
    setCargando(true);
    setError(null);

    const plataforma = Capacitor.getPlatform();

    try {
      // --------- WEB ---------
      if (plataforma === 'web') {
        if (!getIsSecureContext()) {
          setError('El navegador solo permite ubicación en HTTPS o http://localhost.');
          return null;
        }

        // Si DevTools tiene "Sensors: Location = Unavailable", getCurrentPosition nunca devuelve.
        // Asegurate de poner "No override" o una ciudad.
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          const timeoutId = setTimeout(() => reject(new Error('timeout')), 15000);
          navigator.geolocation.getCurrentPosition(
            (p) => { clearTimeout(timeoutId); resolve(p); },
            (err) => { clearTimeout(timeoutId); reject(err); },
            { enableHighAccuracy: true, timeout: 15000 }
          );
        });

        const coords: Coordenadas = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        setCoordenadas(coords);
        return coords;
      }

      // --------- NATIVO (Android / iOS) ---------
      const perm = await Geolocation.checkPermissions();
      if (perm.location !== 'granted') {
        await Geolocation.requestPermissions();
      }

      const pos = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 15000,
      });

      const coords: Coordenadas = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
      };
      setCoordenadas(coords);
      return coords;
    } catch (err: any) {
      console.error('❌ Error al obtener ubicación:', err);

      // Mensajes específicos
      if (err?.message?.toLowerCase().includes('only secure origins') || err?.name === 'NotAllowedError') {
        setError('El navegador bloqueó la ubicación: usá HTTPS o http://localhost y permití el acceso.');
      } else if (err?.code === 1 || err?.message?.includes('permission')) {
        setError('Permiso denegado. Activá el GPS y aceptá los permisos.');
      } else if (err?.message?.includes('timeout')) {
        setError('Tiempo de espera agotado al obtener la ubicación.');
      } else {
        setError('No se pudo obtener la ubicación. Activá el GPS y aceptá los permisos.');
      }
      return null;
    } finally {
      setCargando(false);
    }
  }, []);

  return { coordenadas, error, cargando, obtenerUbicacion } as const;
};
