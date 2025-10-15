import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_WEBSOCKET_URL || 'http://localhost:3000';

export const socket = io(SOCKET_URL, {
  autoConnect: true,
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5,
});

socket.on('connect', () => {
  console.log('✅ Conectado ao WebSocket');
});

socket.on('disconnect', () => {
  console.log('❌ Desconectado do WebSocket');
});

socket.on('connect_error', (error) => {
  console.error('❌ Erro na conexão WebSocket:', error);
});

export default socket;
