import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../config';
import { useUbicacion } from '../hooks/useUbicacion';
import { Device } from '@capacitor/device';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './Registro.css';

function Registro() {
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fotoPerfil, setFotoPerfil] = useState<File | null>(null);
  const [localidad, setLocalidad] = useState('');
  const [sexo, setSexo] = useState('');
  const [edad, setEdad] = useState('');
  const [mostrarModal, setMostrarModal] = useState(false);
  const navigate = useNavigate();
  const { coordenadas, error: errorUbicacion, cargando } = useUbicacion();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!coordenadas) {
      toast.error('📍 Ubicación no disponible. Activa el GPS.');
      return;
    }

    try {
      const { identifier: deviceId } = await Device.getId();

      const formData = new FormData();
      formData.append('nombre', nombre);
      formData.append('telefono', telefono);
      formData.append('email', email);
      formData.append('password', password);
      formData.append('localidad', localidad);
      formData.append('latitud', String(coordenadas.lat));
      formData.append('longitud', String(coordenadas.lng));
      formData.append('sexo', sexo);
      formData.append('edad', edad);
      formData.append('deviceId', deviceId);

      if (fotoPerfil) {
        formData.append('fotoPerfil', fotoPerfil);
      }

      await axios.post(`${API_URL}/api/usuarios`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setMostrarModal(true);
    } catch (error: any) {
  console.error(error);
  const mensaje = error?.response?.data?.error || 'Error al registrar. Revisa los datos.';

  if (mensaje.includes('dispositivo')) {
    toast.error('📱 Ya existe una cuenta creada desde este celular. Solo se permite una por dispositivo.');
  } else if (mensaje.includes('email')) {
    toast.error('📧 Ya existe una cuenta con ese email.');
  } else {
    toast.error(`❌ ${mensaje}`);
  }
}
  }

  return (
    <div className="registro-container">
      <div className="registro-card">
        <h2 className="registro-title">Registro</h2>
        {cargando && <p>📍 Obteniendo ubicación...</p>}
        {errorUbicacion && <p style={{ color: 'red' }}>{errorUbicacion}</p>}

        <form onSubmit={handleSubmit} className="registro-form">
          <input type="text" placeholder="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
          <input type="text" placeholder="Teléfono" value={telefono} onChange={(e) => setTelefono(e.target.value)} required />
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input type="password" placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <input type="text" placeholder="Localidad" value={localidad} onChange={(e) => setLocalidad(e.target.value)} required />

          <select value={sexo} onChange={(e) => setSexo(e.target.value)} required>
            <option value="" disabled hidden>Seleccionar sexo</option>
            <option value="masculino">Masculino</option>
            <option value="femenino">Femenino</option>
          </select>

          <input type="number" placeholder="Edad" value={edad} onChange={(e) => setEdad(e.target.value)} required />
          <label style={{ marginTop: '10px', fontWeight: 'bold' }}>Foto de perfil:</label>
<input
  type="file"
  accept="image/*"
  onChange={(e) => setFotoPerfil(e.target.files?.[0] || null)}
/>
{fotoPerfil && (
  <img
    src={URL.createObjectURL(fotoPerfil)}
    alt="Vista previa"
    className="preview-image"
    style={{ marginTop: '10px', borderRadius: '10px', maxHeight: '150px' }}
  />
)}


          <button type="submit" disabled={cargando}>Registrarse</button>
        </form>

        <button className="volver-btn" onClick={() => navigate(-1)}>Volver</button>
      </div>

      {mostrarModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <p>✔️ Registro exitoso. Revisá tu email para confirmar.</p>
            <button onClick={() => navigate('/login')}>Entendido</button>
          </div>
        </div>
      )}

      <ToastContainer position="top-center" autoClose={4000} />
    </div>
  );
}

export default Registro;
