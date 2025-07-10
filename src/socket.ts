// src/socket.ts
import { io, Socket } from 'socket.io-client';
import { API_URL } from './config';

let socket: Socket | null = null;

export const conectarSocket = (usuarioId: string) => {
  if (!socket && usuarioId) {
    socket = io(API_URL, {
      query: { usuarioId }
    });

    socket.on('connect', () => {
      console.log(`✅ Socket conectado como usuario-${usuarioId}`);
    });
  }
};

export const obtenerSocket = (): Socket | null => socket;
