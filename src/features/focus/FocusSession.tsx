import React, { useState, useEffect, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, updateTaskStatus, updateTaskReflection } from '../../lib/db';
import { useAppStore } from '../../lib/store';
import { TaskReflection } from '../../lib/types';
import { Play, Pause, CheckCircle, ArrowLeft, Coffee, Wind, Anchor, Star } from 'lucide-react';

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// GLOWUP CONSTANTS (Time in milliseconds)
const WARNING_THRESHOLD = 60 * 1000; // 60 seconds (Passive Warning)
const AUTO_PAUSE_THRESHOLD = 180 * 1000; // 3 minutes (Auto Pause protection)

export const FocusSession = () => {
  const { activeTaskId, exitFocusMode, initialFocusSeconds } = useAppStore();
  
  // Fetch the active task content
  const task = useLiveQuery(() => 
    activeTaskId ? db.tasks.get(activeTaskId) : undefined, 
    [activeTaskId]
  );

  // Timer State
  const [timeLeft, setTimeLeft] = useState(initialFocusSeconds || 5 * 60); 
  const [isActive, setIsActive] = useState(!!initialFocusSeconds); 
  const [isFinished, setIsFinished] = useState(false);
  
  // Reflection State
  const [showReflection, setShowReflection] = useState(false);

  // GlowUp State (Inactivity Monitor)
  const [showInactivityWarning, setShowInactivityWarning] = useState(false);
  const lastActivityRef = useRef<number>(Date.now());

  // --- GLOWUP SYSTEM: INTERACTION MONITOR ---
  useEffect(() => {
    const handleInteraction = () => {
      lastActivityRef.current = Date.now();
      if (showInactivityWarning) {
        setShowInactivityWarning(false);
      }
    };

    // Listen for any sign of life
    window.addEventListener('mousemove', handleInteraction);
    window.addEventListener('mousedown', handleInteraction);
    window.addEventListener('keydown', handleInteraction);
    window.addEventListener('touchstart', handleInteraction);
    window.addEventListener('click', handleInteraction);

    const monitorInterval = setInterval(() => {
      if (showReflection) return; // Don't auto-pause during reflection

      const now = Date.now();
      const timeSinceLastActivity = now - lastActivityRef.current;

      // Check for Auto Pause (Level 2 Protection)
      if (timeSinceLastActivity > AUTO_PAUSE_THRESHOLD && !isFinished) {
        handleAutoPause();
      } 
      // Check for Passive Warning (Level 1 Protection)
      else if (timeSinceLastActivity > WARNING_THRESHOLD && !isFinished) {
        setShowInactivityWarning(true);
      }
    }, 5000); // Check every 5 seconds

    return () => {
      window.removeEventListener('mousemove', handleInteraction);
      window.removeEventListener('mousedown', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
      window.removeEventListener('click', handleInteraction);
      clearInterval(monitorInterval);
    };
  }, [showInactivityWarning, activeTaskId, isFinished, showReflection]);

  // --- LOGIC ---

  const handleAutoPause = async () => {
    if (activeTaskId) {
      // Logic: Move back to pending, don't penalize.
      await updateTaskStatus(activeTaskId, 'pending');
      exitFocusMode('auto_pause');
    }
  };

  // Timer Logic
  useEffect(() => {
    let interval: number | undefined;

    if (isActive && timeLeft > 0) {
      interval = window.setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      setIsActive(false);
      setIsFinished(true);
      if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
    }

    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  // Handlers
  const start5Min = () => {
    setTimeLeft(5 * 60);
    setIsActive(true);
    setIsFinished(false);
    lastActivityRef.current = Date.now(); // Reset interaction on action
  };

  const startDeep = () => {
    setTimeLeft(25 * 60); 
    setIsActive(true);
    setIsFinished(false);
    lastActivityRef.current = Date.now();
  };

  const handleCompleteFlow = async () => {
    if (activeTaskId) {
      await updateTaskStatus(activeTaskId, 'done');
      setIsActive(false);
      setShowReflection(true); // Trigger reflection instead of immediate exit
    }
  };

  const submitReflection = async (reflection: TaskReflection) => {
    if (activeTaskId) {
        await updateTaskReflection(activeTaskId, reflection);
        exitFocusMode('completed');
    }
  };

  const handlePause = async () => {
    const confirm = window.confirm("¿Quieres pausar por ahora? La tarea volverá a 'Pendiente'.");
    if (confirm && activeTaskId) {
      await updateTaskStatus(activeTaskId, 'pending');
      exitFocusMode('manual');
    }
  };

  if (!task) return null;

  // --- REFLECTION UI ---
  if (showReflection) {
    return (
        <div className="fixed inset-0 bg-white dark:bg-slate-900 z-[100] flex flex-col items-center justify-center p-8 animate-in fade-in duration-500">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">¡Ciclo cerrado!</h2>
            <p className="text-gray-500 dark:text-slate-400 mb-8 text-center">Para tu historial: ¿Cómo se sintió esta tarea?</p>
            
            <div className="grid gap-4 w-full max-w-sm">
                <button 
                    onClick={() => submitReflection('fluid')}
                    className="p-4 rounded-2xl bg-teal-50 dark:bg-teal-900/30 border border-teal-100 dark:border-teal-800 flex items-center gap-4 hover:bg-teal-100 dark:hover:bg-teal-900/50 transition-colors group"
                >
                    <div className="p-3 bg-white dark:bg-slate-800 rounded-full text-teal-500 shadow-sm group-hover:scale-110 transition-transform"><Wind size={24}/></div>
                    <div className="text-left">
                        <span className="block font-semibold text-teal-900 dark:text-teal-100">Fluido</span>
                        <span className="text-xs text-teal-700 dark:text-teal-300 opacity-70">Avanzé sin fricción</span>
                    </div>
                </button>

                <button 
                    onClick={() => submitReflection('satisfying')}
                    className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800 flex items-center gap-4 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors group"
                >
                    <div className="p-3 bg-white dark:bg-slate-800 rounded-full text-indigo-500 shadow-sm group-hover:scale-110 transition-transform"><Star size={24}/></div>
                    <div className="text-left">
                        <span className="block font-semibold text-indigo-900 dark:text-indigo-100">Satisfactorio</span>
                        <span className="text-xs text-indigo-700 dark:text-indigo-300 opacity-70">Valió la pena el esfuerzo</span>
                    </div>
                </button>

                <button 
                    onClick={() => submitReflection('heavy')}
                    className="p-4 rounded-2xl bg-orange-50 dark:bg-orange-900/30 border border-orange-100 dark:border-orange-800 flex items-center gap-4 hover:bg-orange-100 dark:hover:bg-orange-900/50 transition-colors group"
                >
                    <div className="p-3 bg-white dark:bg-slate-800 rounded-full text-orange-500 shadow-sm group-hover:scale-110 transition-transform"><Anchor size={24}/></div>
                    <div className="text-left">
                        <span className="block font-semibold text-orange-900 dark:text-orange-100">Pesado</span>
                        <span className="text-xs text-orange-700 dark:text-orange-300 opacity-70">Me costó energía</span>
                    </div>
                </button>
            </div>

            <button onClick={() => exitFocusMode('completed')} className="mt-8 text-sm text-gray-400 dark:text-slate-600 underline">
                Saltar reflexión
            </button>
        </div>
    )
  }

  // --- FOCUS SESSION UI ---
  return (
    <div className="fixed inset-0 bg-white dark:bg-slate-950 z-[100] flex flex-col items-center justify-between p-8 animate-in fade-in duration-300 relative overflow-hidden">
      
      {/* GLOWUP: PASSIVE WARNING BANNER */}
      <div 
        className={`absolute top-0 left-0 right-0 bg-blue-50 dark:bg-blue-900/50 p-4 shadow-sm transition-transform duration-500 ease-out z-50 flex items-center justify-center gap-3 ${showInactivityWarning ? 'translate-y-0' : '-translate-y-full'}`}
        onClick={() => { lastActivityRef.current = Date.now(); setShowInactivityWarning(false); }}
      >
        <Coffee size={20} className="text-blue-500 dark:text-blue-300" />
        <span className="text-blue-800 dark:text-blue-100 text-sm font-medium">¿Seguimos aquí? Si necesitas pausar, está bien.</span>
      </div>

      {/* Header */}
      <div className="w-full flex justify-between items-center text-gray-400 dark:text-slate-500 mt-2">
        <button onClick={handlePause} className="flex items-center gap-1 text-sm hover:text-gray-600 dark:hover:text-slate-300 transition-colors">
          <ArrowLeft size={16} /> Pausar
        </button>
        <div className="text-xs uppercase tracking-widest font-semibold text-blue-200 dark:text-blue-900">
          MODO FOCO
        </div>
        <div className="w-12"></div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md text-center">
        
        {/* Task Card */}
        <div className="mb-12">
          <h2 className="text-2xl font-medium text-gray-800 dark:text-white leading-tight">
            {task.content}
          </h2>
          <p className="mt-4 text-gray-500 dark:text-slate-400 text-sm">
            {isActive 
              ? "Un paso a la vez." 
              : "Respira. Solo intenta empezar."}
          </p>
        </div>

        {/* Timer Display */}
        <div className="font-mono text-7xl font-light text-gray-900 dark:text-white tracking-tighter mb-12 tabular-nums">
          {formatTime(timeLeft)}
        </div>

        {/* Controls State Machine */}
        {!isActive && !isFinished && (
          <div className="flex flex-col gap-4 w-full">
            <button 
              onClick={start5Min}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-medium text-lg shadow-lg shadow-blue-200 dark:shadow-none transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <Play size={20} fill="currentColor" />
              Probar solo 5 minutos
            </button>
            <button 
              onClick={startDeep}
              className="w-full bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400 py-4 rounded-2xl font-medium transition-colors"
            >
              Iniciar sesión estándar (25m)
            </button>
          </div>
        )}

        {isActive && (
          <div className="flex flex-col gap-6 w-full animate-in zoom-in-95 duration-300">
            <button 
              onClick={() => setIsActive(false)}
              className="mx-auto bg-gray-100 dark:bg-slate-800 p-4 rounded-full text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
            >
              <Pause size={24} fill="currentColor" />
            </button>
            <button 
              onClick={handleCompleteFlow}
              className="text-green-600 dark:text-green-400 font-medium flex items-center justify-center gap-2 py-2"
            >
              <CheckCircle size={20} />
              ¡Terminé!
            </button>
          </div>
        )}

        {/* Finished State (Timer done) */}
        {isFinished && (
          <div className="w-full animate-in slide-in-from-bottom-4 duration-500">
            <p className="text-lg text-gray-700 dark:text-slate-300 mb-6">
              ¡Tiempo completado! <br/>
              <span className="font-bold">¿Cómo te sientes?</span>
            </p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => {
                  setTimeLeft(15 * 60); // Add 15 min
                  setIsActive(true);
                  setIsFinished(false);
                  lastActivityRef.current = Date.now();
                }}
                className="w-full bg-blue-600 text-white py-4 rounded-2xl font-medium shadow-lg"
              >
                Seguir (+15 min)
              </button>
              <button 
                onClick={handleCompleteFlow}
                className="w-full bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 py-4 rounded-2xl font-medium border border-green-100 dark:border-green-900"
              >
                Tarea terminada
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};