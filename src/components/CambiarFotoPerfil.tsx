import React, { useState } from 'react';
import { API_URL } from '../config';
import './CambiarFotoPerfil.css';

interface Props {
  usuarioId: string;
  fotoActual: string | null;
  onFotoActualizada: (nuevaUrl: string | null) => void;
}

const CambiarFotoPerfil: React.FC<Props> = ({ usuarioId, fotoActual, onFotoActualizada }) => {
  const [nuevaFoto, setNuevaFoto] = useState<File | null>(null);
  const [, setSubiendo] = useState(false);

  const handleActualizar = async () => {
    if (!nuevaFoto) return;
    setSubiendo(true);
    const formData = new FormData();
    formData.append('foto', nuevaFoto);

    try {
      const res = await fetch(`${API_URL}/api/usuarios/${usuarioId}/foto`, {
        method: 'PATCH',
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        onFotoActualizada(data.fotoPerfil);
        alert('✅ Foto actualizada');
      } else {
        alert('❌ Error al actualizar la foto');
      }
    } catch (err) {
      console.error(err);
      alert('❌ Error inesperado');
    } finally {
      setSubiendo(false);
    }
  };

  const handleEliminar = async () => {
    if (!window.confirm('¿Estás seguro de eliminar tu foto de perfil?')) return;

    try {
      const res = await fetch(`${API_URL}/api/usuarios/${usuarioId}/foto`, {
        method: 'DELETE'
      });

      if (res.ok) {
        onFotoActualizada(null);
        alert('✅ Foto eliminada');
      } else {
        alert('❌ Error al eliminar la foto');
      }
    } catch (err) {
      console.error(err);
      alert('❌ Error inesperado');
    }
  };

  const handleArchivo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNuevaFoto(file);
      await handleActualizar(); // se actualiza automáticamente al elegir
    }
  };

  return (
    <div className="cambiar-foto-perfil">
      <div className="foto-perfil-contenedor">
        <img src={fotoActual || '/default-avatar.png'} alt="Foto de perfil" />

        {fotoActual && (
          <button className="btn-eliminar-foto" onClick={handleEliminar}>×</button>
        )}

        <label htmlFor="inputFoto" className="btn-cambiar-foto">📷</label>
        <input
          id="inputFoto"
          type="file"
          accept="image/*"
          onChange={handleArchivo}
          className="input-foto-hidden"
        />
      </div>
    </div>
  );
};

export default CambiarFotoPerfil;
