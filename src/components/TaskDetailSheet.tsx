import React, { useState, useEffect } from 'react';
import { Task, Horizon, TaskWeight, Subtask } from '../lib/types';
import { updateTaskFull, moveTaskHorizon, deleteTask } from '../lib/db';
import { X, Trash2, Calendar, Clock, Circle, Save, Feather, Scale, Anchor, Bell, Plus, CheckSquare, Square, Zap } from 'lucide-react';

interface Props {
  task: Task | null;
  onClose: () => void;
}

export const TaskDetailSheet = ({ task, onClose }: Props) => {
  const [content, setContent] = useState('');
  const [horizon, setHorizon] = useState<Horizon>('today');
  const [weight, setWeight] = useState<TaskWeight | undefined>(undefined);
  const [reminder, setReminder] = useState('');
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [newSubtaskText, setNewSubtaskText] = useState('');
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (task) {
      setContent(task.content);
      setHorizon(task.horizon);
      setWeight(task.weight || 'medium');
      setReminder(task.reminderTime || '');
      setSubtasks(task.subtasks || []);
    }
  }, [task]);

  if (!task) return null;

  const handleSave = async () => {
    if (task.id && content.trim()) {
      await updateTaskFull(task.id, {
        content: content.trim(),
        weight,
        reminderTime: reminder,
        subtasks,
        horizon: horizon !== task.horizon ? horizon : undefined,
        status: horizon === 'today' && task.horizon !== 'today' ? 'pending' : undefined
      });
      
      handleClose();
    }
  };

  const handleDelete = async () => {
    if (task.id && confirm('¿Eliminar esta tarea definitivamente?')) {
      await deleteTask(task.id);
      handleClose();
    }
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(onClose, 300); // Wait for animation
  };

  // Subtask Handlers
  const addSubtask = () => {
    if (newSubtaskText.trim()) {
      setSubtasks([...subtasks, {
        id: Date.now().toString(),
        content: newSubtaskText.trim(),
        isDone: false
      }]);
      setNewSubtaskText('');
    }
  };

  const toggleSubtask = (id: string) => {
    setSubtasks(subtasks.map(st => 
      st.id === id ? { ...st, isDone: !st.isDone } : st
    ));
  };

  const removeSubtask = (id: string) => {
    setSubtasks(subtasks.filter(st => st.id !== id));
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center">
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity duration-300 ${isClosing ? 'opacity-0' : 'opacity-100'}`}
        onClick={handleClose}
      />

      {/* Sheet */}
      <div 
        className={`relative w-full max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl p-6 transition-transform duration-300 transform ${isClosing ? 'translate-y-full sm:scale-95 sm:opacity-0' : 'translate-y-0 sm:scale-100'} animate-in slide-in-from-bottom-10 max-h-[90vh] overflow-y-auto border border-gray-100 dark:border-slate-800`}
      >
        <div className="w-12 h-1.5 bg-gray-200 dark:bg-slate-700 rounded-full mx-auto mb-6 sm:hidden" />

        <header className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Detalles</h3>
          <button onClick={handleClose} className="p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full">
            <X size={20} />
          </button>
        </header>

        <div className="space-y-6">
          {/* Content Edit */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-2">
              Tarea / Idea
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full p-4 bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 outline-none resize-none text-gray-800 dark:text-white leading-relaxed"
              rows={3}
              autoFocus
            />
          </div>

          {/* Subtasks Section */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-2">
              Subtareas (Paso a paso)
            </label>
            <div className="space-y-2 mb-3">
              {subtasks.map(st => (
                <div key={st.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-lg group">
                  <button 
                    onClick={() => toggleSubtask(st.id)}
                    className={`text-gray-400 hover:text-blue-500 ${st.isDone ? 'text-green-500' : ''}`}
                  >
                    {st.isDone ? <CheckSquare size={18} /> : <Square size={18} />}
                  </button>
                  <span className={`flex-1 text-sm text-gray-700 dark:text-slate-300 ${st.isDone ? 'line-through opacity-50' : ''}`}>
                    {st.content}
                  </span>
                  <button onClick={() => removeSubtask(st.id)} className="text-gray-300 hover:text-red-400 opacity-0 group-hover:opacity-100">
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={newSubtaskText}
                onChange={(e) => setNewSubtaskText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addSubtask()}
                placeholder="Añadir paso..."
                className="flex-1 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-lg px-3 py-2 text-sm outline-none dark:text-white"
              />
              <button 
                onClick={addSubtask}
                disabled={!newSubtaskText.trim()}
                className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 disabled:opacity-50"
              >
                <Plus size={18} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             {/* Weight Selection */}
             <div>
                <label className="block text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                  Peso Mental <Zap size={10} className="text-yellow-500"/>
                </label>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setWeight('light')} 
                    className={`p-2 rounded-lg border flex-1 flex justify-center ${weight === 'light' ? 'bg-teal-50 dark:bg-teal-900/30 border-teal-200 dark:border-teal-800 text-teal-600 dark:text-teal-400' : 'bg-white dark:bg-slate-800 border-gray-100 dark:border-slate-700 text-gray-400'}`} 
                    title="Ligera (Pluma)"
                  >
                    <Feather size={18}/>
                  </button>
                  <button 
                    onClick={() => setWeight('medium')} 
                    className={`p-2 rounded-lg border flex-1 flex justify-center ${weight === 'medium' ? 'bg-orange-50 dark:bg-orange-900/30 border-orange-200 dark:border-orange-800 text-orange-600 dark:text-orange-400' : 'bg-white dark:bg-slate-800 border-gray-100 dark:border-slate-700 text-gray-400'}`} 
                    title="Normal"
                  >
                    <Scale size={18}/>
                  </button>
                  <button 
                    onClick={() => setWeight('heavy')} 
                    className={`p-2 rounded-lg border flex-1 flex justify-center ${weight === 'heavy' ? 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400' : 'bg-white dark:bg-slate-800 border-gray-100 dark:border-slate-700 text-gray-400'}`} 
                    title="Pesada (Ancla)"
                  >
                    <Anchor size={18}/>
                  </button>
                </div>
                <p className="text-[10px] text-gray-400 dark:text-slate-600 mt-1 leading-tight">
                    Ayuda a sugerirte tareas según tu energía diaria.
                </p>
             </div>

             {/* Reminder (Optional) */}
             <div>
                <label className="block text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                   Recordatorio
                </label>
                <div className="relative">
                  <input 
                    type="time" 
                    value={reminder}
                    onChange={(e) => setReminder(e.target.value)}
                    className="w-full p-2 pl-9 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-blue-200 dark:focus:border-blue-800 dark:text-white"
                  />
                  <Bell size={14} className="absolute left-3 top-3 text-gray-400 dark:text-slate-500" />
                </div>
             </div>
          </div>

          {/* Horizon Move */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-2">
              Mover a
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setHorizon('today')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                  horizon === 'today' ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 shadow-sm' : 'bg-white dark:bg-slate-800 border-gray-100 dark:border-slate-700 text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700'
                }`}
              >
                <Circle size={18} className="mb-1" />
                <span className="text-xs font-medium">Hoy</span>
              </button>
              
              <button
                onClick={() => setHorizon('week')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                  horizon === 'week' ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 shadow-sm' : 'bg-white dark:bg-slate-800 border-gray-100 dark:border-slate-700 text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700'
                }`}
              >
                <Calendar size={18} className="mb-1" />
                <span className="text-xs font-medium">Semana</span>
              </button>

              <button
                onClick={() => setHorizon('later')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                  horizon === 'later' ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 shadow-sm' : 'bg-white dark:bg-slate-800 border-gray-100 dark:border-slate-700 text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700'
                }`}
              >
                <Clock size={18} className="mb-1" />
                <span className="text-xs font-medium">Futuro</span>
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4 border-t border-gray-50 dark:border-slate-800">
            <button 
              onClick={handleDelete}
              className="p-4 rounded-xl text-red-500 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
            >
              <Trash2 size={20} />
            </button>
            <button 
              onClick={handleSave}
              className="flex-1 bg-blue-600 text-white p-4 rounded-xl font-medium shadow-lg shadow-blue-200 dark:shadow-none hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <Save size={18} />
              Guardar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};