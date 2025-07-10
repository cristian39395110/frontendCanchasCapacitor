import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import { API_URL } from '../config';
import './NuevoJuegoPage.css';

const NuevoJuegoPage: React.FC = () => {
  const [nombre, setNombre] = useState('');
  const [imagen, setImagen] = useState<File | null>(null);
  const [subiendo, setSubiendo] = useState(false);

  const handleCrearDeporte = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre || !imagen) {
      alert('Debes completar el nombre y la imagen.');
      return;
    }

    try {
      setSubiendo(true);

      const formData = new FormData();
      formData.append('nombre', nombre);
      formData.append('imagen', imagen);

      const res = await fetch(`${API_URL}/api/deportes`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Error al guardar en el backend');

      alert('✅ Deporte creado correctamente');
      setNombre('');
      setImagen(null);
    } catch (error) {
      console.error(error);
      alert('❌ Error al crear el deporte');
    } finally {
      setSubiendo(false);
    }
  };

  return (
    <div>
      <Navbar />
      <div className="nuevo-juego-container">
        <div className="nuevo-juego-form">
          <h2>Crear Nuevo Deporte</h2>
          <form onSubmit={handleCrearDeporte}>
            <input
              type="text"
              placeholder="Nombre del deporte"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImagen(e.target.files?.[0] || null)}
            />
            <button type="submit" disabled={subiendo}>
              {subiendo ? 'Subiendo...' : 'Subir Deporte'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default NuevoJuegoPage;
