import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Filter, FolderKanban, Pencil, Trash2, Users, Calendar, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';

const statusOptions = ['Not Started', 'In Progress', 'Completed'];
const statusColor = {
  'Not Started': 'bg-surface-100 text-surface-600 dark:bg-surface-700 dark:text-surface-300',
  'In Progress': 'bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400',
  'Completed': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
};

const ProjectForm = ({ initial, onSave, onClose, users }) => {
  const today = new Date().toISOString().split('T')[0];
  const [form, setForm] = useState(initial || {
    title: '', description: '', startDate: today,
    deadline: '', status: 'Not Started', members: [],
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.deadline) return toast.error('Title and deadline required');
    setSaving(true);
    try {
      await onSave(form);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label">Project Title *</label>
        <input className="input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="My awesome project" required />
      </div>
      <div>
        <label className="label">Description</label>
        <textarea className="input resize-none" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="What is this project about?" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Start Date</label>
          <input type="date" className="input" value={form.startDate ? form.startDate.split('T')[0] : ''} onChange={e => setForm({ ...form, startDate: e.target.value })} />
        </div>
        <div>
          <label className="label">Deadline *</label>
          <input type="date" className="input" value={form.deadline ? form.deadline.split('T')[0] : ''} onChange={e => setForm({ ...form, deadline: e.target.value })} required />
        </div>
      </div>
      <div>
        <label className="label">Status</label>
        <select className="input" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
          {statusOptions.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>
      <div>
        <label className="label">Assign Members</label>
        <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 border border-surface-200 dark:border-surface-700 rounded-xl">
          {users.map(u => (
            <label key={u._id} className="flex items-center gap-1.5 cursor-pointer px-2 py-1 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700">
              <input type="checkbox" checked={form.members.includes(u._id)}
                onChange={e => setForm({ ...form, members: e.target.checked ? [...form.members, u._id] : form.members.filter(id => id !== u._id) })} />
              <img src={u.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=6366f1&color=fff`} alt={u.name} className="w-5 h-5 rounded-full" />
              <span className="text-xs text-surface-700 dark:text-surface-300">{u.name}</span>
            </label>
          ))}
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
        <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">{saving ? 'Saving...' : initial ? 'Update' : 'Create'} Project</button>
      </div>
    </form>
  );
};

const Projects = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showCreate, setShowCreate] = useState(false);
  const [editProject, setEditProject] = useState(null);
  const canCreate = ['admin', 'manager'].includes(user?.role);

  const fetchProjects = async () => {
    try {
      const [pRes, uRes] = await Promise.all([api.get('/projects'), api.get('/users')]);
      setProjects(pRes.data);
      setUsers(uRes.data);
    } catch { toast.error('Failed to load projects'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchProjects(); }, []);

  const handleCreate = async (form) => {
    try {
      const { data } = await api.post('/projects', form);
      setProjects(prev => [data, ...prev]);
      setShowCreate(false);
      toast.success('Project created!');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to create project'); }
  };

  const handleUpdate = async (form) => {
    try {
      const { data } = await api.put(`/projects/${editProject._id}`, form);
      setProjects(prev => prev.map(p => p._id === data._id ? data : p));
      setEditProject(null);
      toast.success('Project updated!');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to update project'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this project and all its tasks?')) return;
    try {
      await api.delete(`/projects/${id}`);
      setProjects(prev => prev.filter(p => p._id !== id));
      toast.success('Project deleted');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to delete project'); }
  };

  const filtered = projects.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Projects</h1>
          <p className="text-surface-500 mt-1">{projects.length} project{projects.length !== 1 ? 's' : ''} total</p>
        </div>
        {canCreate && <button onClick={() => setShowCreate(true)} className="btn-primary"><Plus size={16} /> New Project</button>}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
          <input className="input pl-9" placeholder="Search projects..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-surface-400" />
          {['All', ...statusOptions].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${statusFilter === s ? 'bg-brand-600 text-white' : 'bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-300 hover:bg-surface-200'}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Projects Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <FolderKanban size={48} className="mx-auto mb-4 text-surface-300" />
          <h3 className="text-surface-500 font-medium">No projects found</h3>
          <p className="text-surface-400 text-sm mt-1">{canCreate ? 'Create your first project to get started' : 'No projects assigned to you yet'}</p>
          {canCreate && <button onClick={() => setShowCreate(true)} className="btn-primary mt-4 mx-auto"><Plus size={16} /> New Project</button>}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map((p, i) => (
            <motion.div key={p._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="card p-6 hover:shadow-card-hover hover:-translate-y-1 group">
              <div className="flex items-start justify-between mb-3">
                <span className={`badge ${statusColor[p.status]}`}>{p.status}</span>
                {(user?.role === 'admin' || p.owner?._id === user?._id) && (
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setEditProject({ ...p, members: p.members.map(m => m._id || m) })} className="p-1.5 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-400 hover:text-brand-600 transition-colors"><Pencil size={14} /></button>
                    <button onClick={() => handleDelete(p._id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-surface-400 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                  </div>
                )}
              </div>
              <Link to={`/projects/${p._id}`}>
                <h3 className="font-semibold text-surface-900 dark:text-surface-100 mb-1 group-hover:text-brand-600 transition-colors">{p.title}</h3>
              </Link>
              <p className="text-sm text-surface-500 mb-4 line-clamp-2">{p.description || 'No description'}</p>
              {/* Progress */}
              <div className="mb-4">
                <div className="flex justify-between text-xs text-surface-500 mb-1.5">
                  <span>{p.completedTasks}/{p.totalTasks} tasks</span>
                  <span>{p.progress || 0}%</span>
                </div>
                <div className="h-2 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-brand-500 to-brand-400 rounded-full transition-all duration-500" style={{ width: `${p.progress || 0}%` }} />
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-surface-500">
                <div className="flex items-center gap-1"><Calendar size={12} /><span>{format(new Date(p.deadline), 'MMM d, yyyy')}</span></div>
                <div className="flex -space-x-1">
                  {p.members?.slice(0, 3).map(m => (
                    <img key={m._id} src={m.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(m.name)}&background=6366f1&color=fff`} alt={m.name} className="w-6 h-6 rounded-full border-2 border-white dark:border-surface-800 object-cover" title={m.name} />
                  ))}
                  {p.members?.length > 3 && <div className="w-6 h-6 rounded-full border-2 border-white dark:border-surface-800 bg-surface-200 dark:bg-surface-600 flex items-center justify-center text-[9px] font-bold text-surface-600">+{p.members.length - 3}</div>}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create New Project" size="lg">
        <ProjectForm onSave={handleCreate} onClose={() => setShowCreate(false)} users={users} />
      </Modal>

      <Modal isOpen={!!editProject} onClose={() => setEditProject(null)} title="Edit Project" size="lg">
        {editProject && <ProjectForm initial={editProject} onSave={handleUpdate} onClose={() => setEditProject(null)} users={users} />}
      </Modal>
    </div>
  );
};

export default Projects;
