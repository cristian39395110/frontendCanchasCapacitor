import React, { useEffect, useState, useRef } from 'react';
import {  useNavigate, useSearchParams } from 'react-router-dom';


import Navbar from '../components/Navbar';
import { API_URL } from '../config';

const PremiumNotificarPage: React.FC = () => {
   const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const deporteId = searchParams.get('deporteId');
  

  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [nivelFiltro, setNivelFiltro] = useState('');
  const [nombreFiltro, setNombreFiltro] = useState('');
  const [pagina, setPagina] = useState(1);
  const [hayMas, setHayMas] = useState(true);
  const [seleccionados, setSeleccionados] = useState<Set<number>>(new Set());
  const [seleccionarTodos, setSeleccionarTodos] = useState(false);
   
  const observer = useRef<IntersectionObserver | null>(null);
  const finDeListaRef = useRef<HTMLDivElement | null>(null);

  const cargarUsuarios = async (reiniciar = false) => {
    if (!deporteId) return;
    const pag = reiniciar ? 1 : pagina;
    const datosPartido = JSON.parse(localStorage.getItem('datosPartido') || '{}');
const partidoId = datosPartido.partidoId;

const url = `${API_URL}/api/premium/usuarios?partidoId=${partidoId}&nivel=${nivelFiltro}&nombre=${nombreFiltro}&pagina=${pag}&limite=5`;


    try {
      const res = await fetch(url);
      const data = await res.json();

      const nuevos = reiniciar ? data : [...usuarios, ...data];
      const sinDuplicados = Array.from(new Map(nuevos.map((u: any) => [u.id, u])).values());


      setUsuarios(sinDuplicados);
      if (reiniciar) {
        setSeleccionados(new Set());
        setSeleccionarTodos(false);
        setPagina(2);
      } else {
        setPagina(pag + 1);
      }

      setHayMas(data.length === 5);
    } catch (err) {
      console.error(err);
    }
  };

useEffect(() => {
  const delay = setTimeout(() => {
    cargarUsuarios(true);
  }, 300);

  return () => clearTimeout(delay);
}, [nivelFiltro, nombreFiltro]);

  useEffect(() => {
    if (!hayMas) return;
    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        cargarUsuarios();
      }
    });

    if (finDeListaRef.current) {
      observer.current.observe(finDeListaRef.current);
    }

    return () => observer.current?.disconnect();
  }, [usuarios, hayMas]);

  const handleFiltrarPorNombre = () => {
    setPagina(1);
    cargarUsuarios(true);
  };

  const toggleSeleccionado = (id: number) => {
    const nuevo = new Set(seleccionados);
    nuevo.has(id) ? nuevo.delete(id) : nuevo.add(id);
    setSeleccionados(nuevo);
  };

  const toggleSeleccionarTodos = () => {
    const nuevo = new Set(seleccionados);
    if (!seleccionarTodos) {
      usuarios.forEach(u => nuevo.add(u.id));
    } else {
      usuarios.forEach(u => nuevo.delete(u.id));
    }
    setSeleccionados(nuevo);
    setSeleccionarTodos(!seleccionarTodos);
  };

  const handleEnviarNotificaciones = async () => {
  if (seleccionados.size === 0) {
    alert('Seleccioná al menos un jugador');
    return;
  }

  const datosPartido = JSON.parse(localStorage.getItem('datosPartido') || '{}');
  const partidoId = datosPartido.partidoId;

  console.log(partidoId)

  if (!partidoId) {
    alert('No se encontró el partido. Volvé a crear uno.');
    return;
  }

  try {
    const res = await fetch(`${API_URL}/api/fcm/individual`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        usuarios: Array.from(seleccionados),
        partidoId,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || 'Error al enviar notificaciones');
      return;
    }

    if (data.enviados === 0) {
      alert('⚠️ No se enviaron notificaciones porque el partido ya está lleno.');
    } else {
      alert(`✅ Se enviaron ${data.enviados} notificaciones correctamente`);
      localStorage.removeItem('datosPartido');
    }
  } catch (err) {
    console.error(err);
    alert('❌ Error al enviar notificaciones');
  }
};


  return (
    <div>
      <Navbar />
      <div style={{ padding: '20px', maxWidth: '600px', margin: '80px auto' }}>
        <h2>Jugadores disponibles</h2>

        <label style={{ fontWeight: 'bold' }}>Filtrar por nivel</label>
        <select
          value={nivelFiltro}
          onChange={(e) => setNivelFiltro(e.target.value)}
          style={{ width: '100%', padding: '12px', marginBottom: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
        >
          <option value="">-- Todos los niveles --</option>
          <option value="amateur">Amateur</option>
          <option value="medio">Intermedio</option>
          <option value="alto">Avanzado</option>
          <option value="pro">Profesional</option>
        </select>

        <label style={{ fontWeight: 'bold' }}>Buscar por nombre</label>
        <input
          type="text"
          value={nombreFiltro}
          onChange={(e) => setNombreFiltro(e.target.value)}
          placeholder="Ej: Lucas"
          style={{ width: '100%', padding: '12px', marginBottom: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
        />
        <button
          onClick={handleFiltrarPorNombre}
          style={{ width: '100%', padding: '10px', marginBottom: '20px', backgroundColor: '#007bff', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold' }}
        >
          Buscar
        </button>

        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
          <input type="checkbox" checked={seleccionarTodos} onChange={toggleSeleccionarTodos} style={{ marginRight: '8px' }} />
          <label><strong>Seleccionar todos</strong></label>
        </div>

        {usuarios.map((usuario) => (
          <div key={usuario.id} style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '10px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <strong>{usuario.nombre}</strong><br />
              Nivel: {usuario.UsuarioDeportes?.[0]?.nivel || 'Sin definir'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <input type="checkbox" checked={seleccionados.has(usuario.id)} onChange={() => toggleSeleccionado(usuario.id)} />
              <button
                onClick={async () => {
  const datosPartido = JSON.parse(localStorage.getItem('datosPartido') || '{}');
  const partidoId = datosPartido.partidoId;

  if (!partidoId) {
    alert('No se encontró el partido.');
    return;
  }

  await fetch(`${API_URL}/api/fcm/individual`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usuarios: [usuario.id], mensaje: '¡Te están invitando a jugar!', partidoId }),
  });

  alert(`Notificación enviada a ${usuario.nombre}`);
}}

                style={{ backgroundColor: '#17a2b8', color: '#fff', border: 'none', borderRadius: '4px', padding: '5px', fontSize: '12px' }}
              >
                Notificar
              </button>
              <button
                onClick={() => navigate(`/chat/${usuario.id}`)}
                style={{ backgroundColor: '#ffc107', color: '#000', border: 'none', borderRadius: '4px', padding: '5px', fontSize: '12px' }}
              >
                Chatear
              </button>
            </div>
          </div>
        ))}

        <div ref={finDeListaRef} style={{ height: '20px' }}></div>

        <button
          onClick={handleEnviarNotificaciones}
          style={{ width: '100%', padding: '12px', backgroundColor: '#28a745', color: '#fff', fontSize: '16px', border: 'none', borderRadius: '6px', fontWeight: 'bold' }}
        >
          Enviar notificaciones a seleccionados
        </button>
      </div>
    </div>
  );
};

export default PremiumNotificarPage;
