import type { LeaderboardEntry } from "../types";

export type LeaderboardEvent =
  | { type: "score_submitted"; entry: LeaderboardEntry }
  | { type: "ping" };

const WS_URL = import.meta.env.VITE_WS_URL?.replace(/\/$/, "") ?? "";

export function isWsConfigured(): boolean {
  return WS_URL.length > 0;
}

interface ConnectLeaderboardOptions {
  onEvent: (event: LeaderboardEvent) => void;
  onError?: (error: Event) => void;
  onReconnect?: () => void;
}

export function connectLeaderboard(
  options: ConnectLeaderboardOptions,
): () => void {
  let ws: WebSocket | null = null;
  let closed = false;
  let reconnectDelay = 1000;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let hasConnectedBefore = false;

  function connect(): void {
    if (closed || !isWsConfigured()) return;

    ws = new WebSocket(WS_URL);

    ws.onopen = () => {
      reconnectDelay = 1000;
      if (hasConnectedBefore) {
        options.onReconnect?.();
      }
      hasConnectedBefore = true;
    };

    ws.onmessage = (message) => {
      try {
        const event = JSON.parse(String(message.data)) as LeaderboardEvent;
        if (event && typeof event.type === "string") {
          options.onEvent(event);
        }
      } catch {
        // Ignore malformed messages.
      }
    };

    ws.onerror = (error) => {
      options.onError?.(error);
    };

    ws.onclose = () => {
      ws = null;
      if (closed) return;

      reconnectTimer = setTimeout(() => {
        reconnectDelay = Math.min(reconnectDelay * 2, 30_000);
        connect();
      }, reconnectDelay);
    };
  }

  connect();

  return () => {
    closed = true;
    if (reconnectTimer) clearTimeout(reconnectTimer);
    ws?.close();
  };
}
