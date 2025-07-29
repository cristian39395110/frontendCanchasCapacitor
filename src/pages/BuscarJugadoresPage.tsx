  import React, { useState, useEffect } from 'react';
  import Navbar from '../components/Navbar';
  import { API_URL } from '../config';
  import { useNavigate } from 'react-router-dom';
  import { Geolocation } from '@capacitor/geolocation';
  import MapaLeaflet from '../components/MapaLeaflet';
  import './BuscarJugadoresPage.css';
  import { toast } from 'react-toastify';


import 'react-toastify/dist/ReactToastify.css';


  const BuscarJugadoresPage: React.FC = () => {
    const [deportes, setDeportes] = useState<any[]>([]);
    const [filtro, setFiltro] = useState('');
    const [deporteSeleccionado, setDeporteSeleccionado] = useState<any>(null);
    const [latitud, setLatitud] = useState<number | null>(null);
    const [longitud, setLongitud] = useState<number | null>(null);
    const [localidadInput, setLocalidadInput] = useState('');
    const [lugar, setLugar] = useState('');
    const [fecha, setFecha] = useState('');
    const [hora, setHora] = useState('');
    const [nombre, setNombre] = useState('');
    const [cantidadJugadores, setCantidadJugadores] = useState<number>(0);
    const [canchas, setCanchas] = useState<any[]>([]);
    const [canchaSeleccionada, setCanchaSeleccionada] = useState<any | null>(null);
    const [canchaManual, setCanchaManual] = useState('');
    const [sexo, setSexo] = useState<'todos' | 'masculino' | 'femenino'>('todos');
  const [rangoEdad, setRangoEdad] = useState<string[]>([]);
  const [categorias, setCategorias] = useState<string[]>([]);
  const [enviando, setEnviando] = useState(false);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);



    const [ubicacionManual, setUbicacionManual] = useState(false);

    const navigate = useNavigate();

    const token = localStorage.getItem('token');
    const decoded = token ? JSON.parse(atob(token.split('.')[1])) : null;
    const organizadorId = decoded?.id ?? null;
    const esPremium = decoded?.premium ?? false;
    const [mostrarModalPremium, setMostrarModalPremium] = useState(false);


   useEffect(() => {
  const obtenerUbicacion = async () => {
    try {
      // 1️⃣ Primero obtenemos la ubicación guardada del usuario
      const res = await fetch(`${API_URL}/api/usuarios/${organizadorId}/ubicacion`);

      const data = await res.json();
      if (data.latitud && data.longitud) {
        setLatitud(data.latitud);
        setLongitud(data.longitud);
      }

      // 2️⃣ Luego intentamos obtener la ubicación en tiempo real
      const permiso = await Geolocation.requestPermissions();
      if (permiso.location === 'granted') {
        const posicion = await Geolocation.getCurrentPosition();
        setLatitud(posicion.coords.latitude);
        setLongitud(posicion.coords.longitude);
        setUbicacionManual(false);
      } else {
        console.warn('📍 Usando ubicación guardada (GPS denegado)');
      }
    } catch (error) {
      console.warn('❌ No se pudo obtener ubicación actual. Usando ubicación guardada.', error);
    }
  };

  obtenerUbicacion();

  // Cargar canchas y deportes
  fetch(`${API_URL}/api/canchas`)
    .then(res => res.json())
    .then(setCanchas)
    .catch(console.error);

  fetch(`${API_URL}/api/deportes`)
    .then(res => res.json())
    .then(setDeportes)
    .catch(console.error);
}, []);


    const handleEnviarNotificacion = async () => {
      if (enviando) return;        // ✅ Previene doble clic
    setEnviando(true);    
      if (!fecha || !hora || !localidadInput || !lugar || !cantidadJugadores || !nombre.trim() || !deporteSeleccionado) {
        toast.error('Completa todos los campos correctamente.');
         setEnviando(false);
        return;
      }

      if (!latitud || !longitud) {
        toast.error('Intenta marcar la ubicación en el mapa');
         setEnviando(false);
        return;
      }

      if (!esPremium) {
        if (cantidadJugadores > 12) {
          toast.error('Como usuario no premium, solo podés ingresar hasta 12 jugadores.');
          setEnviando(false);

          return;
        }
 const fechaSinZona = fecha;       // "2025-07-19"
  const horaSinZona = hora;  
  console.log("fechaSinZona")   
  console.log(fechaSinZona)   
  console.log("horaSinZona") 
  console.log(horaSinZona) 


  const res = await fetch(`${API_URL}/api/partidos/cantidad`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      usuarioId: organizadorId,
      fecha: fechaSinZona
    }),
  });

  const data = await res.json();

        if (data.cantidad >= 1) {
          toast.error('Solo podés crear 1 partidos por día siendo usuario no premium.');
          setEnviando(false);
          return;
        }
      }
        if (rangoEdad.length === 0 && categorias.length === 0) {
      toast.warning('⚠️ No seleccionaste edad ni categoría. Se invitará a todos los jugadores por defecto.');
       setEnviando(false);
    } else if (rangoEdad.length === 0) {
      toast.warning('⚠️ No seleccionaste rango de edad. Se invitará a todas las edades.');
       setEnviando(false);
    } else if (categorias.length === 0) {
      toast.warning('⚠️ No seleccionaste categoría. Se invitará a todas las categorías.');
       setEnviando(false);
    }
  const fechaSinZona = fecha;       // "2025-07-19"
  const horaSinZona = hora;  
  console.log("fechaSinZona")   
  console.log(fechaSinZona)   
  console.log("horaSinZona") 
  console.log(horaSinZona)  // "15:30"
  // ejemplo: "2025-07-19T15:30:00"
      const partidoData = {
        fecha: fechaSinZona,
        hora:horaSinZona,
        lugar,
        nombre,
        localidad: localidadInput,
        cantidadJugadores,
        deporteId: deporteSeleccionado.id,
        organizadorId,
        latitud,
        longitud,
        rangoEdad,   // ← Array de strings
    categorias,
        canchaId: canchaSeleccionada?.id || null,
  canchaNombreManual: canchaSeleccionada?.nombre || canchaManual || null,

        sexo,
        ubicacionManual,
      
      };

      //const endpoint = esPremium ? `${API_URL}/api/partidos/ispremium` : `${API_URL}/api/partidos`;

      fetch(`${API_URL}/api/partidos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(partidoData),
      })
        .then(res => res.ok ? res.json() : res.json().then(err => { throw new Error(err.error); }))
      .then(data => {
    if (!esPremium && data.cantidad >= 2) {
      setMostrarModalPremium(true);
      return;
    }

    toast.success('¡Partido creado y notificaciones enviadas!');
    setDeporteSeleccionado(null);
    setCantidadJugadores(0);
    setLocalidadInput('');
    setLugar('');
    setFecha('');
    setHora('');
      setEnviando(false); //
  }
  )

        .catch(err => {
          console.error(err);
          setEnviando(false); 
          toast.error('❌ Ocurrió un error al crear el partido.');
          
        });
    };

    const deportesFiltrados = deportes.filter((d) => d.nombre.toLowerCase().includes(filtro.toLowerCase()));

    return (
      <div>
        <Navbar />
       <div className="buscar-jugadores-container">

          <h2 style={{ textAlign: 'center' }}>Buscar Jugadores</h2>

          {!deporteSeleccionado ? (
            <>
              <input
                type="text"
                placeholder="Filtrar deportes"
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
                style={{ width: '100%', padding: '10px', marginBottom: '15px' }}
              />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px' }}>
                {deportesFiltrados.map((deporte) => (
                  <div
                    key={deporte.id}
                    onClick={() => setDeporteSeleccionado(deporte)}
                    style={{
                      borderRadius: '8px',
                      overflow: 'hidden',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      cursor: 'pointer',
                      backgroundColor: '#fff',
                    }}
                  >
                    <img src={deporte.imagen} alt={deporte.nombre} style={{ width: '100%', height: '120px', objectFit: 'cover' }} />
                    <h4 style={{ textAlign: 'center', margin: 0, padding: '10px', color: 'black' }}>{deporte.nombre}</h4>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <h3 style={{ textAlign: 'center' }}>{deporteSeleccionado.nombre}</h3>
              <img
                src={deporteSeleccionado.imagen}
                alt={deporteSeleccionado.nombre}
                style={{ width: '100%', borderRadius: '8px', marginBottom: '20px' }}
              />

<label>Seleccionar Cancha</label>
<div style={{ position: 'relative' }}>
  <input
  type="text"
  value={canchaManual}
  onChange={(e) => {
    const valor = e.target.value;
    setCanchaManual(valor);
    setMostrarSugerencias(true); // mostrar mientras escribe

    const seleccionada = canchas.find(c =>
      c.nombre.toLowerCase() === valor.toLowerCase()
    );
    setCanchaSeleccionada(seleccionada || null);
  }}
  onBlur={() => {
    // Esperamos un toque para que se registre el click
    setTimeout(() => setMostrarSugerencias(false), 150);
  }}
  onFocus={() => {
    if (canchaManual) setMostrarSugerencias(true);
  }}
  placeholder="Escribí o seleccioná una cancha"
  style={{ width: '100%', marginBottom: '5px' }}
/>

  {/* Sugerencias filtradas */}
{mostrarSugerencias && canchaManual.length > 0 && (
  <ul className="sugerencias">
    {canchas
      .filter(c =>
        c.nombre.toLowerCase().includes(canchaManual.toLowerCase())
      )
      .map(c => (
        <li
          key={c.id}
          onClick={() => {
            setCanchaManual(c.nombre);
            setCanchaSeleccionada(c);
            setMostrarSugerencias(false); // ocultar al seleccionar
          }}
        >
          {c.nombre}
        </li>
      ))}
  </ul>
)}

</div>

              <label>Nombre del establecimiento</label>
              <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} style={{ width: '100%', marginBottom: '15px' }} />

              <label>Localidad</label>
              <input type="text" value={localidadInput} onChange={(e) => setLocalidadInput(e.target.value)} placeholder="Ej: Rosario, Santa Fe" style={{ width: '100%', marginBottom: '15px' }} />

              <label>Dirección</label>
              <input type="text" value={lugar} onChange={(e) => setLugar(e.target.value)} style={{ width: '100%', marginBottom: '15px' }} />

              <h4>Ubicación en el mapa (opcional)</h4>
              <MapaLeaflet
                latitud={latitud || -34.6}
                longitud={longitud || -58.4}
                onChangeUbicacion={(newLat, newLng) => {
                  setLatitud(newLat);
                  setLongitud(newLng);
                  setUbicacionManual(true);
                }}
              />

              <label>Sexo</label>
              <select value={sexo} onChange={(e) => setSexo(e.target.value as any)} style={{ width: '100%', marginBottom: '15px' }}>
                <option value="todos">Todos</option>
                <option value="masculino">Masculino</option>
                <option value="femenino">Femenino</option>
              </select>

  <label>Rango de edad</label>
  <div className="checkbox-group">
    {['adolescente', 'joven', 'veterano'].map((rango) => (
      <label key={rango}>
        <input
          type="checkbox"
          value={rango}
          checked={rangoEdad.includes(rango)}
          onChange={(e) => {
            const checked = e.target.checked;
            setRangoEdad(prev =>
              checked ? [...prev, rango] : prev.filter(item => item !== rango)
            );
          }}
        />
        {rango === 'adolescente' ? '10 a 20 años' : rango === 'joven' ? '21 a 40 años' : '41 en adelante'}
      </label>
    ))}
  </div>

  <label>Categoría</label>
  <div className="checkbox-group">
    {['amateur', 'medio', 'alto', 'pro'].map((cat) => (
      <label key={cat}>
        <input
          type="checkbox"
          value={cat}
          checked={categorias.includes(cat)}
          onChange={(e) => {
            const checked = e.target.checked;
            setCategorias(prev =>
              checked ? [...prev, cat] : prev.filter(item => item !== cat)
            );
          }}
        />
        {cat.charAt(0).toUpperCase() + cat.slice(1)}
      </label>
    ))}
  </div>


              <label>Fecha</label>
              <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} style={{ width: '100%' }} />

              <label>Hora</label>
              <input type="time" value={hora} onChange={(e) => setHora(e.target.value)} style={{ width: '100%' }} />

              <label>Cantidad de jugadores</label>
              <input type="number" value={cantidadJugadores} onChange={(e) => setCantidadJugadores(Number(e.target.value))} style={{ width: '100%' }} />

              <div style={{ display: 'flex', marginTop: '20px', gap: '10px' }}>
          <button
    onClick={handleEnviarNotificacion}
    disabled={enviando}
    style={{
      flex: 1,
      backgroundColor: enviando ? 'gray' : 'green',
      color: 'white',
      padding: '12px',
      cursor: enviando ? 'not-allowed' : 'pointer',
      border: 'none',
      borderRadius: '6px',
      fontWeight: 'bold'
    }}
  >
    {enviando ? 'Enviando...' : 'Crear Partido'}
  </button>


                <button onClick={() => setDeporteSeleccionado(null)} style={{ flex: 1, backgroundColor: 'red', color: 'white', padding: '12px' }}>
                  Volver
                </button>

                {mostrarModalPremium && (
    <div className="modal-overlay" onClick={() => setMostrarModalPremium(false)}>
      <div className="modal-premium" onClick={(e) => e.stopPropagation()}>
        <button className="cerrar-modal" onClick={() => setMostrarModalPremium(false)}>❌</button>
        <h2>💥 ¡Alcanzaste el límite!</h2>
        <p>Como usuario gratuito, solo podés crear 2 partidos por día.</p>
        <p>Pasate a <strong>MatchClub Premium</strong> y desbloqueá:</p>
        <ul style={{ textAlign: 'left', marginTop: '10px' }}>
          <li>✅ Partidos ilimitados</li>
          <li>✅ Hasta 100 jugadores por partido</li>
          <li>✅ Invitaciones masivas</li>
          <li>✅ Promoción destacada de tus partidos</li>
        </ul>
        <button
          onClick={() => {
            setMostrarModalPremium(false);
            navigate('/premium');
          }}
          style={{ marginTop: '20px', padding: '10px 20px', backgroundColor: 'gold', borderRadius: '8px', fontWeight: 'bold', border: 'none' }}
        >
          Ver Planes Premium
        </button>
      </div>
    </div>
  )}

              </div>
            </>
          )}
       
        </div>
      </div>
    );
  };

  export default BuscarJugadoresPage;
