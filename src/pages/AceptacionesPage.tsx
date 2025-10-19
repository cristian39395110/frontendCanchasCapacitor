import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import { API_URL } from '../config';
import axios from 'axios';
import { FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { toast, ToastContainer } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import 'react-toastify/dist/ReactToastify.css';
import './AceptacionesPage.css';

const AceptacionesPage: React.FC = () => {
  const [partidosConAceptaciones, setPartidosConAceptaciones] = useState<any[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [botonBloqueado, setBotonBloqueado] = useState<{ [key: number]: boolean }>({});
  const [cantidadesEditadas, setCantidadesEditadas] = useState<{ [key: number]: number }>({});
  const usuarioId = localStorage.getItem('usuarioId') ?? '';
  const esPremium = localStorage.getItem('esPremium') === 'true';
  const [filtroFecha, setFiltroFecha] = useState<'futuros' | 'pasados' | 'todos'>('futuros');


  const navigate = useNavigate();
 const formatearFechaHora = (fecha: string) => {
  const [año, mes, dia] = fecha.split('-');
  return `${Number(dia)} de ${obtenerNombreMes(mes)} de ${año}`;
};

const obtenerNombreMes = (mes: string) => {
  const nombres = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
  ];
  return nombres[parseInt(mes, 10) - 1];
};


  useEffect(() => {
    refresh();
  }, [usuarioId]);

  const refresh = async () => {
    if (!usuarioId) return;
    const res = await fetch(`${API_URL}/api/pendientes/aceptadas/${usuarioId}`);
    const data = await res.json();
    setPartidosConAceptaciones(data);
  };

  const rechazarJugador = async (usuarioIdRechazado: number, partidoId: number) => {
    try {
      const res = await axios.post(`${API_URL}/api/pendientes/rechazar`, {
        usuarioId: usuarioId,
        jugadorId: usuarioIdRechazado,
        partidoId
      });
      if (res.data.error) {
        toast.error(res.data.error);
      } else {
        toast.success(res.data.mensaje || 'Jugador rechazado correctamente');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || '❌ No se pudo rechazar al jugador.');
    }
    refresh();
  };

  const solicitarNuevoJugador = async (partidoId: number) => {
  if (botonBloqueado[partidoId]) return;

  // Buscar el partido correspondiente
  const partido = partidosConAceptaciones.find(p => p.id === partidoId);
  if (!partido) return;

  const confirmados = partido.usuariosAceptaron?.filter((u: any) => u.estado?.trim() === 'confirmado').length ?? 0;

  // Limitar si no es premium y ya tiene 12 jugadores confirmados
  if (!esPremium && confirmados >= 12) {
    toast.warn('🔒 Como usuario no premium, solo podés tener hasta 12 jugadores confirmados.');
    return;
  }

  setBotonBloqueado((prev) => ({ ...prev, [partidoId]: true }));

  try {
    const res = await axios.post(`${API_URL}/api/partidos/reenviar-invitacion`, { partidoId });
    toast.success(res.data.mensaje || '🔁 Nueva invitación enviada a jugadores interesados.');
  } catch (error) {
    toast.error('❌ No se pudo enviar la invitación.');
  }

  setTimeout(() => {
    setBotonBloqueado((prev) => ({ ...prev, [partidoId]: false }));
  }, 10000);

  refresh();
};


 const actualizarCantidadJugadores = async (partidoId: number, nuevaCantidad: number) => {
  try {
    await axios.put(`${API_URL}/api/partidos/${partidoId}/actualizar-cantidad`, {
      cantidadJugadores: nuevaCantidad,
    });
    toast.success('Cantidad de jugadores actualizada ✅');
    refresh();
  } catch (err) {
    toast.error('❌ No se pudo actualizar la cantidad');
  }
};

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };
const hoy = new Date();

const partidosFiltrados = partidosConAceptaciones.filter((partido) => {
  const fechaPartido = new Date(`${partido.fecha}T${partido.hora}`);
  if (filtroFecha === 'futuros') return fechaPartido >= hoy;
  if (filtroFecha === 'pasados') return fechaPartido < hoy;
  return true; // 'todos'
});

  return (
    <div>
      <Navbar />
      <div className="pagina">
        <ToastContainer />
        <div className="contenedor">
          <h2 className="titulo">✅ Aceptaciones de jugadores</h2>

          <div className="filtros-fecha">
  <button onClick={() => setFiltroFecha('futuros')} className={filtroFecha === 'futuros' ? 'activo' : ''}>📅 Próximos</button>
  <button onClick={() => setFiltroFecha('pasados')} className={filtroFecha === 'pasados' ? 'activo' : ''}>🕒 Antiguos</button>
  <button onClick={() => setFiltroFecha('todos')} className={filtroFecha === 'todos' ? 'activo' : ''}>📋 Todos</button>
</div>


          {partidosConAceptaciones.length === 0 ? (
            <p className="mensaje">No hay jugadores que hayan aceptado tus invitaciones aún.</p>
          ) : (

            
            partidosFiltrados.map((partido: any) => {

              const cantidadJugadores = cantidadesEditadas[partido.id] ?? partido.cantidadJugadores ?? 0;
              const confirmados = partido.usuariosAceptaron.filter((u: any) => u.estado?.trim() === 'confirmado').length;
              const total = cantidadJugadores;
              const porcentaje = total > 0 ? Math.round((confirmados / total) * 100) : 0;
              const isExpanded = expandedId === partido.id;
              const soyOrganizador = Number(partido.organizadorId) === Number(usuarioId);
              const faltan = cantidadJugadores - confirmados;

              return (
                <motion.div key={partido.id} layout className="tarjeta">


                  <div className="cabecera">
                    <div>
                      <h1 className="deporte-titulo">
  <strong>{partido.deporte?.nombre || 'No especificada'}</strong>
</h1>
                      <p className="detalle">📍 <strong>Cancha:</strong> {partido.canchaNombreManual || partido.lugar}</p>
                      <p className="detalle">📫 <strong>Dirección:</strong> {partido.lugar || 'No especificada'}</p>
                       <p className="detalle">📫 <strong>Precio:</strong> {partido.precio} </p>
                      <p className="detalle">🌎 <strong>Localidad:</strong> {partido.localidad}</p>
                      <p className="detalle">🚻 <strong>Sexo:</strong> {partido.sexo}</p>
                      <p className="detalle">
                        🎂 <strong>Edad:</strong> {partido.rangoEdad ? partido.rangoEdad : 'Sin restricción'}
                      </p>

                      {partido.latitud && partido.longitud && (
                        <a
                          href={`https://www.google.com/maps?q=${partido.latitud},${partido.longitud}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="enlace-mapa"
                        >
                          🧭 Cómo llegar
                        </a>
                      )}

                      <p className="detalle">  📅 <strong>Fecha:</strong> {formatearFechaHora(partido.fecha)} | ⏰ <strong>Hora:</strong> {partido.hora}</p>
                      <div className="barra">
                        <div className="progreso" style={{ width: `${porcentaje}%` }}></div>
                      </div>
                      <p className="detalle-chico">✅ Confirmados: {confirmados}/{cantidadJugadores} ({porcentaje}%)</p>
                      {soyOrganizador && (
                     <form
  onSubmit={(e) => {
    e.preventDefault();
    const input = e.currentTarget.elements.namedItem('cantidad') as HTMLInputElement;
    const nuevaCantidad = Number(input.value);
    actualizarCantidadJugadores(partido.id, nuevaCantidad);
    setCantidadesEditadas((prev) => ({ ...prev, [partido.id]: nuevaCantidad }));
  }}
  className="form-editar-cantidad-horizontal"
>
  <label className="form-label">✏️</label>
  <input
    className="input-cantidad-estilizada"
    name="cantidad"
    type="number"
    value={cantidadJugadores}
    min={confirmados}
    onChange={(e) => {
      const value = Number(e.target.value);
      setCantidadesEditadas((prev) => ({ ...prev, [partido.id]: value }));
    }}
  />
  <button type="submit" className="boton-guardar-estilizado">Guardar</button>
</form>

                      )}
                    </div>
                    <span className="icono" onClick={() => toggleExpand(partido.id)}>{isExpanded ? <FiChevronUp /> : <FiChevronDown />}</span>
                  </div>

                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div key="contenido" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }} className="contenido">

                        <p className="detalle-chico">🎯 Faltan: <strong>{faltan > 0 ? faltan : 0}</strong> jugadores para completar</p>

                        <p className="subtitulo">✅ Aceptaron:</p>
                        {partido.usuariosAceptaron?.length > 0 ? (
                          partido.usuariosAceptaron.map((usuario: any) => {
                            const estado = usuario.estado?.trim().toLowerCase();
                            return (
                              <div key={usuario.id} className="jugador">
                                <div className="info" onClick={() => navigate(`/perfil/${usuario.id}`)} style={{ cursor: 'pointer' }}>
                                  <div className="inicial">{usuario.nombre?.charAt(0)}</div>
                                  <div>
                                    <p className="nombre-jugador">{usuario.nombre?.trim()}</p>
                                    {estado === 'confirmado' && <p className="confirmado">✔ Confirmado</p>}
                                  </div>
                                </div>
                                <button onClick={() => rechazarJugador(usuario.id, partido.id)} className="boton-eliminar">🗑️</button>
                              </div>
                            );
                          })
                        ) : (
                          <p className="mensaje">Ninguno aún</p>
                        )}

                        <p className="subtitulo">⏳ Pendientes:</p>
                        {partido.usuariosPendientes?.length > 0 ? (
                          partido.usuariosPendientes.map((usuario: any) => (
                            <div key={usuario.id} className="jugador">
                              <div className="info" onClick={() => navigate(`/perfil/${usuario.id}`)} style={{ cursor: 'pointer' }}>
                                <div className="inicial">{usuario.nombre?.charAt(0)}</div>
                                <div>
                                  <p className="nombre-jugador">{usuario.nombre?.trim()}</p>
                                  <p className="pendiente">⏳ Pendiente</p>
                                </div>
                              </div>
                              <button onClick={() => rechazarJugador(usuario.id, partido.id)} className="boton-eliminar">🗑️</button>
                            </div>
                          ))
                        ) : (
                          <p className="mensaje">No hay jugadores pendientes aún</p>
                        )}

                        <div className="acciones">
                          <button onClick={() => solicitarNuevoJugador(partido.id)} className="boton-accion" disabled={botonBloqueado[partido.id]}>
                            ➕ Pedir nuevo jugador
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default AceptacionesPage;
