import { useEffect, useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Trello, GripVertical, Circle, Clock, ArrowRight, FolderKanban } from 'lucide-react';
import { motion } from 'framer-motion';
import { format, isPast } from 'date-fns';
import api from '../utils/api';
import toast from 'react-hot-toast';

const COLUMNS = ['To Do', 'In Progress', 'Review', 'Completed'];
const COLUMN_COLORS = {
  'To Do': 'from-surface-100 to-surface-200 dark:from-surface-800 dark:to-surface-700',
  'In Progress': 'from-brand-50 to-brand-100 dark:from-brand-900/20 dark:to-brand-800/20',
  'Review': 'from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20',
  'Completed': 'from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20',
};
const COLUMN_HEADER_COLOR = {
  'To Do': 'bg-surface-400 dark:bg-surface-500',
  'In Progress': 'bg-brand-500',
  'Review': 'bg-yellow-500',
  'Completed': 'bg-green-500',
};
const priorityColor = { High: 'text-red-500', Medium: 'text-yellow-500', Low: 'text-green-500' };
const priorityDot = { High: 'bg-red-500', Medium: 'bg-yellow-500', Low: 'bg-green-500' };

const KanbanCard = ({ task, index }) => {
  const isOverdue = isPast(new Date(task.dueDate)) && task.status !== 'Completed';

  return (
    <Draggable draggableId={task._id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`bg-white dark:bg-surface-800 rounded-xl border p-3 shadow-card hover:shadow-card-hover transition-all ${snapshot.isDragging ? 'shadow-xl rotate-1 scale-105 border-brand-300 dark:border-brand-600' : isOverdue ? 'border-red-200 dark:border-red-800/50' : 'border-surface-200 dark:border-surface-700'}`}
        >
          <div className="flex items-start justify-between gap-2 mb-2">
            <p className={`text-sm font-medium leading-tight flex-1 ${task.status === 'Completed' ? 'line-through text-surface-400' : 'text-surface-900 dark:text-surface-100'}`}>{task.title}</p>
            <div {...provided.dragHandleProps} className="flex-shrink-0 text-surface-300 hover:text-surface-500 cursor-grab active:cursor-grabbing mt-0.5">
              <GripVertical size={14} />
            </div>
          </div>
          {task.description && <p className="text-xs text-surface-400 line-clamp-2 mb-2">{task.description}</p>}
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-1.5">
              <div className={`w-1.5 h-1.5 rounded-full ${priorityDot[task.priority]}`} />
              <span className={`text-xs font-medium ${priorityColor[task.priority]}`}>{task.priority}</span>
            </div>
            {isOverdue && <span className="text-xs text-red-500 font-medium">Overdue</span>}
            {!isOverdue && <span className="text-xs text-surface-400 flex items-center gap-1"><Clock size={10} />{format(new Date(task.dueDate), 'MMM d')}</span>}
          </div>
          {task.assignedTo && (
            <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-surface-100 dark:border-surface-700">
              <img src={task.assignedTo.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(task.assignedTo.name)}&background=6366f1&color=fff&size=32`} alt={task.assignedTo.name} className="w-5 h-5 rounded-full object-cover" />
              <span className="text-xs text-surface-500 truncate">{task.assignedTo.name}</span>
            </div>
          )}
          {task.project && <p className="text-[10px] text-surface-400 mt-1.5 flex items-center gap-1"><FolderKanban size={9} />{task.project.title}</p>}
        </div>
      )}
    </Draggable>
  );
};

const KanbanBoard = () => {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tRes, pRes] = await Promise.all([api.get('/tasks'), api.get('/projects')]);
        setTasks(tRes.data);
        setProjects(pRes.data);
      } catch { toast.error('Failed to load Kanban data'); }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  const filteredTasks = selectedProject === 'All' ? tasks : tasks.filter(t => t.project?._id === selectedProject || t.project === selectedProject);

  const getColumnTasks = (status) => filteredTasks.filter(t => t.status === status);

  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    if (!destination || (destination.droppableId === source.droppableId && destination.index === source.index)) return;

    const newStatus = destination.droppableId;
    const oldStatus = source.droppableId;
    if (newStatus === oldStatus) return;

    // Optimistic update
    setTasks(prev => prev.map(t => t._id === draggableId ? { ...t, status: newStatus } : t));

    try {
      await api.put(`/tasks/${draggableId}`, { status: newStatus });
      toast.success(`Moved to "${newStatus}"`, { duration: 2000 });
    } catch (err) {
      // Rollback on error
      setTasks(prev => prev.map(t => t._id === draggableId ? { ...t, status: oldStatus } : t));
      toast.error('Failed to update task status');
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-4 h-full flex flex-col">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title flex items-center gap-2"><Trello size={24} /> Kanban Board</h1>
          <p className="text-surface-500 mt-1">Drag and drop tasks between columns</p>
        </div>
        <div className="flex items-center gap-2">
          <select className="input h-9 text-sm w-48" value={selectedProject} onChange={e => setSelectedProject(e.target.value)}>
            <option value="All">All Projects</option>
            {projects.map(p => <option key={p._id} value={p._id}>{p.title}</option>)}
          </select>
        </div>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4 flex-1">
          {COLUMNS.map(col => {
            const colTasks = getColumnTasks(col);
            return (
              <div key={col} className="flex-shrink-0 w-72">
                <div className="mb-3 flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${COLUMN_HEADER_COLOR[col]}`} />
                  <h3 className="font-semibold text-surface-900 dark:text-surface-100 text-sm">{col}</h3>
                  <span className="ml-auto bg-surface-200 dark:bg-surface-700 text-surface-600 dark:text-surface-300 text-xs font-medium px-2 py-0.5 rounded-full">{colTasks.length}</span>
                </div>
                <Droppable droppableId={col}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`min-h-32 rounded-2xl p-3 space-y-2.5 transition-colors bg-gradient-to-b ${COLUMN_COLORS[col]} ${snapshot.isDraggingOver ? 'ring-2 ring-brand-400 ring-offset-2 dark:ring-offset-surface-900' : ''}`}
                    >
                      {colTasks.length === 0 && !snapshot.isDraggingOver && (
                        <div className="flex flex-col items-center justify-center py-8 text-surface-300 dark:text-surface-600">
                          <Circle size={28} className="mb-2 opacity-40" />
                          <p className="text-xs">Drop tasks here</p>
                        </div>
                      )}
                      {colTasks.map((task, idx) => <KanbanCard key={task._id} task={task} index={idx} />)}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>
    </div>
  );
};

export default KanbanBoard;
