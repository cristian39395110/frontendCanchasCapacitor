import { useEffect, useState } from 'react';
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
  const [password2, setPassword2] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showPass2, setShowPass2] = useState(false);

  const [fotoPerfil, setFotoPerfil] = useState<File | null>(null);
  const [localidad, setLocalidad] = useState('');
  const [sexo, setSexo] = useState('');
  const [edad, setEdad] = useState('');
  const [codigoRef, setCodigoRef] = useState<string>('');
  const [enviando, setEnviando] = useState(false);

  const [mostrarModal, setMostrarModal] = useState(false);
  const navigate = useNavigate();
  const { coordenadas, error, cargando, obtenerUbicacion } = useUbicacion();

  // Prefill del ref desde ?ref= o ?referrer=ref%3D..., + localStorage
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);

      // 1) Caso simple: ?ref=MC00000011
      let ref = params.get('ref')?.trim() || '';

      // 2) Play Store-like: ?referrer=ref%3DMC00000011 (u otras combinaciones)
      if (!ref) {
        const raw = params.get('referrer'); // p.ej. "ref%3DMC00000011"
        if (raw) {
          const decoded = decodeURIComponent(raw); // "ref=MC00000011"
          const m = decoded.match(/(?:^|&|\?)ref=([^&]+)/i);
          if (m && m[1]) ref = m[1].trim();
        }
      }

      // 3) Si no vino en la URL, usa lo que ya quedó pendiente
      const refLS = localStorage.getItem('refPendiente') || '';

      const finalRef = ref || refLS || '';
      if (finalRef) {
        setCodigoRef((curr) => curr || finalRef);
        localStorage.setItem('refPendiente', finalRef);
      }
    } catch {}
  }, []);

  // Prefill del ref desde la URL o localStorage (sin romper nada)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const refUrl = params.get('ref');
      const refLS = localStorage.getItem('refPendiente') || '';
      const ref = refUrl || refLS || '';
      if (ref) {
        setCodigoRef((curr) => curr || ref);
        localStorage.setItem('refPendiente', ref);
      }
    } catch {}
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setEnviando(true);

      // Validación de doble contraseña
      if (password.length < 6) {
        toast.error('🔒 La contraseña debe tener al menos 6 caracteres.');
        setEnviando(false);
        return;
      }
      if (password !== password2) {
        toast.error('🔁 Las contraseñas no coinciden.');
        setEnviando(false);
        return;
      }

      // Tu patrón original con el hook
// Dentro de handleSubmit:
let coords = coordenadas;
if (!coords) {
  coords = await obtenerUbicacion(); // ahora SÍ devuelve coords o null
}
if (!coords) {
  toast.error('📍 Ubicación no disponible. Activá el GPS.');
  setEnviando(false);
  return;
}

// al armar formData:



      const { identifier: deviceId } = await Device.getId();

      const formData = new FormData();
      formData.append('nombre', nombre);
      formData.append('telefono', telefono);
      formData.append('email', email);
      formData.append('password', password);
      formData.append('localidad', localidad);
     formData.append('latitud', String(coords.lat));   // ✅ usar coords locales
formData.append('longitud', String(coords.lng)); 
      formData.append('sexo', sexo);
      formData.append('edad', edad); // el backend puede parseInt si quiere
      formData.append('deviceId', deviceId);

      // Referido opcional (puede ir vacío)
      const refFinal = (codigoRef || '').trim().toUpperCase();
      if (refFinal) formData.append('ref', refFinal);

      if (fotoPerfil) {
        formData.append('fotoPerfil', fotoPerfil);
      }

      await axios.post(`${API_URL}/api/usuarios`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      localStorage.removeItem('refPendiente');
      setMostrarModal(true);
    } catch (error: any) {
      console.error(error);
      const mensaje = error?.response?.data?.error || 'Error al registrar. Revisa los datos.';
      if (mensaje.includes('dispositivo')) {
        toast.error('📱 Ya existe una cuenta creada desde este celular. Solo se permite una por dispositivo.');
      } else if (mensaje.includes('email')) {
        toast.error('📧 Ya existe una cuenta con ese email.');
      } else if (mensaje.includes('referido') || mensaje.includes('código')) {
        toast.error('🎟️ Código de referido inválido.');
      } else {
        toast.error(`❌ ${mensaje}`);
      }
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="registro-container">
      <div className="registro-card">
        <h2 className="registro-title">Registro</h2>
        {cargando && <p>📍 Obteniendo ubicación...</p>}
        {error && <p style={{ color: 'red' }}>{error}</p>}

        <form onSubmit={handleSubmit} className="registro-form">
          <input type="text" placeholder="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
          <input type="text" placeholder="Teléfono" value={telefono} onChange={(e) => setTelefono(e.target.value)} required />
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />

          {/* Contraseña con ojito dentro del input */}
          <div className="input-eye">
            <input
              type={showPass ? 'text' : 'password'}
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
            <span
              className="eye-icon"
              onClick={() => setShowPass((s) => !s)}
              role="button"
              aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              title={showPass ? 'Ocultar' : 'Mostrar'}
              tabIndex={0}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setShowPass((s) => !s)}
            >
              {showPass ? '🙈' : '👁️'}
            </span>
          </div>

          {/* Repetir contraseña con ojito dentro del input */}
          <div className="input-eye">
            <input
              type={showPass2 ? 'text' : 'password'}
              placeholder="Repetir contraseña"
              value={password2}
              onChange={(e) => setPassword2(e.target.value)}
              required
              autoComplete="new-password"
            />
            <span
              className="eye-icon"
              onClick={() => setShowPass2((s) => !s)}
              role="button"
              aria-label={showPass2 ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              title={showPass2 ? 'Ocultar' : 'Mostrar'}
              tabIndex={0}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setShowPass2((s) => !s)}
            >
              {showPass2 ? '🙈' : '👁️'}
            </span>
          </div>

          <input type="text" placeholder="Localidad" value={localidad} onChange={(e) => setLocalidad(e.target.value)} required />

          <select value={sexo} onChange={(e) => setSexo(e.target.value)} required>
            <option value="" disabled hidden>Seleccionar sexo</option>
            <option value="masculino">Masculino</option>
            <option value="femenino">Femenino</option>
          </select>

          <input type="number" placeholder="Edad" value={edad} onChange={(e) => setEdad(e.target.value)} required />

          {/* Campo opcional para código de referido */}
          <input
            type="text"
            placeholder="Código de referido (opcional) - ej: MC00000042"
            value={codigoRef}
            onChange={(e) => setCodigoRef(e.target.value.trim())}
          />

          <label style={{ marginTop: '10px', fontWeight: 'bold' }}>Foto de perfil:</label>
          <input type="file" accept="image/*" onChange={(e) => setFotoPerfil(e.target.files?.[0] || null)} />
          {fotoPerfil && (
            <img
              src={URL.createObjectURL(fotoPerfil)}
              alt="Vista previa"
              className="preview-image"
              style={{ marginTop: '10px', borderRadius: '10px', maxHeight: '150px' }}
            />
          )}

          <button type="submit" disabled={cargando || enviando}>
            {enviando ? 'Enviando...' : 'Registrarse'}
          </button>
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
