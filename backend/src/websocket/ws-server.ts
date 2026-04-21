import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { simulateTracking } from './tracking-simulator';

// OrderID -> Array of active client connections
export const subscriptions = new Map<string, WebSocket[]>();

export function broadcastLocationUpdate(update: { orderId: string, lat: number, lng: number, status: string, eta_minutes: number }) {
  const clients = subscriptions.get(update.orderId);
  if (clients) {
    clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: 'location_update', ...update }));
      }
    });
  }
}

export function setupWebSocket(server: Server) {
  const wss = new WebSocketServer({ server });

  wss.on('connection', (ws) => {
    console.log('Client connected to WebSocket Tracker.');

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        if (data.type === 'subscribe' && data.orderId) {
          const subs = subscriptions.get(data.orderId) || [];
          subs.push(ws);
          subscriptions.set(data.orderId, subs);
          console.log(`Client subscribed to tracking updates for ${data.orderId}`);
        }
      } catch (err) {
        console.error('Invalid WS message', err);
      }
    });

    ws.on('close', () => {
      // Clean up subscriptions on disconnect
      subscriptions.forEach((subs, orderId) => {
        const newSubs = subs.filter(client => client !== ws);
        if (newSubs.length === 0) {
          subscriptions.delete(orderId);
        } else {
          subscriptions.set(orderId, newSubs);
        }
      });
      console.log('Client disconnected from WebSocket Tracker.');
    });
  });

  // Start internal simulation dispatcher (Fallback for demo)
  simulateTracking((update) => {
    broadcastLocationUpdate(update);
  });

  console.log('WebSocket Server mounted on /ws endpoint');
}
