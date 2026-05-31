import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FolderKanban, CheckSquare, Clock, AlertTriangle, Users, TrendingUp, Plus, ArrowRight } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { motion } from 'framer-motion';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { format, isPast } from 'date-fns';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444'];

const StatCard = ({ icon: Icon, label, value, color, to, delay }) => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}>
    <Link to={to || '#'} className="stat-card flex items-center gap-4 group">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon size={22} className="text-white" />
      </div>
      <div>
        <p className="text-surface-500 text-sm">{label}</p>
        <p className="text-2xl font-bold text-surface-900 dark:text-surface-100">{value}</p>
      </div>
      <ArrowRight size={16} className="ml-auto text-surface-300 group-hover:text-brand-500 transition-colors" />
    </Link>
  </motion.div>
);

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ projects: 0, completed: 0, pending: 0, overdue: 0, members: 0 });
  const [recentProjects, setRecentProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [projectsRes, tasksRes, usersRes] = await Promise.all([
          api.get('/projects'),
          api.get('/tasks'),
          api.get('/users'),
        ]);

        const projects = projectsRes.data;
        const allTasks = tasksRes.data;
        const users = usersRes.data;
        const now = new Date();

        const overdueTasks = allTasks.filter(t => t.status !== 'Completed' && isPast(new Date(t.dueDate)));
        const completedTasks = allTasks.filter(t => t.status === 'Completed');
        const pendingTasks = allTasks.filter(t => t.status !== 'Completed' && !isPast(new Date(t.dueDate)));

        setStats({
          projects: projects.length,
          completed: completedTasks.length,
          pending: pendingTasks.length,
          overdue: overdueTasks.length,
          members: users.length,
        });
        setRecentProjects(projects.slice(0, 5));
        setTasks(allTasks.slice(0, 8));
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const pieData = [
    { name: 'Completed', value: stats.completed },
    { name: 'Pending', value: stats.pending },
    { name: 'Overdue', value: stats.overdue },
  ].filter(d => d.value > 0);

  const barData = [
    { name: 'To Do', count: tasks.filter(t => t.status === 'To Do').length },
    { name: 'In Progress', count: tasks.filter(t => t.status === 'In Progress').length },
    { name: 'Review', count: tasks.filter(t => t.status === 'Review').length },
    { name: 'Completed', count: tasks.filter(t => t.status === 'Completed').length },
  ];

  const upcomingTasks = tasks
    .filter(t => t.status !== 'Completed' && !isPast(new Date(t.dueDate)))
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .slice(0, 5);

  const priorityColor = { High: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', Medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', Low: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' };
  const statusColor = { 'To Do': 'bg-surface-100 text-surface-600', 'In Progress': 'bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400', 'Review': 'bg-yellow-100 text-yellow-700', 'Completed': 'bg-green-100 text-green-700' };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Welcome back, {user?.name?.split(' ')[0]}! 👋</h1>
          <p className="text-surface-500 mt-1">Here's what's happening with your projects today.</p>
        </div>
        {(user?.role === 'admin' || user?.role === 'manager') && (
          <Link to="/projects" className="btn-primary">
            <Plus size={16} /> New Project
          </Link>
        )}
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard icon={FolderKanban} label="Total Projects" value={stats.projects} color="bg-brand-500" to="/projects" delay={0} />
        <StatCard icon={CheckSquare} label="Completed Tasks" value={stats.completed} color="bg-emerald-500" to="/tasks?status=Completed" delay={0.05} />
        <StatCard icon={Clock} label="Pending Tasks" value={stats.pending} color="bg-amber-500" to="/tasks" delay={0.1} />
        <StatCard icon={AlertTriangle} label="Overdue Tasks" value={stats.overdue} color="bg-red-500" to="/tasks" delay={0.15} />
        <StatCard icon={Users} label="Team Members" value={stats.members} color="bg-violet-500" to="/team" delay={0.2} />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="card p-6">
          <h2 className="section-title mb-4">Task Distribution</h2>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} innerRadius={40} paddingAngle={4} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex flex-col items-center justify-center text-surface-400">
              <CheckSquare size={40} className="mb-2 opacity-30" />
              <p className="text-sm">No task data yet</p>
            </div>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 }} className="card p-6">
          <h2 className="section-title mb-4">Tasks by Status</h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={barData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Recent Projects & Upcoming Deadlines */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Projects */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">Recent Projects</h2>
            <Link to="/projects" className="text-sm text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          {recentProjects.length === 0 ? (
            <div className="text-center py-8 text-surface-400">
              <FolderKanban size={40} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">No projects yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentProjects.map((p) => (
                <Link key={p._id} to={`/projects/${p._id}`}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors group">
                  <div className="w-8 h-8 rounded-lg bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center flex-shrink-0">
                    <FolderKanban size={14} className="text-brand-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-surface-900 dark:text-surface-100 truncate group-hover:text-brand-600 transition-colors">{p.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1.5 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
                        <div className="h-full bg-brand-500 rounded-full transition-all" style={{ width: `${p.progress || 0}%` }} />
                      </div>
                      <span className="text-xs text-surface-500 flex-shrink-0">{p.progress || 0}%</span>
                    </div>
                  </div>
                  <span className={`badge text-xs ${p.status === 'Completed' ? 'bg-green-100 text-green-700' : p.status === 'In Progress' ? 'bg-brand-100 text-brand-700' : 'bg-surface-100 text-surface-600'}`}>
                    {p.status}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </motion.div>

        {/* Upcoming Deadlines */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">Upcoming Deadlines</h2>
            <Link to="/calendar" className="text-sm text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1">
              Calendar <ArrowRight size={14} />
            </Link>
          </div>
          {upcomingTasks.length === 0 ? (
            <div className="text-center py-8 text-surface-400">
              <Clock size={40} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">No upcoming deadlines</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingTasks.map((t) => (
                <div key={t._id} className="flex items-center gap-3 p-3 rounded-xl bg-surface-50 dark:bg-surface-700/50">
                  <div>
                    <p className="text-sm font-medium text-surface-900 dark:text-surface-100">{t.title}</p>
                    <p className="text-xs text-surface-500">{t.project?.title}</p>
                  </div>
                  <div className="ml-auto flex flex-col items-end gap-1">
                    <span className={`badge ${priorityColor[t.priority]}`}>{t.priority}</span>
                    <span className="text-xs text-surface-500">{format(new Date(t.dueDate), 'MMM d')}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
