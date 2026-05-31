import { useEffect, useState } from 'react';
import { Bell, CheckCheck, Trash2, BellOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import api from '../utils/api';
import { useSocket } from '../context/SocketContext';
import toast from 'react-hot-toast';

const typeIcon = { TASK_ASSIGNED: '📋', TASK_UPDATED: '✏️', PROJECT_UPDATED: '📁', COMMENT_ADDED: '💬', SYSTEM_ALERT: '🔔' };
const typeColor = {
  TASK_ASSIGNED: 'bg-brand-100 dark:bg-brand-900/30',
  TASK_UPDATED: 'bg-yellow-100 dark:bg-yellow-900/30',
  PROJECT_UPDATED: 'bg-purple-100 dark:bg-purple-900/30',
  COMMENT_ADDED: 'bg-green-100 dark:bg-green-900/30',
  SYSTEM_ALERT: 'bg-red-100 dark:bg-red-900/30',
};

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const { clearUnread } = useSocket();

  useEffect(() => {
    api.get('/notifications').then(r => { setNotifications(r.data); clearUnread(); }).catch(() => toast.error('Failed to load notifications')).finally(() => setLoading(false));
  }, []);

  const markRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch { toast.error('Failed to mark as read'); }
  };

  const markAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      toast.success('All notifications marked as read');
    } catch { toast.error('Failed to mark all as read'); }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title flex items-center gap-2"><Bell size={24} /> Notifications</h1>
          {unreadCount > 0 && <p className="text-surface-500 mt-1">{unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}</p>}
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="btn-secondary text-sm"><CheckCheck size={16} /> Mark all read</button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="card p-12 text-center">
          <BellOff size={48} className="mx-auto mb-4 text-surface-300" />
          <h3 className="text-surface-500 font-medium">All caught up!</h3>
          <p className="text-surface-400 text-sm mt-1">No notifications to show right now.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n, i) => (
            <motion.div key={n._id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
              className={`card p-4 flex items-start gap-4 cursor-pointer transition-all hover:shadow-card-hover ${!n.isRead ? 'border-l-4 border-l-brand-500' : ''}`}
              onClick={() => !n.isRead && markRead(n._id)}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg ${typeColor[n.type]}`}>
                {typeIcon[n.type]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className={`text-sm font-medium ${n.isRead ? 'text-surface-600 dark:text-surface-400' : 'text-surface-900 dark:text-surface-100'}`}>{n.title}</p>
                  {!n.isRead && <div className="w-2 h-2 rounded-full bg-brand-500 flex-shrink-0 mt-1" />}
                </div>
                <p className="text-sm text-surface-500 mt-0.5">{n.message}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  {n.sender && (
                    <div className="flex items-center gap-1">
                      <img src={n.sender.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(n.sender.name)}&background=6366f1&color=fff&size=32`} alt={n.sender.name} className="w-4 h-4 rounded-full" />
                      <span className="text-xs text-surface-400">{n.sender.name}</span>
                    </div>
                  )}
                  <span className="text-xs text-surface-400">{format(new Date(n.createdAt), 'MMM d, h:mm a')}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications;
