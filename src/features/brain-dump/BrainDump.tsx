import React, { useState, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, addTask, moveTaskHorizon, deleteTask } from '../../lib/db';
import { Horizon, Task } from '../../lib/types';
import { Send, Circle, Calendar, Clock, ArrowUpCircle, ArrowRight, Edit2, Bell, Trash2, Layers } from 'lucide-react';
import { useAppStore } from '../../lib/store';
import { TaskDetailSheet } from '../../components/TaskDetailSheet';

const HorizonTabs = ({ active, onChange }: { active: Horizon, onChange: (h: Horizon) => void }) => {
  const tabs: { id: Horizon; label: string; icon: React.ReactNode }[] = [
    { id: 'today', label: 'Hoy', icon: <Circle size={14} className="text-green-500 fill-green-500" /> },
    { id: 'week', label: 'Semana', icon: <Calendar size={14} className="text-blue-500" /> },
    { id: 'later', label: 'Futuro', icon: <Clock size={14} className="text-purple-500" /> },
  ];

  return (
    <div className="flex p-1 mx-4 mt-2 bg-gray-100 dark:bg-slate-800 rounded-lg transition-colors">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${
            active === tab.id
              ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300'
          }`}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  );
};

export const BrainDump = () => {
  const { setTab } = useAppStore();
  const [activeHorizon, setActiveHorizon] = useState<Horizon>('today');
  const [inputValue, setInputValue] = useState('');
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  
  // Real-time query to DB
  const tasks = useLiveQuery(
    () => db.tasks
      .where('horizon')
      .equals(activeHorizon)
      .and(task => task.status !== 'done') // Hide completed tasks
      .reverse()
      .sortBy('createdAt'),
    [activeHorizon]
  );

  // Count distinct lines for the button label
  const pendingLines = inputValue.split('\n').filter(line => line.trim().length > 0).length;

  const handleBulkCapture = async () => {
    if (!inputValue.trim()) return;

    // Split by new line and filter empty lines
    const lines = inputValue.split('\n').filter(line => line.trim().length > 0);
    
    // Create all tasks in parallel
    await Promise.all(lines.map(line => addTask(line.trim(), activeHorizon)));
    
    setInputValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Optional: Ctrl+Enter or Cmd+Enter to submit
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        handleBulkCapture();
    }
  };

  const handlePromoteToToday = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    await moveTaskHorizon(id, 'today');
  };

  const handleQuickDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (confirm('¿Eliminar esta idea?')) {
      await deleteTask(id);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background dark:bg-slate-900 relative transition-colors duration-300">
      <header className="px-6 pt-12 pb-4 bg-white dark:bg-slate-800 border-b border-gray-100 dark:border-slate-700">
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">Vaciado</h1>
        <p className="text-sm text-gray-500 dark:text-slate-400">Libera tu mente. Una línea por idea.</p>
      </header>

      <HorizonTabs active={activeHorizon} onChange={setActiveHorizon} />

      {/* Task List */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 no-scrollbar pb-48">
        {!tasks || tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400 dark:text-slate-600 opacity-60">
            <span className="text-4xl mb-2">🍃</span>
            <p>Todo limpio por aquí.</p>
          </div>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              onClick={() => setEditingTask(task)}
              className="p-4 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 animate-in fade-in slide-in-from-bottom-2 duration-300 group cursor-pointer active:scale-[0.99] transition-all"
            >
              <div className="flex justify-between items-start gap-3">
                <p className="text-gray-800 dark:text-gray-200 flex-1 leading-relaxed pointer-events-none">{task.content}</p>
                {/* Delete Button - Visible on hover/touch */}
                <button 
                  onClick={(e) => task.id && handleQuickDelete(e, task.id)}
                  className="p-2 -mr-2 text-gray-300 dark:text-slate-600 hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-50 dark:border-slate-700 pointer-events-none">
                <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400 dark:text-slate-500">
                    {new Date(task.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {task.reminderTime && (
                        <span className="flex items-center gap-1 text-[10px] bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300 px-2 py-0.5 rounded-full font-medium">
                            <Bell size={10} /> {task.reminderTime}
                        </span>
                    )}
                </div>
                
                {/* Actions Logic */}
                <div className="flex gap-2 pointer-events-auto">
                  {/* Status Indicator for Today items */}
                  {activeHorizon === 'today' && task.status === 'pending' && (
                    <span className="text-[10px] px-2 py-1 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full font-medium flex items-center gap-1">
                      En Pendientes
                    </span>
                  )}
                  {activeHorizon === 'today' && task.status === 'in_progress' && (
                    <button onClick={(e) => { e.stopPropagation(); setTab('board'); }} className="text-[10px] px-2 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full font-medium flex items-center gap-1">
                      En Curso <ArrowRight size={10} />
                    </button>
                  )}

                  {/* Promotion Button for Week/Later items */}
                  {activeHorizon !== 'today' && (
                    <button 
                      onClick={(e) => task.id && handlePromoteToToday(e, task.id)}
                      className="text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                    >
                      <ArrowUpCircle size={14} />
                      Hacer Hoy
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Bulk Input Area - Sticky Bottom above nav */}
      <div className="absolute bottom-4 left-0 right-0 px-4">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-3xl shadow-xl border border-gray-100 dark:border-slate-700 flex flex-col gap-3">
          
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Escribe tus ideas aquí...\nUna idea por línea.\nSin detenerte.`}
            className="w-full bg-transparent outline-none text-gray-800 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 resize-none leading-relaxed text-base"
            rows={3}
            autoFocus
          />
          
          <div className="flex justify-between items-center border-t border-gray-50 dark:border-slate-700 pt-3">
             <span className="text-xs text-gray-400 dark:text-slate-500 font-medium ml-1">
                {activeHorizon === 'today' ? 'Para Hoy' : activeHorizon === 'week' ? 'Para esta Semana' : 'Para el Futuro'}
             </span>
             <button
                onClick={handleBulkCapture}
                disabled={!inputValue.trim()}
                className={`px-5 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2 transition-all ${
                inputValue.trim() 
                    ? 'bg-blue-600 text-white shadow-md hover:bg-blue-700' 
                    : 'bg-gray-100 dark:bg-slate-700 text-gray-300 dark:text-slate-500'
                }`}
            >
                {pendingLines > 1 ? `Capturar ${pendingLines} ideas` : 'Guardar idea'}
                <Send size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Edit Sheet */}
      {editingTask && (
        <TaskDetailSheet 
          task={editingTask} 
          onClose={() => setEditingTask(null)} 
        />
      )}
    </div>
  );
};