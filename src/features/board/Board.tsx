import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, updateTaskStatus, addTask, moveTaskHorizon } from '../../lib/db';
import { useAppStore } from '../../lib/store';
import { Task, Horizon, EnergyLevel, TaskWeight } from '../../lib/types';
import { getWipConfig } from '../../lib/wip-logic';
import { isDateInCurrentWeek } from '../../lib/date-utils';
import { Play, CheckCircle, Clock, RotateCcw, Lock, Plus, X, Archive, ArrowDownCircle, Download, Sparkles, Feather, Anchor, Scale, Zap } from 'lucide-react';
import { TaskDetailSheet } from '../../components/TaskDetailSheet';

// Optimization: Component defined outside to prevent re-renders
const ColumnHeader = ({ title, count, colorClass, icon, limitDisplay, action }: { title: string, count: number, colorClass: string, icon: React.ReactNode, limitDisplay?: string, action?: React.ReactNode }) => (
  <div className={`flex items-center justify-between p-4 border-b border-gray-100 dark:border-slate-700 ${colorClass} bg-opacity-20 dark:bg-opacity-10 rounded-t-2xl`}>
    <div className="flex items-center gap-2 font-semibold text-gray-700 dark:text-gray-200">
      {icon}
      <span>{title}</span>
    </div>
    <div className="flex items-center gap-2">
      {action}
      {limitDisplay && (
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${count >= (parseInt(limitDisplay.split('/')[1]) || 99) ? 'bg-red-100 text-red-600' : 'bg-white/60 text-gray-500 dark:bg-slate-700 dark:text-slate-400'}`}>
          WIP {limitDisplay}
        </span>
      )}
      {!limitDisplay && (
         <span className="text-xs font-bold bg-white/60 dark:bg-slate-700 px-2 py-1 rounded-full text-gray-600 dark:text-slate-400">
           {count}
         </span>
      )}
    </div>
  </div>
);

export const Board = () => {
  const { enterFocusMode, setTab } = useAppStore();
  const todayStr = new Date().toISOString().split('T')[0];
  
  // Local state
  const [isAdding, setIsAdding] = useState(false);
  const [quickAddText, setQuickAddText] = useState('');
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  
  // Backlog / Import State
  const [showBacklog, setShowBacklog] = useState(false);

  // Duration Picker State
  const [selectingDurationForTask, setSelectingDurationForTask] = useState<Task | null>(null);
  const [durationMinutes, setDurationMinutes] = useState(25);

  // Queries
  const dailyLog = useLiveQuery(() => db.daily_logs.where('date').equals(todayStr).first(), [todayStr]);
  const tasks = useLiveQuery(
    () => db.tasks.where('horizon').equals('today').reverse().sortBy('updatedAt'),
    []
  );

  // Backlog Query
  const backlogTasks = useLiveQuery(
    () => db.tasks.where('horizon').equals('week').and(t => t.status !== 'done').toArray(),
    []
  );

  // Group tasks
  const pendingTasks = tasks?.filter(t => t.status === 'pending') || [];
  const inProgressTasks = tasks?.filter(t => t.status === 'in_progress') || [];
  
  const doneTasks = tasks?.filter(t => 
    t.status === 'done' && isDateInCurrentWeek(t.updatedAt)
  ) || [];

  // WIP LOGIC
  const wipConfig = dailyLog 
    ? getWipConfig(dailyLog.emotion, dailyLog.energy) 
    : { limit: 1, message: "Calculando..." }; 
  
  const isWipLimitReached = inProgressTasks.length >= wipConfig.limit;
  const isRestMode = wipConfig.limit === 0;

  // SUGGESTION LOGIC
  const getTaskSuitability = (energy: EnergyLevel, weight?: TaskWeight): 'recommended' | 'neutral' | 'heavy-for-now' => {
    if (!weight) return 'neutral';
    
    if (energy === 'low') {
        if (weight === 'light') return 'recommended';
        if (weight === 'heavy') return 'heavy-for-now';
    }
    if (energy === 'medium') {
        if (weight === 'medium') return 'recommended';
    }
    if (energy === 'high') {
        if (weight === 'heavy') return 'recommended';
    }
    return 'neutral';
  };

  const getWeightIcon = (weight?: TaskWeight) => {
    switch(weight) {
        case 'light': return <Feather size={12} className="text-teal-500" />;
        case 'medium': return <Scale size={12} className="text-orange-500" />;
        case 'heavy': return <Anchor size={12} className="text-red-500" />;
        default: return null;
    }
  };

  // HANDLERS
  const handleStartClick = (e: React.MouseEvent, task: Task) => {
    e.stopPropagation();
    if (!dailyLog) {
      alert("Por favor, haz el check-in en Inicio primero.");
      setTab('dashboard');
      return;
    }
    if (isRestMode) {
      alert("Hoy es día de descanso según tu energía. ¡Cuídate!");
      return;
    }
    if (isWipLimitReached) {
      alert(`Has alcanzado tu límite cognitivo de hoy (${wipConfig.limit}). Termina algo antes de empezar otra cosa.`);
      return;
    }
    
    // Warn if starting a heavy task on low energy
    const suitability = getTaskSuitability(dailyLog.energy, task.weight);
    if (suitability === 'heavy-for-now') {
        if (!confirm("Tu energía es baja y esta tarea es pesada. ¿Seguro que quieres empezarla ahora?")) {
            return;
        }
    }

    // Open Duration Picker instead of starting immediately
    setSelectingDurationForTask(task);
  };

  const confirmStartTask = async () => {
    if (selectingDurationForTask && selectingDurationForTask.id) {
      await updateTaskStatus(selectingDurationForTask.id, 'in_progress');
      // Enter focus mode with seconds
      enterFocusMode(selectingDurationForTask.id, durationMinutes * 60);
      setSelectingDurationForTask(null);
    }
  };

  const handleResumeTask = (e: React.MouseEvent, task: Task) => {
    e.stopPropagation();
    if (task.id) {
        setSelectingDurationForTask(task);
    }
  };

  const handleReturnToPending = async (e: React.MouseEvent, task: Task) => {
    e.stopPropagation();
    if (task.id) await updateTaskStatus(task.id, 'pending');
  };

  const handleQuickAdd = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (quickAddText.trim()) {
      // Always add to 'today' horizon when adding from board
      await addTask(quickAddText.trim(), 'today');
      setQuickAddText('');
      // Keep input open for flow, or close if preferred. 
      // Keeping open allows adding multiple tasks quickly.
    }
  };

  const handleImportTask = async (task: Task) => {
    if (task.id) {
        await moveTaskHorizon(task.id, 'today');
    }
  };

  if (!dailyLog) {
    return (
       <div className="h-full flex items-center justify-center p-6 text-center">
         <div className="max-w-xs">
           <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">Check-in requerido</h2>
           <p className="text-gray-500 dark:text-slate-400 mb-4">Para proteger tu atención, necesitamos saber cómo estás hoy.</p>
           <button onClick={() => setTab('dashboard')} className="bg-blue-600 text-white px-6 py-3 rounded-xl font-medium">Ir a Inicio</button>
         </div>
       </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background dark:bg-slate-900 pt-8 pb-24 relative transition-colors duration-300">
      <header className="px-6 mb-4 flex-shrink-0">
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">Tablero</h1>
        <p className="text-sm text-gray-500 dark:text-slate-400">
          {isRestMode ? "Modo: Pausa Técnica ☕" : "Flujo de trabajo consciente."}
        </p>
      </header>

      {/* Horizontal Scroll Container */}
      <div className="flex-1 flex overflow-x-auto gap-4 px-4 pb-4 snap-x snap-mandatory no-scrollbar items-start">
        
        {/* COLUMN 1: PENDING */}
        <div className="flex-shrink-0 flex flex-col w-[85vw] md:w-80 h-full bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm snap-center transition-colors">
          <ColumnHeader 
            title="Pendiente" 
            count={pendingTasks.length} 
            colorClass="bg-gray-100 dark:bg-gray-800"
            icon={<div className="w-2 h-2 rounded-full bg-gray-400" />}
            action={
                <button 
                  onClick={() => setShowBacklog(true)} 
                  className="p-1.5 bg-white dark:bg-slate-700 rounded-lg shadow-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-600"
                  title="Traer tareas del vaciado semanal"
                >
                    <Download size={14} />
                </button>
            }
          />
          
          {/* Quick Add Area */}
          <div className="px-3 pt-3">
            {isAdding ? (
              <form onSubmit={handleQuickAdd} className="bg-gray-50 dark:bg-slate-700 p-3 rounded-xl border border-blue-200 dark:border-blue-700 animate-in fade-in zoom-in-95 duration-200 shadow-lg relative z-10">
                <div className="flex items-center gap-2">
                  <input
                    autoFocus
                    type="text"
                    placeholder="Escribe y pulsa Enter..."
                    className="flex-1 bg-transparent text-sm outline-none text-gray-800 dark:text-white font-medium"
                    value={quickAddText}
                    onChange={(e) => setQuickAddText(e.target.value)}
                    onBlur={() => !quickAddText && !isAdding && setIsAdding(false)}
                  />
                  <button type="submit" className="p-1.5 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded-lg hover:bg-blue-200">
                    <Plus size={16} />
                  </button>
                  <button type="button" onClick={() => setIsAdding(false)} className="p-1.5 text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-lg">
                    <X size={16} />
                  </button>
                </div>
              </form>
            ) : (
              <button 
                onClick={() => setIsAdding(true)}
                className="w-full py-3 border border-dashed border-gray-300 dark:border-slate-600 rounded-xl text-gray-400 dark:text-slate-500 text-sm hover:border-blue-300 hover:text-blue-500 transition-colors flex items-center justify-center gap-1 bg-gray-50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800"
              >
                <Plus size={16} /> Añadir rápida
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {pendingTasks.length === 0 && !isAdding ? (
              <div className="h-32 flex flex-col items-center justify-center text-gray-300 dark:text-slate-600 text-sm italic gap-2">
                <span>Sin tareas para hoy</span>
                <button onClick={() => setShowBacklog(true)} className="text-blue-500 dark:text-blue-400 underline text-xs">
                    Traer del Vaciado
                </button>
              </div>
            ) : (
              pendingTasks.map(task => {
                const suitability = getTaskSuitability(dailyLog.energy, task.weight);
                const isDiscouraged = suitability === 'heavy-for-now';
                const isRecommended = suitability === 'recommended';
                
                return (
                  <div 
                    key={task.id} 
                    onClick={() => setEditingTask(task)}
                    className={`
                      relative p-4 rounded-xl border shadow-sm flex flex-col gap-3 group transition-all cursor-pointer active:scale-[0.98]
                      ${isRecommended 
                        ? 'bg-gradient-to-br from-white to-green-50/50 dark:from-slate-700 dark:to-green-900/10 border-green-200 dark:border-green-800' 
                        : isDiscouraged
                          ? 'bg-gray-50 dark:bg-slate-800/50 border-gray-100 dark:border-slate-700 opacity-70'
                          : 'bg-white dark:bg-slate-700 border-gray-100 dark:border-slate-600'
                      }
                      ${isWipLimitReached || isRestMode ? 'opacity-50 grayscale' : ''}
                    `}
                  >
                    {/* Header: Icons and Badges */}
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                            {task.weight && (
                                <div className={`p-1 rounded-md ${isRecommended ? 'bg-white dark:bg-slate-800 shadow-sm' : 'bg-transparent'}`}>
                                    {getWeightIcon(task.weight)}
                                </div>
                            )}
                            {isRecommended && (
                                <span className="text-[10px] font-bold text-green-600 dark:text-green-400 flex items-center gap-1">
                                    <Sparkles size={10} /> Ideal ahora
                                </span>
                            )}
                        </div>
                    </div>

                    <span className={`text-gray-700 dark:text-gray-200 font-medium pointer-events-none leading-snug ${isDiscouraged ? 'text-gray-500 dark:text-slate-400' : ''}`}>
                        {task.content}
                    </span>
                    
                    {isRestMode ? (
                       <div className="self-end px-3 py-1.5 bg-gray-50 dark:bg-slate-600 text-gray-400 dark:text-slate-400 text-xs font-semibold rounded-lg flex items-center gap-1 pointer-events-none">
                          <Lock size={12} /> Pausa hoy
                       </div>
                    ) : isWipLimitReached ? (
                       <div className="self-end px-3 py-1.5 bg-orange-50 dark:bg-orange-900/20 text-orange-400 dark:text-orange-300 text-xs font-semibold rounded-lg flex items-center gap-1 pointer-events-none" title="Límite WIP alcanzado">
                          <Lock size={12} /> Lleno
                       </div>
                    ) : (
                      <button 
                        onClick={(e) => handleStartClick(e, task)}
                        className={`self-end px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors ${
                            isRecommended 
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200' 
                            : 'bg-gray-50 dark:bg-slate-600 text-gray-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-slate-500 hover:text-blue-600'
                        }`}
                      >
                        <Play size={12} /> Empezar
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* COLUMN 2: IN PROGRESS */}
        <div className={`flex-shrink-0 flex flex-col w-[85vw] md:w-80 h-full bg-blue-50/50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-900 shadow-md snap-center relative overflow-hidden transition-colors ${isRestMode ? 'grayscale opacity-80' : ''}`}>
          {!isRestMode && <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-indigo-500"></div>}
          
          <ColumnHeader 
            title="En Curso" 
            count={inProgressTasks.length} 
            colorClass="bg-blue-100 dark:bg-blue-900"
            icon={<Clock size={16} className="text-blue-600 dark:text-blue-400" />}
            limitDisplay={isRestMode ? '0' : `${inProgressTasks.length}/${wipConfig.limit}`}
          />
          
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {isRestMode && inProgressTasks.length === 0 && (
               <div className="h-full flex flex-col items-center justify-center text-gray-400 dark:text-slate-500 text-center px-6">
                 <p className="mb-2 text-2xl">🧘</p>
                 <p className="text-sm font-medium">Zona bloqueada por descanso.</p>
                 <p className="text-xs mt-1">Tu salud es productiva.</p>
               </div>
            )}

            {!isRestMode && inProgressTasks.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-blue-300 dark:text-blue-800 opacity-60 text-center px-6">
                <Clock size={48} strokeWidth={1} className="mb-2" />
                <p className="text-sm">Nada en foco.</p>
                <p className="text-xs">
                   {isWipLimitReached ? "Libera espacio para traer más." : "Mueve algo desde \"Pendiente\"."}
                </p>
              </div>
            )}
            
            {inProgressTasks.map(task => (
              <div 
                key={task.id} 
                onClick={() => setEditingTask(task)}
                className="bg-white dark:bg-slate-700 p-5 rounded-xl border-l-4 border-blue-500 shadow-md flex flex-col gap-4 cursor-pointer active:scale-[0.98]"
              >
                <div className="flex justify-between items-start">
                     <h3 className="text-lg font-medium text-gray-800 dark:text-white leading-tight pointer-events-none">{task.content}</h3>
                     {task.weight && <div className="opacity-50">{getWeightIcon(task.weight)}</div>}
                </div>
                
                <div className="flex gap-2 pointer-events-auto">
                  {!isRestMode && (
                    <button 
                      onClick={(e) => handleResumeTask(e, task)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-transform"
                    >
                      <Play size={16} fill="currentColor" />
                      Foco
                    </button>
                  )}
                  <button 
                    onClick={(e) => handleReturnToPending(e, task)}
                    className="px-3 py-2 bg-gray-100 dark:bg-slate-600 text-gray-500 dark:text-slate-300 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-500"
                    title="Devolver a pendientes"
                  >
                    <RotateCcw size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* COLUMN 3: DONE */}
        <div className="flex-shrink-0 flex flex-col w-[85vw] md:w-80 h-full bg-gray-50 dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 snap-center opacity-90 transition-colors">
          <ColumnHeader 
            title="Hecho (Semana)" 
            count={doneTasks.length} 
            colorClass="bg-green-100 dark:bg-green-900"
            icon={<CheckCircle size={16} className="text-green-600 dark:text-green-400" />}
          />
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {doneTasks.map(task => (
              <div key={task.id} className="bg-white/60 dark:bg-slate-800/60 p-3 rounded-lg flex items-start gap-3 border border-transparent hover:border-gray-200 dark:hover:border-slate-700 transition-colors">
                <CheckCircle size={16} className="text-green-500 dark:text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-gray-500 dark:text-slate-400 line-through text-sm">{task.content}</span>
              </div>
            ))}
             {doneTasks.length === 0 ? (
               <div className="text-center py-8 px-4">
                 <div className="text-gray-300 dark:text-slate-700 mb-2"><Archive size={24} className="mx-auto"/></div>
                 <p className="text-xs text-gray-400 dark:text-slate-600">Las tareas completadas de semanas anteriores se guardan en tu Jardín.</p>
               </div>
             ) : (
                <div className="text-center py-4">
                  <p className="text-xs text-gray-400 dark:text-slate-600">¡Buen trabajo esta semana!</p>
                </div>
             )}
          </div>
        </div>

        {/* Spacer for horizontal scroll comfort */}
        <div className="w-2 flex-shrink-0"></div>
      </div>

      {/* DETAIL SHEET */}
      {editingTask && (
        <TaskDetailSheet 
          task={editingTask} 
          onClose={() => setEditingTask(null)} 
        />
      )}

      {/* BACKLOG VIEWER (Import from Week) */}
      {showBacklog && (
          <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
             <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowBacklog(false)}></div>
             <div className="relative w-full max-w-md bg-white dark:bg-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl p-6 h-[80vh] flex flex-col animate-in slide-in-from-bottom-10 border border-gray-100 dark:border-slate-700">
                <header className="flex justify-between items-center mb-4 flex-shrink-0">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white">Buzón Semanal</h3>
                    <button onClick={() => setShowBacklog(false)} className="p-2 bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400 rounded-full"><X size={18}/></button>
                </header>
                <p className="text-sm text-gray-500 dark:text-slate-400 mb-4 flex-shrink-0">
                    Estas ideas están esperando. Toca para traerlas a <strong>Hoy</strong>.
                </p>
                
                <div className="flex-1 overflow-y-auto space-y-3 no-scrollbar pb-10">
                    {!backlogTasks || backlogTasks.length === 0 ? (
                        <div className="text-center text-gray-400 dark:text-slate-600 mt-10">
                            <p>No hay tareas pendientes en la Semana.</p>
                            <p className="text-xs mt-2">Usa el Vaciado o Añadir Rápido.</p>
                        </div>
                    ) : (
                        backlogTasks.map(t => (
                            <button 
                                key={t.id} 
                                onClick={() => handleImportTask(t)}
                                className="w-full text-left bg-gray-50 dark:bg-slate-700 p-4 rounded-xl border border-gray-100 dark:border-slate-600 flex justify-between items-center hover:bg-blue-50 dark:hover:bg-slate-600 transition-colors"
                            >
                                <span className="text-gray-800 dark:text-gray-200 font-medium">{t.content}</span>
                                <ArrowDownCircle size={18} className="text-blue-500" />
                            </button>
                        ))
                    )}
                </div>
             </div>
          </div>
      )}

      {/* DURATION PICKER MODAL */}
      {selectingDurationForTask && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSelectingDurationForTask(null)}></div>
            <div className="relative bg-white dark:bg-slate-800 rounded-3xl p-8 w-full max-w-sm shadow-2xl animate-in zoom-in-95 border border-gray-100 dark:border-slate-700">
                <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2 text-center">¿Cuánto tiempo?</h3>
                <p className="text-gray-500 dark:text-slate-400 text-center mb-8 text-sm">Define un límite para mantener el foco.</p>
                
                <div className="flex items-center justify-center mb-8">
                    <span className="text-5xl font-mono text-blue-600 dark:text-blue-400 font-light">{durationMinutes}</span>
                    <span className="text-gray-400 dark:text-slate-500 ml-2 mt-4 font-medium">min</span>
                </div>

                <input 
                    type="range" 
                    min="5" 
                    max="90" 
                    step="5" 
                    value={durationMinutes} 
                    onChange={(e) => setDurationMinutes(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-100 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer mb-8 accent-blue-600"
                />

                <div className="flex justify-between text-xs text-gray-400 dark:text-slate-500 px-1 mb-8">
                    <span>5m</span>
                    <span>25m</span>
                    <span>45m</span>
                    <span>90m</span>
                </div>

                <button 
                    onClick={confirmStartTask}
                    className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold shadow-lg shadow-blue-200 dark:shadow-none"
                >
                    Comenzar Foco
                </button>
            </div>
        </div>
      )}
    </div>
  );
};