import { useEffect, useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isPast, isToday, addMonths, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalIcon, AlertTriangle } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const priorityDot = { High: 'bg-red-500', Medium: 'bg-yellow-500', Low: 'bg-green-500' };

const CalendarPage = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [tasks, setTasks] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/tasks').then(r => setTasks(r.data)).catch(() => toast.error('Failed to load tasks')).finally(() => setLoading(false));
  }, []);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Pad the start day to align to Monday
  const startPad = (monthStart.getDay() + 6) % 7; // Mon=0
  const paddedDays = [...Array(startPad).fill(null), ...days];

  const getTasksForDay = (day) => day ? tasks.filter(t => isSameDay(new Date(t.dueDate), day)) : [];

  const selectedDayTasks = selectedDay ? getTasksForDay(selectedDay) : [];

  const upcoming = tasks
    .filter(t => t.status !== 'Completed' && !isPast(new Date(t.dueDate)))
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .slice(0, 10);

  const overdue = tasks.filter(t => t.status !== 'Completed' && isPast(new Date(t.dueDate)));

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <h1 className="page-title flex items-center gap-2"><CalIcon size={24} /> Calendar</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Grid */}
        <div className="lg:col-span-2 card p-6">
          {/* Month nav */}
          <div className="flex items-center justify-between mb-6">
            <button onClick={() => setCurrentMonth(m => subMonths(m, 1))} className="p-2 rounded-xl hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"><ChevronLeft size={18} /></button>
            <h2 className="text-lg font-bold text-surface-900 dark:text-surface-100">{format(currentMonth, 'MMMM yyyy')}</h2>
            <button onClick={() => setCurrentMonth(m => addMonths(m, 1))} className="p-2 rounded-xl hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"><ChevronRight size={18} /></button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-2">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
              <div key={d} className="text-center text-xs font-semibold text-surface-400 uppercase py-1">{d}</div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 gap-1">
            {paddedDays.map((day, idx) => {
              if (!day) return <div key={`pad-${idx}`} />;
              const dayTasks = getTasksForDay(day);
              const hasOverdue = dayTasks.some(t => t.status !== 'Completed');
              const isSelected = selectedDay && isSameDay(day, selectedDay);
              const today = isToday(day);

              return (
                <button key={day.toISOString()} onClick={() => setSelectedDay(isSelected ? null : day)}
                  className={`p-1.5 rounded-xl text-center min-h-14 transition-all hover:bg-surface-50 dark:hover:bg-surface-700 relative ${isSelected ? 'bg-brand-50 dark:bg-brand-900/30 ring-2 ring-brand-500' : today ? 'bg-brand-600 text-white' : ''}`}>
                  <span className={`text-sm font-medium ${today ? 'text-white' : 'text-surface-700 dark:text-surface-200'}`}>{format(day, 'd')}</span>
                  {dayTasks.length > 0 && (
                    <div className="flex flex-wrap justify-center gap-0.5 mt-1">
                      {dayTasks.slice(0, 3).map(t => (
                        <div key={t._id} className={`w-1.5 h-1.5 rounded-full ${priorityDot[t.priority]}`} />
                      ))}
                      {dayTasks.length > 3 && <span className="text-[8px] text-surface-400">+{dayTasks.length - 3}</span>}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Selected day tasks */}
          {selectedDay && (
            <div className="mt-4 pt-4 border-t border-surface-200 dark:border-surface-700">
              <h3 className="font-semibold text-surface-900 dark:text-surface-100 mb-3">{format(selectedDay, 'EEEE, MMMM d')}</h3>
              {selectedDayTasks.length === 0 ? (
                <p className="text-sm text-surface-400">No tasks due on this day</p>
              ) : (
                <div className="space-y-2">
                  {selectedDayTasks.map(t => (
                    <div key={t._id} className="flex items-center gap-3 p-2.5 rounded-xl bg-surface-50 dark:bg-surface-700">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${priorityDot[t.priority]}`} />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${t.status === 'Completed' ? 'line-through text-surface-400' : 'text-surface-900 dark:text-surface-100'}`}>{t.title}</p>
                        <p className="text-xs text-surface-400">{t.project?.title}</p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${t.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400'}`}>{t.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar: Upcoming & Overdue */}
        <div className="space-y-4">
          {/* Overdue */}
          {overdue.length > 0 && (
            <div className="card p-5 border-red-200 dark:border-red-800/50">
              <h3 className="font-semibold text-red-600 dark:text-red-400 flex items-center gap-2 mb-3"><AlertTriangle size={16} /> Overdue ({overdue.length})</h3>
              <div className="space-y-2">
                {overdue.slice(0, 5).map(t => (
                  <div key={t._id} className="flex items-start gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5 ${priorityDot[t.priority]}`} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-surface-900 dark:text-surface-100 truncate">{t.title}</p>
                      <p className="text-xs text-red-500">{format(new Date(t.dueDate), 'MMM d, yyyy')}</p>
                    </div>
                  </div>
                ))}
                {overdue.length > 5 && <p className="text-xs text-surface-400">+{overdue.length - 5} more overdue tasks</p>}
              </div>
            </div>
          )}

          {/* Upcoming */}
          <div className="card p-5">
            <h3 className="font-semibold text-surface-900 dark:text-surface-100 mb-3">Upcoming Deadlines</h3>
            {upcoming.length === 0 ? (
              <p className="text-sm text-surface-400">No upcoming deadlines. Great job!</p>
            ) : (
              <div className="space-y-3">
                {upcoming.map(t => (
                  <div key={t._id} className="flex items-start gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5 ${priorityDot[t.priority]}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-surface-900 dark:text-surface-100 truncate">{t.title}</p>
                      <p className="text-xs text-surface-400">{t.project?.title}</p>
                    </div>
                    <span className="text-xs text-surface-500 flex-shrink-0">{format(new Date(t.dueDate), 'MMM d')}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarPage;
