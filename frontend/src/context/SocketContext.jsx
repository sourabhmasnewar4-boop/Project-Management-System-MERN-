import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const socketRef = useRef(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
      socketRef.current = io(SOCKET_URL, { transports: ['websocket'] });

      socketRef.current.on('connect', () => {
        socketRef.current.emit('join_user', user._id);
      });

      socketRef.current.on('notification', (notif) => {
        setNotifications((prev) => [notif, ...prev]);
        setUnreadCount((c) => c + 1);
      });

      return () => {
        socketRef.current.disconnect();
        socketRef.current = null;
      };
    }
  }, [user]);

  const joinProject = (projectId) => {
    if (socketRef.current) socketRef.current.emit('join_project', projectId);
  };

  const leaveProject = (projectId) => {
    if (socketRef.current) socketRef.current.emit('leave_project', projectId);
  };

  const onProjectEvent = (event, handler) => {
    if (socketRef.current) socketRef.current.on(event, handler);
  };

  const offProjectEvent = (event, handler) => {
    if (socketRef.current) socketRef.current.off(event, handler);
  };

  const clearUnread = () => setUnreadCount(0);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, notifications, unreadCount, clearUnread, joinProject, leaveProject, onProjectEvent, offProjectEvent }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
