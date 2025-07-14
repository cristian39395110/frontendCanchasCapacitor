import React, { useState } from 'react';
import { API_URL } from '../config';
import './CambiarFotoPerfil.css';
import { Toast } from '@capacitor/toast';

interface Props {
  usuarioId: string;
  fotoActual: string | null;
  onFotoActualizada: (nuevaUrl: string | null) => void;
}

const CambiarFotoPerfil: React.FC<Props> = ({ usuarioId, fotoActual, onFotoActualizada }) => {
  const [nuevaFoto, setNuevaFoto] = useState<File | null>(null);
  const [, setSubiendo] = useState(false);

  const mostrarToast = async (mensaje: string) => {
    await Toast.show({ text: mensaje });
  };

  const handleActualizar = async () => {
    if (!nuevaFoto) return;
    setSubiendo(true);

    await mostrarToast('📤 Subiendo foto...');

    const formData = new FormData();
    formData.append('foto', nuevaFoto);

    try {
      const res = await fetch(`${API_URL}/api/usuarios/${usuarioId}/foto`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        onFotoActualizada(data.fotoPerfil);
        await mostrarToast('✅ Foto actualizada');
      } else {
        await mostrarToast('❌ Error al actualizar la foto');
      }
    } catch (err) {
      console.error(err);
      await mostrarToast('❌ Error inesperado');
    } finally {
      setSubiendo(false);
    }
  };

  const handleEliminar = async () => {
    try {
      const res = await fetch(`${API_URL}/api/usuarios/${usuarioId}/foto`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (res.ok) {
        onFotoActualizada(null);
        await mostrarToast('✅ Foto eliminada');
      } else {
        await mostrarToast('❌ Error al eliminar la foto');
      }
    } catch (err) {
      console.error(err);
      await mostrarToast('❌ Error inesperado');
    }
  };

  const handleArchivo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNuevaFoto(file);
      await handleActualizar();
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
