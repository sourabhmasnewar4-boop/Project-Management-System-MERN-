import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckSquare, Search, Filter, Plus, Pencil, Trash2, Calendar as CalIcon, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { format, isPast } from 'date-fns';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';

const priorityColor = { High: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', Medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', Low: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' };
const statusColor = { 'To Do': 'bg-surface-100 text-surface-600 dark:bg-surface-700 dark:text-surface-400', 'In Progress': 'bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400', 'Review': 'bg-yellow-100 text-yellow-700', 'Completed': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' };

const TaskForm = ({ initial, projects, users, onSave, onClose }) => {
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
  const [form, setForm] = useState(initial || { title: '', description: '', priority: 'Medium', dueDate: tomorrow.toISOString().split('T')[0], status: 'To Do', assignedTo: '', project: '' });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.project) return toast.error('Please select a project');
    setSaving(true);
    try { await onSave(form); } finally { setSaving(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div><label className="label">Project *</label>
        <select className="input" value={form.project} onChange={e => setForm({ ...form, project: e.target.value })} required>
          <option value="">Select project...</option>
          {projects.map(p => <option key={p._id} value={p._id}>{p.title}</option>)}
        </select>
      </div>
      <div><label className="label">Task Title *</label><input className="input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required placeholder="What needs to be done?" /></div>
      <div><label className="label">Description</label><textarea className="input resize-none" rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
      <div className="grid grid-cols-2 gap-4">
        <div><label className="label">Priority</label>
          <select className="input" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
            {['High', 'Medium', 'Low'].map(p => <option key={p}>{p}</option>)}
          </select>
        </div>
        <div><label className="label">Due Date *</label><input type="date" className="input" value={form.dueDate?.split('T')[0] || ''} onChange={e => setForm({ ...form, dueDate: e.target.value })} required /></div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div><label className="label">Status</label>
          <select className="input" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
            {['To Do', 'In Progress', 'Review', 'Completed'].map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div><label className="label">Assign To</label>
          <select className="input" value={form.assignedTo || ''} onChange={e => setForm({ ...form, assignedTo: e.target.value || null })}>
            <option value="">Unassigned</option>
            {users.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
          </select>
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
        <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">{saving ? 'Saving...' : initial ? 'Update' : 'Create'} Task</button>
      </div>
    </form>
  );
};

const Tasks = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [showCreate, setShowCreate] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const canCreate = ['admin', 'manager'].includes(user?.role);

  const fetchAll = async () => {
    try {
      const [tRes, pRes, uRes] = await Promise.all([api.get('/tasks'), api.get('/projects'), api.get('/users')]);
      setTasks(tRes.data);
      setProjects(pRes.data);
      setUsers(uRes.data);
    } catch { toast.error('Failed to load tasks'); } finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleCreate = async (form) => {
    try {
      const { data } = await api.post('/tasks', form);
      setTasks(prev => [data, ...prev]);
      setShowCreate(false);
      toast.success('Task created!');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to create task'); }
  };

  const handleUpdate = async (form) => {
    try {
      const { data } = await api.put(`/tasks/${editTask._id}`, form);
      setTasks(prev => prev.map(t => t._id === data._id ? data : t));
      setEditTask(null);
      toast.success('Task updated!');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to update task'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this task?')) return;
    try {
      await api.delete(`/tasks/${id}`);
      setTasks(prev => prev.filter(t => t._id !== id));
      toast.success('Task deleted');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to delete task'); }
  };

  const filtered = tasks.filter(t => {
    const s = `${t.title} ${t.description} ${t.project?.title} ${t.assignedTo?.name}`.toLowerCase();
    return s.includes(search.toLowerCase())
      && (statusFilter === 'All' || t.status === statusFilter)
      && (priorityFilter === 'All' || t.priority === priorityFilter);
  });

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Tasks</h1>
          <p className="text-surface-500 mt-1">{filtered.length} of {tasks.length} tasks</p>
        </div>
        {canCreate && <button onClick={() => setShowCreate(true)} className="btn-primary"><Plus size={16} /> New Task</button>}
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
          <input className="input pl-9 h-9 text-sm" placeholder="Search tasks..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {['All', 'To Do', 'In Progress', 'Review', 'Completed'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${statusFilter === s ? 'bg-brand-600 text-white' : 'bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-300 hover:bg-surface-200'}`}>{s}</button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {['All', 'High', 'Medium', 'Low'].map(p => (
            <button key={p} onClick={() => setPriorityFilter(p)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${priorityFilter === p ? 'bg-brand-600 text-white' : 'bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-300 hover:bg-surface-200'}`}>{p}</button>
          ))}
        </div>
      </div>

      {/* Task List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <CheckSquare size={48} className="mx-auto mb-4 text-surface-300" />
          <h3 className="text-surface-500 font-medium">No tasks found</h3>
          <p className="text-surface-400 text-sm mt-1">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900/50">
                  {['Task', 'Project', 'Priority', 'Status', 'Due Date', 'Assigned To', ''].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-surface-500 uppercase tracking-wide px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-200 dark:divide-surface-700">
                {filtered.map((t, i) => (
                  <motion.tr key={t._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                    className="hover:bg-surface-50 dark:hover:bg-surface-700/50 group transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <p className={`text-sm font-medium ${t.status === 'Completed' ? 'line-through text-surface-400' : 'text-surface-900 dark:text-surface-100'}`}>{t.title}</p>
                        {t.description && <p className="text-xs text-surface-400 truncate max-w-xs">{t.description}</p>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-surface-500">{t.project?.title || '—'}</td>
                    <td className="px-4 py-3"><span className={`badge ${priorityColor[t.priority]}`}>{t.priority}</span></td>
                    <td className="px-4 py-3"><span className={`badge ${statusColor[t.status]}`}>{t.status}</span></td>
                    <td className="px-4 py-3">
                      <span className={`text-sm flex items-center gap-1 ${isPast(new Date(t.dueDate)) && t.status !== 'Completed' ? 'text-red-500 font-medium' : 'text-surface-500'}`}>
                        <CalIcon size={12} />{format(new Date(t.dueDate), 'MMM d, yyyy')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {t.assignedTo ? (
                        <div className="flex items-center gap-2">
                          <img src={t.assignedTo.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(t.assignedTo.name)}&background=6366f1&color=fff`} alt={t.assignedTo.name} className="w-6 h-6 rounded-full" />
                          <span className="text-xs text-surface-600 dark:text-surface-300">{t.assignedTo.name}</span>
                        </div>
                      ) : <span className="text-xs text-surface-400">Unassigned</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {canCreate && <button onClick={() => setEditTask({ ...t, assignedTo: t.assignedTo?._id || '', project: t.project?._id || t.project })} className="p-1.5 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-400 hover:text-brand-600 transition-colors"><Pencil size={14} /></button>}
                        {(canCreate || (t.assignedTo?._id === user?._id)) && <button onClick={() => handleDelete(t._id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-surface-400 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create Task" size="lg">
        <TaskForm projects={projects} users={users} onSave={handleCreate} onClose={() => setShowCreate(false)} />
      </Modal>
      <Modal isOpen={!!editTask} onClose={() => setEditTask(null)} title="Edit Task" size="lg">
        {editTask && <TaskForm initial={editTask} projects={projects} users={users} onSave={handleUpdate} onClose={() => setEditTask(null)} />}
      </Modal>
    </div>
  );
};

export default Tasks;
