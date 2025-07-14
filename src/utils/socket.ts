// utils/socket.ts
import { io } from 'socket.io-client';
import { API_URL } from '../config';

export const socket = io(API_URL, {
  transports: ['websocket'],
  autoConnect: true,
});

socket.on('connect', () => {
  console.log('🔌 Conectado con socket ID:', socket.id);
});
