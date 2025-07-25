import { io } from 'socket.io-client';
import { API_URL } from '../config';


export const socket = io(API_URL, {
  transports: ['websocket'],
  autoConnect: true,
});

socket.on('connect', () => {
  console.log('🔌 Conectado con socket ID:', socket.id);
});

// ✅ Mensaje individual
socket.on('mensajeNuevo', (mensaje: any) => {


 

  window.dispatchEvent(
    new CustomEvent('nuevoMensaje', {
      detail: { tipo: 'usuario', usuarioId: mensaje.emisorId },
    })
  );
});

// ✅ Mensaje de partido (grupo)
socket.on('nuevo-mensaje-partido', (mensaje: any) => {

  const partidoId = mensaje.partidoId;

  


  window.dispatchEvent(
    new CustomEvent('nuevoMensaje', {
      detail: { tipo: 'partido', partidoId },
    })
  );
});
