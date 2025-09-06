import { WebSocketServer } from "npm:ws";
import http from "node:http";

let wss: WebSocketServer;

export function setupWebSocket(server: http.Server) {
    wss = new WebSocketServer({ server, clientTracking: true });
}

export function broadcastUpdate(payload: object) {
    if (!wss) return;
    const message = JSON.stringify(payload);
    wss.clients.forEach(client => {
        if (client.readyState === client.OPEN) {
            client.send(message);
        }
    });
}