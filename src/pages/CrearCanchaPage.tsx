import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../config';
import Navbar from '../components/Navbar';
import './CrearCanchaPage.css';

const CrearCanchaPage: React.FC = () => {
  const navigate = useNavigate();
  const [accesoPermitido, setAccesoPermitido] = useState(false);
  const [nombre, setNombre] = useState('');
  const [direccion, setDireccion] = useState('');
  const [latitud, setLatitud] = useState('');
  const [longitud, setLongitud] = useState('');
  const [deportes, setDeportes] = useState('');
  const [telefono, setTelefono] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [foto, setFoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);

  // ⛔ Verificar acceso
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/');
      return;
    }

    try {
      const decoded = JSON.parse(atob(token.split('.')[1]));
      if (decoded.id === 11) {
        setAccesoPermitido(true);
      } else {
        alert('⛔ No tenés permiso para acceder a esta página.');
        navigate('/');
      }
    } catch (err) {
      console.error('❌ Error verificando token:', err);
      navigate('/');
    }
  }, []);

  // 📍 Mapa con Google Maps usando variable de entorno
  useEffect(() => {
    const initMap = () => {
      const map = new (window as any).google.maps.Map(mapRef.current, {
        center: { lat: -33.2857, lng: -66.3552 },
        zoom: 14,
      });

      let marker: any = null;

      map.addListener('click', (e: any) => {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        setLatitud(lat.toFixed(7));
        setLongitud(lng.toFixed(7));

        if (marker) {
          marker.setMap(null);
        }

        marker = new (window as any).google.maps.Marker({
          position: { lat, lng },
          map,
        });
      });
    };

    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

    if (!(window as any).google || !(window as any).google.maps) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
      script.async = true;
      script.defer = true;
      script.onload = initMap;
      document.body.appendChild(script);
    } else {
      initMap();
    }
  }, []);

  // 📷 Imagen
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFoto(e.target.files[0]);
      setPreview(URL.createObjectURL(e.target.files[0]));
    }
  };

  // 📨 Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('nombre', nombre);
    formData.append('direccion', direccion);
    formData.append('latitud', latitud);
    formData.append('longitud', longitud);
    formData.append('deportes', deportes);
    formData.append('telefono', telefono);
    formData.append('whatsapp', whatsapp);
    if (foto) formData.append('foto', foto);

    try {
      const res = await fetch(`${API_URL}/api/canchas`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Error al crear cancha');
      }

      alert('✅ Cancha creada con éxito');
      setNombre('');
      setDireccion('');
      setLatitud('');
      setLongitud('');
      setDeportes('');
      setTelefono('');
      setWhatsapp('');
      setFoto(null);
      setPreview(null);
    } catch (err: any) {
      alert(`❌ ${err.message}`);
    }
  };

  if (!accesoPermitido) return null;

  return (
    <div>
      <Navbar />
      <div className="crear-cancha-container">
        <h2>Crear nueva cancha</h2>
        <form className="crear-cancha-form" onSubmit={handleSubmit} encType="multipart/form-data">
          <label>Nombre</label>
          <input type="text" value={nombre} onChange={e => setNombre(e.target.value)} required />

          <label>Dirección</label>
          <input type="text" value={direccion} onChange={e => setDireccion(e.target.value)} required />

          <label>Ubicación (tocá en el mapa)</label>
          <div ref={mapRef} className="map-container" />

          <label>Latitud</label>
          <input type="text" value={latitud} onChange={e => setLatitud(e.target.value)} required />

          <label>Longitud</label>
          <input type="text" value={longitud} onChange={e => setLongitud(e.target.value)} required />

          <label>Deportes (separados por coma)</label>
          <input type="text" value={deportes} onChange={e => setDeportes(e.target.value)} required />

          <label>Teléfono</label>
          <input type="text" value={telefono} onChange={e => setTelefono(e.target.value)} />

          <label>WhatsApp</label>
          <input type="text" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} />

          <label>Foto</label>
          <input type="file" accept="image/*" onChange={handleFileChange} />

          {preview && (
            <div className="preview">
              <img src={preview} alt="Preview" />
            </div>
          )}

          <button type="submit">Crear Cancha</button>
        </form>
      </div>
    </div>
  );
};

export default CrearCanchaPage;
