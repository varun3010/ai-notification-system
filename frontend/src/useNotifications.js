import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { api, API_URL } from './api';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || API_URL;

export function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('connect_error', (e) => setError(e.message));

    socket.on('notifications:snapshot', (list) => {
      setNotifications(list);
    });

    socket.on('notification:new', (n) => {
      setNotifications((prev) => [n, ...prev.filter((x) => x.id !== n.id)]);
    });

    socket.on('notification:updated', (n) => {
      setNotifications((prev) => prev.map((x) => (x.id === n.id ? n : x)));
    });

    socket.on('notifications:all-read', () => {
      setNotifications((prev) => prev.map((x) => ({ ...x, read: true })));
    });

    // initial REST hydration as a fallback if the snapshot is slow
    api.list().then(setNotifications).catch((e) => setError(e.message));

    return () => socket.disconnect();
  }, []);

  const create = useCallback(async (payload) => {
    // Optimistic: let the server be the source of truth and broadcast back
    await api.create(payload);
  }, []);

  const toggleRead = useCallback(async (id, read) => {
    await api.markRead(id, read);
  }, []);

  const markAllRead = useCallback(async () => {
    await api.markAllRead();
  }, []);

  return { notifications, connected, error, create, toggleRead, markAllRead };
}
