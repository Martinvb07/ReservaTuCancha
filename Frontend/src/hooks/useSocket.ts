'use client';

import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useSession } from 'next-auth/react';

type SocketEvent = 'new-booking' | 'booking-cancelled' | 'payment-confirmed';
type Listener = (data: any) => void;

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:4000';

export function useSocket() {
  const { data: session } = useSession();
  const token = (session as any)?.accessToken;
  const socketRef = useRef<Socket | null>(null);
  const listenersRef = useRef<Map<string, Set<Listener>>>(new Map());

  useEffect(() => {
    if (!token) return;

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    socketRef.current = socket;

    // Re-attach any listeners that were registered before connection
    listenersRef.current.forEach((listeners, event) => {
      listeners.forEach((fn) => socket.on(event, fn));
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token]);

  const on = useCallback((event: SocketEvent, fn: Listener) => {
    if (!listenersRef.current.has(event)) {
      listenersRef.current.set(event, new Set());
    }
    listenersRef.current.get(event)!.add(fn);

    // If socket already connected, attach immediately
    socketRef.current?.on(event, fn);

    // Return cleanup function
    return () => {
      listenersRef.current.get(event)?.delete(fn);
      socketRef.current?.off(event, fn);
    };
  }, []);

  return { on };
}
