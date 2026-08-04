import { WebSocket, WebSocketServer } from 'ws';
import type { Server } from 'http';
import { SESSION_COOKIE, verifyToken } from '../services/auth.service.js';

function parseCookieHeader(header: string) {
  return Object.fromEntries(header.split(';').flatMap((part) => {
    const separator = part.indexOf('=');
    if (separator < 1) return [];
    const key = part.slice(0, separator).trim();
    const value = part.slice(separator + 1).trim();
    try { return [[key, decodeURIComponent(value)]]; } catch { return [[key, value]]; }
  }));
}

class WebSocketManager {
  private wss: WebSocketServer | null = null;
  private clients = new Map<number, Set<WebSocket>>();

  init(server: Server) {
    this.wss = new WebSocketServer({ server, path: '/ws' });
    this.wss.on('connection', async (ws, request) => {
      try {
        const cookies = parseCookieHeader(request.headers.cookie || '');
        const user = cookies[SESSION_COOKIE] ? await verifyToken(cookies[SESSION_COOKIE]) : null;
        if (!user) {
          ws.close(1008, 'Unauthorized');
          return;
        }

        const userClients = this.clients.get(user.id) || new Set<WebSocket>();
        userClients.add(ws);
        this.clients.set(user.id, userClients);

        const remove = () => {
          userClients.delete(ws);
          if (userClients.size === 0) this.clients.delete(user.id);
        };
        ws.on('close', remove);
        ws.on('error', remove);
      } catch {
        ws.close(1008, 'Unauthorized');
      }
    });
  }

  broadcastToUser(userId: number, message: unknown) {
    const data = JSON.stringify(message);
    for (const client of this.clients.get(userId) || []) {
      if (client.readyState !== WebSocket.OPEN) continue;
      try {
        client.send(data);
      } catch {
        client.close();
      }
    }
  }
}

export const wsManager = new WebSocketManager();
