import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Plus, CheckSquare, Users, Calendar, TrendingUp, Pencil, Trash2, Paperclip, MessageSquare } from 'lucide-react';
import { format, isPast } from 'date-fns';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';

const priorityColor = { High: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', Medium: 'bg-yellow-100 text-yellow-700', Low: 'bg-green-100 text-green-700' };
const statusColor = { 'To Do': 'bg-surface-100 text-surface-600', 'In Progress': 'bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400', 'Review': 'bg-yellow-100 text-yellow-700', 'Completed': 'bg-green-100 text-green-700' };

const TaskForm = ({ initial, onSave, onClose, users }) => {
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
  const [form, setForm] = useState(initial || { title: '', description: '', priority: 'Medium', dueDate: tomorrow.toISOString().split('T')[0], status: 'To Do', assignedTo: '' });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try { await onSave(form); }
    finally { setSaving(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div><label className="label">Task Title *</label><input className="input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required placeholder="What needs to be done?" /></div>
      <div><label className="label">Description</label><textarea className="input resize-none" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Add more details..." /></div>
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

const CommentSection = ({ taskId }) => {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [content, setContent] = useState('');
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    if (!taskId) return;
    api.get(`/comments/${taskId}`).then(r => setComments(r.data)).catch(() => {});
  }, [taskId]);

  const postComment = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    setPosting(true);
    try {
      const { data } = await api.post('/comments', { taskId, content });
      setComments(prev => [...prev, data]);
      setContent('');
    } catch { toast.error('Failed to post comment'); }
    finally { setPosting(false); }
  };

  return (
    <div className="space-y-3">
      <div className="space-y-3 max-h-60 overflow-y-auto">
        {comments.length === 0 ? <p className="text-sm text-surface-400 text-center py-4">No comments yet. Start the discussion!</p> : (
          comments.map(c => (
            <div key={c._id} className="flex gap-3">
              <img src={c.author?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.author?.name || 'U')}&background=6366f1&color=fff`} alt={c.author?.name} className="w-7 h-7 rounded-full flex-shrink-0 object-cover" />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold text-surface-900 dark:text-surface-100">{c.author?.name}</span>
                  <span className="text-xs text-surface-400">{format(new Date(c.createdAt), 'MMM d, h:mm a')}</span>
                </div>
                <p className="text-sm text-surface-600 dark:text-surface-300 bg-surface-50 dark:bg-surface-700 rounded-xl px-3 py-2">{c.content}</p>
              </div>
            </div>
          ))
        )}
      </div>
      <form onSubmit={postComment} className="flex gap-2">
        <img src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'U')}&background=6366f1&color=fff`} alt={user?.name} className="w-7 h-7 rounded-full flex-shrink-0 object-cover" />
        <input className="input flex-1 text-sm" value={content} onChange={e => setContent(e.target.value)} placeholder="Write a comment..." />
        <button type="submit" disabled={posting || !content.trim()} className="btn-primary px-3 py-2 text-xs">Post</button>
      </form>
    </div>
  );
};

const ProjectDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { joinProject, leaveProject, onProjectEvent, offProjectEvent } = useSocket();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [activeTask, setActiveTask] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pRes, tRes, uRes] = await Promise.all([api.get(`/projects/${id}`), api.get(`/tasks?project=${id}`), api.get('/users')]);
        setProject(pRes.data);
        setTasks(tRes.data);
        setUsers(uRes.data);
      } catch { toast.error('Failed to load project'); }
      finally { setLoading(false); }
    };
    fetchData();
    joinProject(id);

    const handleTaskCreated = (task) => setTasks(prev => [task, ...prev]);
    const handleTaskUpdated = (task) => setTasks(prev => prev.map(t => t._id === task._id ? task : t));
    const handleTaskDeleted = ({ taskId }) => setTasks(prev => prev.filter(t => t._id !== taskId));

    onProjectEvent('task_created', handleTaskCreated);
    onProjectEvent('task_updated', handleTaskUpdated);
    onProjectEvent('task_deleted', handleTaskDeleted);

    return () => {
      leaveProject(id);
      offProjectEvent('task_created', handleTaskCreated);
      offProjectEvent('task_updated', handleTaskUpdated);
      offProjectEvent('task_deleted', handleTaskDeleted);
    };
  }, [id]);

  const handleCreate = async (form) => {
    try {
      const { data } = await api.post('/tasks', { ...form, project: id });
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

  const handleDelete = async (taskId) => {
    if (!confirm('Delete this task?')) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      setTasks(prev => prev.filter(t => t._id !== taskId));
      toast.success('Task deleted');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to delete task'); }
  };

  const handleFileUpload = async (taskId, e) => {
    const file = e.target.files[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    try {
      const { data: fileData } = await api.post('/files/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      const task = tasks.find(t => t._id === taskId);
      const currentAttachments = task.attachments?.map(a => a._id || a) || [];
      await api.put(`/tasks/${taskId}`, { attachments: [...currentAttachments, fileData._id] });
      const { data } = await api.get(`/tasks?project=${id}`);
      setTasks(data);
      toast.success('File attached!');
    } catch { toast.error('File upload failed'); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" /></div>;
  if (!project) return <div className="text-center py-16 text-surface-400">Project not found</div>;

  const canManage = user?.role === 'admin' || project.owner?._id === user?._id;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/projects" className="p-2 rounded-xl hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-500 transition-colors"><ArrowLeft size={18} /></Link>
        <div className="flex-1">
          <h1 className="page-title">{project.title}</h1>
          <p className="text-surface-500 text-sm mt-0.5">{project.description}</p>
        </div>
        {canManage && <button onClick={() => setShowCreate(true)} className="btn-primary"><Plus size={16} /> Add Task</button>}
      </div>

      {/* Project Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Tasks', value: project.totalTasks, icon: CheckSquare, color: 'text-brand-600' },
          { label: 'Completed', value: project.completedTasks, icon: CheckSquare, color: 'text-emerald-600' },
          { label: 'Progress', value: `${project.progress}%`, icon: TrendingUp, color: 'text-amber-600' },
          { label: 'Members', value: project.members?.length, icon: Users, color: 'text-violet-600' },
        ].map(s => (
          <div key={s.label} className="card p-4 flex items-center gap-3">
            <s.icon size={20} className={s.color} />
            <div>
              <p className="text-xs text-surface-500">{s.label}</p>
              <p className="text-xl font-bold text-surface-900 dark:text-surface-100">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="card p-4">
        <div className="flex justify-between text-sm text-surface-600 dark:text-surface-400 mb-2">
          <span className="font-medium">Overall Progress</span>
          <span>{project.completedTasks}/{project.totalTasks} tasks completed</span>
        </div>
        <div className="h-3 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-brand-500 to-emerald-500 rounded-full transition-all duration-700" style={{ width: `${project.progress}%` }} />
        </div>
      </div>

      {/* Tasks */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title">Tasks ({tasks.length})</h2>
        </div>
        {tasks.length === 0 ? (
          <div className="text-center py-10 text-surface-400">
            <CheckSquare size={40} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">No tasks yet. {canManage ? 'Add your first task!' : ''}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {tasks.map(t => (
              <div key={t._id} className={`flex items-center gap-3 p-3 rounded-xl border transition-colors hover:bg-surface-50 dark:hover:bg-surface-700/50 group ${isPast(new Date(t.dueDate)) && t.status !== 'Completed' ? 'border-red-200 dark:border-red-800/50' : 'border-surface-200 dark:border-surface-700'}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className={`text-sm font-medium ${t.status === 'Completed' ? 'line-through text-surface-400' : 'text-surface-900 dark:text-surface-100'}`}>{t.title}</p>
                    <span className={`badge ${priorityColor[t.priority]}`}>{t.priority}</span>
                    <span className={`badge ${statusColor[t.status]}`}>{t.status}</span>
                    {isPast(new Date(t.dueDate)) && t.status !== 'Completed' && <span className="badge bg-red-100 text-red-600">Overdue</span>}
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-surface-400 flex items-center gap-1"><Calendar size={10} />{format(new Date(t.dueDate), 'MMM d')}</span>
                    {t.assignedTo && <span className="text-xs text-surface-400 flex items-center gap-1"><Users size={10} />{t.assignedTo.name}</span>}
                    {t.attachments?.length > 0 && <span className="text-xs text-surface-400 flex items-center gap-1"><Paperclip size={10} />{t.attachments.length}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => setActiveTask(t)} className="p-1.5 rounded-lg hover:bg-brand-50 dark:hover:bg-brand-900/20 text-surface-400 hover:text-brand-600 transition-colors" title="Comments"><MessageSquare size={14} /></button>
                  <label className="p-1.5 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-400 hover:text-surface-600 cursor-pointer transition-colors" title="Attach file">
                    <Paperclip size={14} />
                    <input type="file" className="hidden" onChange={e => handleFileUpload(t._id, e)} />
                  </label>
                  {canManage && <>
                    <button onClick={() => setEditTask({ ...t, assignedTo: t.assignedTo?._id || '' })} className="p-1.5 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-400 hover:text-brand-600 transition-colors"><Pencil size={14} /></button>
                    <button onClick={() => handleDelete(t._id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-surface-400 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                  </>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="New Task" size="lg">
        <TaskForm onSave={handleCreate} onClose={() => setShowCreate(false)} users={project.members || []} />
      </Modal>
      <Modal isOpen={!!editTask} onClose={() => setEditTask(null)} title="Edit Task" size="lg">
        {editTask && <TaskForm initial={editTask} onSave={handleUpdate} onClose={() => setEditTask(null)} users={project.members || []} />}
      </Modal>
      <Modal isOpen={!!activeTask} onClose={() => setActiveTask(null)} title={`Comments: ${activeTask?.title}`} size="lg">
        {activeTask && <CommentSection taskId={activeTask._id} />}
      </Modal>
    </div>
  );
};

export default ProjectDetails;
