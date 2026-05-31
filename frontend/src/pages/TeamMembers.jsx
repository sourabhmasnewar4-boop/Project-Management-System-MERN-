import { useEffect, useState } from 'react';
import { Users, Briefcase, CheckSquare, Shield, ChevronDown, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const roleColor = { admin: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', manager: 'bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400', 'team-member': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' };
const roleLabel = { admin: '👑 Admin', manager: '📋 Manager', 'team-member': '💻 Team Member' };

const TeamMembers = () => {
  const { user } = useAuth();
  const [workloads, setWorkloads] = useState([]);
  const [loading, setLoading] = useState(true);
  const isAdmin = user?.role === 'admin';

  const fetchWorkloads = async () => {
    try {
      const { data } = await api.get('/users/workload');
      setWorkloads(data);
    } catch { toast.error('Failed to load team data'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchWorkloads(); }, []);

  const handleRoleChange = async (userId, role) => {
    try {
      await api.put(`/users/${userId}/role`, { role });
      setWorkloads(prev => prev.map(w => w.user._id === userId ? { ...w, user: { ...w.user, role } } : w));
      toast.success('Role updated!');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to update role'); }
  };

  const handleDelete = async (userId) => {
    if (!confirm('Remove this team member? Their tasks will be unassigned.')) return;
    try {
      await api.delete(`/users/${userId}`);
      setWorkloads(prev => prev.filter(w => w.user._id !== userId));
      toast.success('Member removed');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to remove member'); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Team Members</h1>
          <p className="text-surface-500 mt-1">{workloads.length} members in your organization</p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Members', value: workloads.length, icon: Users, color: 'bg-brand-500' },
          { label: 'Active Tasks', value: workloads.reduce((s, w) => s + w.activeTasksCount, 0), icon: Briefcase, color: 'bg-amber-500' },
          { label: 'Completed Tasks', value: workloads.reduce((s, w) => s + w.completedTasksCount, 0), icon: CheckSquare, color: 'bg-emerald-500' },
        ].map(s => (
          <div key={s.label} className="card p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.color}`}>
              <s.icon size={18} className="text-white" />
            </div>
            <div>
              <p className="text-xs text-surface-500">{s.label}</p>
              <p className="text-xl font-bold text-surface-900 dark:text-surface-100">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Members grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {workloads.map(({ user: member, activeTasksCount, completedTasksCount, tasks }, i) => (
          <motion.div key={member._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="card p-5 hover:shadow-card-hover transition-all group">
            <div className="flex items-start gap-3 mb-4">
              <div className="relative">
                <img src={member.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=6366f1&color=fff&size=64`} alt={member.name} className="w-12 h-12 rounded-xl object-cover" />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white dark:border-surface-800" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-surface-900 dark:text-surface-100 truncate">{member.name}</h3>
                <p className="text-xs text-surface-500 truncate">{member.email}</p>
                <span className={`badge mt-1 ${roleColor[member.role]}`}>{roleLabel[member.role]}</span>
              </div>
              {isAdmin && member._id !== user._id && (
                <button onClick={() => handleDelete(member._id)} className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-50 dark:hover:bg-red-900/20 text-surface-400 hover:text-red-500 transition-all"><Trash2 size={14} /></button>
              )}
            </div>

            {/* Workload bar */}
            <div className="mb-3">
              <div className="flex justify-between text-xs text-surface-500 mb-1.5">
                <span>Workload</span>
                <span>{activeTasksCount} active / {completedTasksCount} done</span>
              </div>
              <div className="h-1.5 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
                {(activeTasksCount + completedTasksCount) > 0 && (
                  <div className="h-full bg-gradient-to-r from-brand-500 to-emerald-500 rounded-full"
                    style={{ width: `${Math.round((completedTasksCount / (activeTasksCount + completedTasksCount)) * 100)}%` }} />
                )}
              </div>
            </div>

            {/* Active tasks preview */}
            {tasks.length > 0 && (
              <div className="space-y-1 mb-3">
                {tasks.slice(0, 2).map(t => (
                  <div key={t._id} className="flex items-center gap-2 text-xs text-surface-500 bg-surface-50 dark:bg-surface-700 rounded-lg px-2 py-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${t.priority === 'High' ? 'bg-red-500' : t.priority === 'Medium' ? 'bg-yellow-500' : 'bg-green-500'}`} />
                    <span className="truncate">{t.title}</span>
                  </div>
                ))}
                {tasks.length > 2 && <p className="text-xs text-surface-400 pl-2">+{tasks.length - 2} more tasks</p>}
              </div>
            )}

            {/* Role changer (admin only) */}
            {isAdmin && member._id !== user._id && (
              <div className="relative">
                <select className="input text-xs h-8 w-full" value={member.role} onChange={e => handleRoleChange(member._id, e.target.value)}>
                  <option value="admin">Admin</option>
                  <option value="manager">Manager</option>
                  <option value="team-member">Team Member</option>
                </select>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default TeamMembers;
