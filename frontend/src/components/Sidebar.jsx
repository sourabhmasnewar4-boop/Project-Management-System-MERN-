import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, FolderKanban, CheckSquare, Trello,
  Users, Calendar, Bell, User, Settings, ChevronLeft, ChevronRight, Zap
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/projects', icon: FolderKanban, label: 'Projects' },
  { to: '/tasks', icon: CheckSquare, label: 'Tasks' },
  { to: '/kanban', icon: Trello, label: 'Kanban Board' },
  { to: '/team', icon: Users, label: 'Team' },
  { to: '/calendar', icon: Calendar, label: 'Calendar' },
  { to: '/notifications', icon: Bell, label: 'Notifications', badge: true },
  { to: '/profile', icon: User, label: 'Profile' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

const Sidebar = ({ collapsed, onToggle }) => {
  const { user } = useAuth();
  const { unreadCount } = useSocket();

  return (
    <aside className={`${collapsed ? 'w-20' : 'w-64'} h-screen bg-white dark:bg-surface-800 border-r border-surface-200 dark:border-surface-700 flex flex-col transition-all duration-300 flex-shrink-0`}>
      {/* Logo */}
      <div className="flex items-center justify-between p-4 border-b border-surface-200 dark:border-surface-700">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-brand-500 to-brand-700 rounded-lg flex items-center justify-center shadow-glow">
              <Zap size={16} className="text-white" />
            </div>
            <span className="font-bold text-surface-900 dark:text-white text-lg">MediNex PM</span>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 bg-gradient-to-br from-brand-500 to-brand-700 rounded-lg flex items-center justify-center mx-auto shadow-glow">
            <Zap size={16} className="text-white" />
          </div>
        )}
        <button onClick={onToggle} className={`p-1.5 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-500 transition-colors ${collapsed ? 'hidden' : ''}`}>
          <ChevronLeft size={16} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 overflow-y-auto">
        <ul className="space-y-1">
          {navItems.map(({ to, icon: Icon, label, badge }) => (
            <li key={to}>
              <NavLink
                to={to}
                className={({ isActive }) =>
                  `sidebar-link ${isActive ? 'sidebar-link-active' : 'sidebar-link-inactive'} ${collapsed ? 'justify-center' : ''}`
                }
                title={collapsed ? label : undefined}
              >
                <div className="relative flex-shrink-0">
                  <Icon size={18} />
                  {badge && unreadCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 rounded-full text-white text-[9px] flex items-center justify-center font-bold">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </div>
                {!collapsed && <span>{label}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* User footer */}
      {!collapsed && user && (
        <div className="p-4 border-t border-surface-200 dark:border-surface-700">
          <div className="flex items-center gap-3">
            <img
              src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=6366f1&color=fff`}
              alt={user.name}
              className="w-8 h-8 rounded-full object-cover border-2 border-brand-200"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-surface-900 dark:text-surface-100 truncate">{user.name}</p>
              <p className="text-xs text-surface-500 capitalize">{user.role?.replace('-', ' ')}</p>
            </div>
          </div>
        </div>
      )}

      {/* Collapse toggle when collapsed */}
      {collapsed && (
        <div className="p-3 border-t border-surface-200 dark:border-surface-700">
          <button onClick={onToggle} className="w-full flex justify-center p-1.5 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-500 transition-colors">
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
