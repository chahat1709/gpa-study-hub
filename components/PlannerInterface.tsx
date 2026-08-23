import React, { useState, useEffect } from 'react';
import { Task } from '../types';
import {
  CalendarDays,
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  Clock,
  AlertTriangle,
  Check,
  Calendar,
} from 'lucide-react';
import { useToast } from './ToastProvider';
import { useAuth } from './AuthContext';
import { db, isConfigValid } from '../firebase';
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';

const PlannerInterface: React.FC = () => {
  const { error, success } = useToast();
  const { user } = useAuth();

  // Initialize tasks state (was missing!)
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('GPA_HUB_TASKS');
    return saved ? JSON.parse(saved) : [];
  });

  const [newTaskTitle, setNewTaskTitle] = useState('');

  // Persist tasks whenever they change
  useEffect(() => {
    localStorage.setItem('GPA_HUB_TASKS', JSON.stringify(tasks));
  }, [tasks]);

  // Listen for Agent actions
  useEffect(() => {
    const handleAgentUpdate = (e: any) => {
      const { title, priority, dueDate } = e.detail;
      const newTask: Task = {
        id: Date.now().toString(),
        title: title || 'New Task',
        dueDate: dueDate || new Date().toISOString().split('T')[0],
        priority: (priority as any) || 'medium',
        completed: false,
      };
      // Use functional update to ensure we have latest state if needed, though this event listener closure might be stale without dep array.
      // Ideally we'd move this definition inside or use a ref, but standard React state update works for ensuring re-render.
      // Better to use setTasks(prev => ...) which we are doing below.
      setTasks(prev => {
        const updated = [newTask, ...prev];
        localStorage.setItem('GPA_HUB_TASKS', JSON.stringify(updated)); // redundant but safe
        return updated;
      });
      success(`Added: ${newTask.title} `);
    };

    window.addEventListener('PLANNER_UPDATE', handleAgentUpdate);
    return () => window.removeEventListener('PLANNER_UPDATE', handleAgentUpdate);
  }, []);

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const newTask: Task = {
      id: Date.now().toString(),
      title: newTaskTitle,
      dueDate: new Date().toISOString().split('T')[0] || '',
      priority: 'medium',
      completed: false,
    };

    setTasks([newTask, ...tasks]);
    setNewTaskTitle('');
  };

  const toggleTask = (id: string) => {
    setTasks(tasks.map(t => (t.id === id ? { ...t, completed: !t.completed } : t)));
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  return (
    <div className="h-full flex flex-col bg-transparent text-white relative">
      <div className="max-w-3xl mx-auto w-full p-6 space-y-8 z-10">
        {/* Header & Input */}
        <div className="space-y-4">
          <h1 className="text-2xl font-bold font-display text-white tracking-tight">My Planner</h1>

          <form onSubmit={handleAddTask} className="relative group">
            <div className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-stitch-cyan transition-colors">
              <Plus className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={newTaskTitle}
              onChange={e => setNewTaskTitle(e.target.value)}
              placeholder="Add a new task..."
              className="w-full pl-12 pr-4 py-3 bg-[rgba(15,23,42,0.6)] backdrop-blur-[30px] border border-white/10 rounded-[16px] shadow-[0_0_15px_rgba(47,217,244,0.05)] text-sm outline-none focus:ring-2 focus:ring-stitch-cyan/30 focus:border-stitch-cyan transition-all font-medium text-white placeholder:text-slate-400"
            />
          </form>
        </div>

        {/* Task List */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 pl-1">
            Tasks
          </h3>
          {tasks.length === 0 && (
            <div className="text-center py-10 text-slate-400">
              <CalendarDays className="w-10 h-10 mx-auto mb-3 opacity-40 text-stitch-cyan" />
              <p className="text-sm">No tasks yet. Enjoy your day!</p>
            </div>
          )}

          {tasks.map(task => (
            <div
              key={task.id}
              className={`group flex items-center gap-4 p-4 rounded-[16px] transition-all border ${
                task.completed
                  ? 'border-white/5 opacity-60 bg-white/5'
                  : 'glass-card bg-white/5 border-white/10 hover:border-stitch-cyan/40 shadow-[0_0_15px_rgba(47,217,244,0.05)] hover:shadow-[0_0_15px_rgba(47,217,244,0.15)] text-white'
              }`}
            >
              <button
                onClick={() => toggleTask(task.id)}
                className={`min-h-[44px] min-w-[44px] p-2 rounded-full border flex items-center justify-center transition-all ${
                  task.completed
                    ? 'bg-stitch-cyan border-stitch-cyan text-slate-950 shadow-[0_0_15px_rgba(47,217,244,0.3)]'
                    : 'bg-white/5 border-white/20 hover:border-stitch-cyan text-transparent hover:shadow-[0_0_10px_rgba(47,217,244,0.3)]'
                }`}
              >
                {task.completed ? (
                  <Check className="w-4 h-4 font-bold" />
                ) : (
                  <div className="w-3.5 h-3.5 rounded-full" />
                )}
              </button>

              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-bold font-display truncate ${task.completed ? 'text-slate-400 line-through font-medium' : 'text-white'}`}
                >
                  {task.title}
                </p>
                {!task.completed && (
                  <div className="flex items-center gap-3 mt-1">
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase border ${
                        task.priority === 'high'
                          ? 'text-rose-400 bg-rose-500/20 border-rose-500/30'
                          : 'text-stitch-cyan bg-stitch-cyan/10 border-stitch-cyan/30'
                      }`}
                    >
                      {task.priority}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-slate-400">
                      <Calendar className="w-3 h-3 text-stitch-cyan/50" /> {task.dueDate}
                    </span>
                  </div>
                )}
              </div>

              <button
                onClick={() => deleteTask(task.id)}
                className="p-3 min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors opacity-100 lg:opacity-0 lg:group-hover:opacity-100"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PlannerInterface;
