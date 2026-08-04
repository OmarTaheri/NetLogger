import { useEffect, useRef, useCallback, useState } from 'react';
import type { WsMessage, Visitor } from '@netlogger/shared/types';

export function useWebSocket(onNewVisitor?: (visitor: Visitor) => void) {
  const wsRef = useRef<WebSocket | null>(null);
  const retryRef = useRef<number | null>(null);
  const stoppedRef = useRef(false);
  const [connected, setConnected] = useState(false);
  const callbackRef = useRef(onNewVisitor);
  callbackRef.current = onNewVisitor;

  const connect = useCallback(() => {
    if (stoppedRef.current) return;
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${proto}//${window.location.host}/ws`);

    ws.onopen = () => setConnected(true);
    ws.onclose = () => {
      setConnected(false);
      if (!stoppedRef.current) retryRef.current = window.setTimeout(connect, 3000);
    };
    ws.onerror = () => ws.close();
    ws.onmessage = (event) => {
      try {
        const msg: WsMessage = JSON.parse(event.data);
        if (msg.type === 'new_visitor' && callbackRef.current) {
          callbackRef.current(msg.data);
        }
      } catch {}
    };

    wsRef.current = ws;
  }, []);

  useEffect(() => {
    stoppedRef.current = false;
    connect();
    return () => {
      stoppedRef.current = true;
      if (retryRef.current !== null) window.clearTimeout(retryRef.current);
      wsRef.current?.close();
    };
  }, [connect]);

  return { connected };
}
