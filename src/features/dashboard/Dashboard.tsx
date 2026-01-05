import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, logDailyCheckIn } from '../../lib/db';
import { useAppStore } from '../../lib/store';
import { EnergyLevel, Emotion, SeedType } from '../../lib/types';
import { getWipConfig } from '../../lib/wip-logic';
import { getWeekNumber, isDateInCurrentWeek } from '../../lib/date-utils';
import { PlantVisual, SEED_OPTIONS } from '../../lib/plant-metaphor';
import { Battery, BatteryCharging, BatteryLow, ArrowRight, Compass, Sprout, Check, RefreshCw, ChevronRight, X, HeartHandshake } from 'lucide-react';

export const Dashboard = () => {
  const { setTab, focusExitReason, clearExitReason } = useAppStore();
  const todayStr = new Date().toISOString().split('T')[0];

  // Local state
  const [step, setStep] = useState<'seed' | 'name' | 'emotion' | 'energy'>('seed'); 
  const [selectedSeed, setSelectedSeed] = useState<SeedType | null>(null);
  const [selectedEmotion, setSelectedEmotion] = useState<Emotion | null>(null);
  const [showWeeklyReview, setShowWeeklyReview] = useState(false);
  const [isChangingSeed, setIsChangingSeed] = useState(false);
  const [flowerName, setFlowerName] = useState<string>('');
  const [tempName, setTempName] = useState('');
  
  // Auto Pause Notification State
  const [showAutoPauseToast, setShowAutoPauseToast] = useState(false);

  // Queries
  const dailyLog = useLiveQuery(() => db.daily_logs.where('date').equals(todayStr).first(), [todayStr]);
  const tasks = useLiveQuery(() => db.tasks.toArray(), []); 
  
  // Logic needed for stats
  const todayTasks = tasks?.filter(t => t.horizon === 'today') || [];
  const pendingCount = todayTasks.filter(t => t.status === 'pending').length;
  const doneCount = todayTasks.filter(t => t.status === 'done').length;
  const inProgress = todayTasks.find(t => t.status === 'in_progress');

  // Logic for Plant (Weekly Done Count)
  const weeklyDoneCount = tasks?.filter(t => 
    t.status === 'done' && isDateInCurrentWeek(t.updatedAt)
  ).length || 0;

  // INITIALIZATION & WEEKLY CHECK
  useEffect(() => {
    // 1. Check for stored seed identity and name
    const storedSeed = localStorage.getItem('cf_seed') as SeedType;
    const storedName = localStorage.getItem('cf_flower_name') || '';
    setFlowerName(storedName);
    
    if (storedSeed) {
      setSelectedSeed(storedSeed);
      // If we already have a seed, skip onboarding unless name is missing
      if (!storedName) {
         setStep('name');
      } else {
         setStep('emotion');
      }
    } else {
      // First time ever
      setStep('seed');
    }

    // 2. Check for New Week
    const checkNewWeek = () => {
      const currentWeek = getWeekNumber(new Date());
      const lastWeekStr = localStorage.getItem('cf_last_visit_week');
      
      if (lastWeekStr) {
        const lastWeek = parseInt(lastWeekStr);
        if (currentWeek !== lastWeek) {
          setShowWeeklyReview(true);
        }
      }
      // Update usage
      localStorage.setItem('cf_last_visit_week', currentWeek.toString());
    };
    checkNewWeek();
  }, []);

  // CHECK FOR AUTO PAUSE REASON
  useEffect(() => {
    if (focusExitReason === 'auto_pause') {
      setShowAutoPauseToast(true);
      // Auto hide after 8 seconds
      const timer = setTimeout(() => {
        setShowAutoPauseToast(false);
        clearExitReason();
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [focusExitReason, clearExitReason]);

  const handleSeedSelect = (seed: SeedType) => {
    setSelectedSeed(seed);
    localStorage.setItem('cf_seed', seed);
    setTimeout(() => {
      setStep('name');
    }, 300);
  };

  const handleNameSubmit = () => {
    if (tempName.trim()) {
      localStorage.setItem('cf_flower_name', tempName.trim());
      setFlowerName(tempName.trim());
      setStep('emotion');
    }
  };

  const handleEmotionSelect = (emotion: Emotion) => {
    setSelectedEmotion(emotion);
    setStep('energy');
  };

  const handleEnergySelect = async (energy: EnergyLevel) => {
    if (selectedEmotion && selectedSeed) {
      await logDailyCheckIn(energy, selectedEmotion, selectedSeed);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 19) return 'Buenas tardes';
    return 'Buenas noches';
  };

  const emotions: { id: Emotion; label: string; emoji: string }[] = [
    { id: 'neutral', label: 'Neutro', emoji: '😐' },
    { id: 'calm', label: 'Tranquilo', emoji: '🙂' },
    { id: 'excited', label: 'Emocionado', emoji: '😄' },
    { id: 'tired', label: 'Cansado', emoji: '😴' },
    { id: 'stressed', label: 'Estresado', emoji: '😫' },
    { id: 'sad', label: 'Triste', emoji: '😢' },
  ];

  // WEEKLY REVIEW MODAL
  if (showWeeklyReview) {
    return (
      <div className="fixed inset-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-500">
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-8 max-w-sm text-center border border-gray-100 dark:border-slate-700 overflow-y-auto max-h-full">
          {!isChangingSeed ? (
            <>
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600 dark:text-green-400">
                <Sprout size={32} />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">¡Nueva Semana!</h2>
              <p className="text-gray-500 dark:text-slate-400 mb-6 leading-relaxed">
                Tu planta de la semana pasada ha sido guardada en el Campo.
                Hoy empezamos de nuevo.
              </p>
              
              <div className="bg-gray-50 dark:bg-slate-900 p-4 rounded-2xl mb-6">
                <p className="text-xs text-gray-400 dark:text-slate-500 mb-2 uppercase tracking-wide font-bold">Tu semilla actual</p>
                <div className="flex items-center gap-3 justify-center">
                   {/* Visual check of current seed */}
                   {SEED_OPTIONS.find(s => s.id === selectedSeed)?.icon}
                   <span className="font-medium text-gray-700 dark:text-slate-200">
                     {SEED_OPTIONS.find(s => s.id === selectedSeed)?.label || 'Sin definir'}
                   </span>
                </div>
                <button 
                  onClick={() => setIsChangingSeed(true)}
                  className="text-xs text-blue-600 dark:text-blue-400 font-medium mt-3 flex items-center justify-center gap-1 w-full"
                >
                  <RefreshCw size={12} /> Cambiar para esta semana
                </button>
              </div>

              <button 
                onClick={() => setShowWeeklyReview(false)}
                className="w-full bg-blue-600 text-white py-4 rounded-xl font-medium shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all"
              >
                Comenzar ciclo
              </button>
            </>
          ) : (
             <div className="animate-in slide-in-from-right duration-300">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Elige tu nueva semilla</h2>
                <div className="flex flex-col gap-3 mb-6">
                  {SEED_OPTIONS.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => handleSeedSelect(option.id)}
                      className={`relative p-3 rounded-2xl border text-left transition-all ${selectedSeed === option.id ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700' : 'bg-white dark:bg-slate-700 border-gray-100 dark:border-slate-600'}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${option.color} bg-opacity-20`}>
                          {option.icon}
                        </div>
                        <div>
                          <h3 className="font-semibold text-sm text-gray-800 dark:text-slate-200">{option.label}</h3>
                          <p className="text-[10px] text-gray-500 dark:text-slate-400 leading-tight">
                            {option.description}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
                <button 
                  onClick={() => setIsChangingSeed(false)}
                  className="text-gray-400 dark:text-slate-500 text-sm"
                >
                  Cancelar
                </button>
             </div>
          )}
        </div>
      </div>
    );
  }

  // 1. STATE: CHECK-IN WIZARD
  if (!dailyLog) {
    return (
      <div className="h-full flex flex-col justify-center items-center p-6 bg-white dark:bg-slate-900 text-center animate-in fade-in duration-500 overflow-y-auto">
        <h1 className="text-2xl font-light text-gray-800 dark:text-white mb-6 flex-shrink-0">{getGreeting()}.</h1>
        
        {/* Step 1: Seed Selection */}
        {step === 'seed' && (
          <div className="w-full max-w-sm animate-in slide-in-from-right-4 duration-300 pb-10">
            <p className="text-gray-500 dark:text-slate-400 mb-6">Para empezar tu viaje, elige tu identidad simbólica.</p>
            <div className="flex flex-col gap-3">
              {SEED_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  onClick={() => handleSeedSelect(option.id)}
                  className={`relative p-4 rounded-2xl border text-left transition-all duration-200 group active:scale-[0.98] ${selectedSeed === option.id ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700 ring-1 ring-blue-100 dark:ring-blue-800' : 'bg-gray-50 dark:bg-slate-800 border-transparent hover:bg-white dark:hover:bg-slate-700 hover:border-gray-200 hover:shadow-sm'}`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl ${option.color} bg-opacity-20`}>
                      {option.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800 dark:text-slate-200">{option.label}</h3>
                      <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 leading-relaxed pr-2">
                        {option.description}
                      </p>
                    </div>
                  </div>
                  {selectedSeed === option.id && (
                    <div className="absolute top-4 right-4 text-blue-500 dark:text-blue-400">
                      <Check size={18} />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Naming */}
        {step === 'name' && (
          <div className="w-full max-w-sm animate-in slide-in-from-right-4 duration-300">
             <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-6 text-blue-500 dark:text-blue-400">
                {selectedSeed ? SEED_OPTIONS.find(s => s.id === selectedSeed)?.icon : <Sprout size={32}/>}
             </div>
             <p className="text-gray-500 dark:text-slate-400 mb-6">¿Qué nombre le pondrás a tu planta?</p>
             <input
                type="text"
                placeholder="Ej. Esperanza, Fuego, Calma..."
                className="w-full p-4 text-center text-lg bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl outline-none focus:border-blue-300 dark:text-white mb-6"
                autoFocus
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleNameSubmit()}
             />
             <button 
               onClick={handleNameSubmit}
               disabled={!tempName.trim()}
               className={`w-full py-4 rounded-xl font-medium transition-all ${tempName.trim() ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-gray-100 dark:bg-slate-800 text-gray-300 dark:text-slate-600'}`}
             >
               Continuar
             </button>
          </div>
        )}

        {/* Step 3: Emotion */}
        {step === 'emotion' && (
          <div className="w-full max-w-sm animate-in slide-in-from-right-4 duration-300">
             <p className="text-gray-500 dark:text-slate-400 mb-8">¿Cómo te sientes emocionalmente?</p>
             <div className="grid grid-cols-2 gap-3">
               {emotions.map((em) => (
                 <button
                   key={em.id}
                   onClick={() => handleEmotionSelect(em.id)}
                   className="flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-slate-800 rounded-2xl border border-transparent hover:border-blue-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
                 >
                   <span className="text-3xl mb-2">{em.emoji}</span>
                   <span className="text-sm text-gray-700 dark:text-slate-200 font-medium">{em.label}</span>
                 </button>
               ))}
             </div>
          </div>
        )}

        {/* Step 4: Energy */}
        {step === 'energy' && (
          <div className="w-full max-w-sm animate-in slide-in-from-right-4 duration-300">
            <button 
              onClick={() => setStep('emotion')} 
              className="text-xs text-gray-400 dark:text-slate-500 mb-6 hover:text-gray-600 dark:hover:text-slate-300"
            >
              ← Volver a emociones
            </button>
            <p className="text-gray-500 dark:text-slate-400 mb-8">¿Y cómo está tu energía física?</p>
            
            <div className="flex flex-col gap-4">
              <button 
                onClick={() => handleEnergySelect('high')}
                className="flex items-center gap-4 p-4 rounded-2xl border border-gray-100 dark:border-slate-700 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
              >
                <BatteryCharging size={24} />
                <div className="text-left">
                  <span className="block font-semibold">Alta</span>
                  <span className="text-xs opacity-70">Lista/o para todo</span>
                </div>
              </button>

              <button 
                onClick={() => handleEnergySelect('medium')}
                className="flex items-center gap-4 p-4 rounded-2xl border border-gray-100 dark:border-slate-700 bg-orange-50 dark:bg-orange-900/20 text-orange-800 dark:text-orange-300 hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors"
              >
                <Battery size={24} />
                <div className="text-left">
                  <span className="block font-semibold">Media</span>
                  <span className="text-xs opacity-70">Un día normal</span>
                </div>
              </button>

              <button 
                onClick={() => handleEnergySelect('low')}
                className="flex items-center gap-4 p-4 rounded-2xl border border-gray-100 dark:border-slate-700 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
              >
                <BatteryLow size={24} />
                <div className="text-left">
                  <span className="block font-semibold">Baja</span>
                  <span className="text-xs opacity-70">Necesito ir despacio</span>
                </div>
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 2. STATE: DASHBOARD SUMMARY
  const wipConfig = getWipConfig(dailyLog.emotion, dailyLog.energy);
  
  // Helper to get emoji for emotion
  const emotionEmoji = emotions.find(e => e.id === dailyLog.emotion)?.emoji || '😐';
  
  // Get active seed info - prefer dailyLog record, fallback to storage, fallback to tulip
  const activeSeed = dailyLog.seedType || (localStorage.getItem('cf_seed') as SeedType) || 'tulip';

  return (
    <div className="h-full bg-background dark:bg-slate-900 pt-12 px-6 pb-24 overflow-y-auto no-scrollbar relative transition-colors duration-300">
      
      {/* GLOWUP: Welcome Back Toast */}
      {showAutoPauseToast && (
        <div className="absolute top-4 left-4 right-4 z-50 animate-in slide-in-from-top-4 duration-500">
           <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur shadow-xl border border-blue-100 dark:border-slate-700 rounded-2xl p-4 flex items-start gap-3">
              <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-full text-blue-500 dark:text-blue-400">
                <HeartHandshake size={20} />
              </div>
              <div className="flex-1">
                 <h4 className="text-sm font-semibold text-gray-800 dark:text-white">Pausamos para cuidarte</h4>
                 <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">Detectamos que no estabas. Tu tarea te espera en pendientes cuando quieras retomar.</p>
              </div>
              <button onClick={() => setShowAutoPauseToast(false)} className="text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300">
                <X size={16} />
              </button>
           </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white tracking-tight">{getGreeting()}.</h1>
          <p className="text-gray-500 dark:text-slate-400 mt-1">Hoy es {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}.</p>
        </div>
        <div className="flex items-center gap-2 bg-white dark:bg-slate-800 p-2 px-3 rounded-full shadow-sm border border-gray-100 dark:border-slate-700">
           <span className="text-lg">{emotionEmoji}</span>
           <div className="h-4 w-[1px] bg-gray-200 dark:bg-slate-600"></div>
          {dailyLog.energy === 'high' ? <BatteryCharging size={18} className="text-green-500"/> :
           dailyLog.energy === 'medium' ? <Battery size={18} className="text-orange-500"/> :
           <BatteryLow size={18} className="text-blue-500"/>}
        </div>
      </div>

      {/* SYMBOLIC GROWTH SYSTEM: ACTIVE PLANT */}
      <div className="mb-8 animate-in slide-in-from-top-4 duration-700">
        <PlantVisual count={weeklyDoneCount} seedType={activeSeed} customName={flowerName} />
      </div>

      {/* Cognitive/WIP Insight Card */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 mb-8 flex flex-col gap-4 transition-colors">
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-2xl ${wipConfig.limit === 0 ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300' : 'bg-gray-50 dark:bg-slate-700 text-gray-600 dark:text-slate-300'}`}>
            <Compass size={24} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800 dark:text-white">
              {wipConfig.limit === 0 ? 'Modo Descanso' : `Foco Sugerido: ${wipConfig.limit} a la vez`}
            </h3>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-1 leading-relaxed">
              {wipConfig.message}
            </p>
          </div>
        </div>
      </div>

      {/* Main Action Area */}
      {inProgress ? (
         <div className="bg-blue-600 dark:bg-blue-700 rounded-3xl p-6 text-white shadow-lg shadow-blue-200 dark:shadow-none mb-8 transform transition-transform active:scale-[0.98]" onClick={() => setTab('board')}>
           <div className="flex justify-between items-start mb-4">
             <span className="text-blue-200 text-xs font-bold uppercase tracking-wider">En Foco Ahora</span>
             <div className="animate-pulse w-2 h-2 rounded-full bg-white"></div>
           </div>
           <h2 className="text-xl font-medium mb-4 leading-snug">{inProgress.content}</h2>
           <div className="flex items-center gap-2 text-sm font-medium">
             <span>Continuar</span>
             <ArrowRight size={16} />
           </div>
         </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 mb-8">
          <button 
            onClick={() => setTab('brain_dump')}
            className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm text-left hover:border-blue-200 dark:hover:border-blue-700 transition-colors"
          >
            <span className="text-2xl mb-2 block">🧠</span>
            <span className="font-semibold text-gray-800 dark:text-white block">Vaciado</span>
            <span className="text-xs text-gray-400 dark:text-slate-400">Capturar ideas</span>
          </button>

          <button 
            onClick={() => setTab('board')}
            className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm text-left hover:border-blue-200 dark:hover:border-blue-700 transition-colors relative"
          >
            {pendingCount > 0 && (
              <span className="absolute top-4 right-4 bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                {pendingCount}
              </span>
            )}
            <span className="text-2xl mb-2 block">📋</span>
            <span className="font-semibold text-gray-800 dark:text-white block">Tablero</span>
            <span className="text-xs text-gray-400 dark:text-slate-400">Organizar día</span>
          </button>
        </div>
      )}

      {/* Progress Summary (Simplified) */}
      <div className="mb-8">
        <div className="bg-gray-50 dark:bg-slate-800 rounded-2xl p-4 flex items-center justify-between border border-gray-100 dark:border-slate-700 transition-colors">
          <span className="text-xs text-gray-500 dark:text-slate-400">Hoy has completado {doneCount} tareas.</span>
          {doneCount > 0 && <span className="text-xs font-semibold text-blue-500 dark:text-blue-400">Sigue fluyendo.</span>}
        </div>
      </div>

    </div>
  );
};