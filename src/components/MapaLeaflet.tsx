import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './MapaLeaflet.css';


// 🧨 CSS Marker Personalizado
const CustomIcon = L.divIcon({
  className: 'custom-marker',
  html: '<div class="pin"></div><div class="pulse"></div>',
  iconSize: [30, 30],
  iconAnchor: [15, 30], // punta inferior
});

type Props = {
  latitud: number;
  longitud: number;
  onChangeUbicacion: (lat: number, lng: number) => void;
};

const MapaLeaflet: React.FC<Props> = ({ latitud, longitud, onChangeUbicacion }) => {
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current).setView([latitud, longitud], 15);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(mapRef.current);

      mapRef.current.on('click', function (e: L.LeafletMouseEvent) {
        const { lat, lng } = e.latlng;
        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
        } else {
          markerRef.current = L.marker([lat, lng], { draggable: true, icon: CustomIcon }).addTo(mapRef.current!);
          markerRef.current.on('dragend', () => {
            const pos = markerRef.current!.getLatLng();
            onChangeUbicacion(pos.lat, pos.lng);
          });
        }
        onChangeUbicacion(lat, lng);
      });
    }

    if (!markerRef.current) {
      markerRef.current = L.marker([latitud, longitud], { draggable: true, icon: CustomIcon }).addTo(mapRef.current);
      markerRef.current.on('dragend', () => {
        const pos = markerRef.current!.getLatLng();
        onChangeUbicacion(pos.lat, pos.lng);
      });
    } else {
      markerRef.current.setLatLng([latitud, longitud]);
    }

    mapRef.current.setView([latitud, longitud], 15);
    setTimeout(() => mapRef.current?.invalidateSize(), 300);
  }, [latitud, longitud, onChangeUbicacion]);

  return (
    <div
      ref={mapContainerRef}
      style={{ width: '100%', height: '300px', borderRadius: '8px', backgroundColor: '#eee' }}
    ></div>
  );
};

export default MapaLeaflet;
