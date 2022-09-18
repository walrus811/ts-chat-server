import WebSocket from 'ws';
export type WebSocketWithId = WebSocket.WebSocket & { id?: string; };