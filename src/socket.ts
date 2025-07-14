// src/socket.ts
import { io, Socket } from 'socket.io-client';
import { API_URL } from './config';

let socket: Socket | null = null;

export const conectarSocket = (usuarioId: string) => {
  if (!socket && usuarioId) {
    socket = io(API_URL, {
      query: { usuarioId },
      transports: ['websocket', 'polling'], // ✅ soporte total para Render
      upgrade: true
    });

    socket.on('connect', () => {
      console.log(`✅ Socket conectado como usuario-${usuarioId}`);
    });

    socket.on('connect_error', (err) => {
      console.error('❌ Error al conectar con WebSocket:', err.message);
    });
  }
};

export const obtenerSocket = (): Socket | null => socket;
