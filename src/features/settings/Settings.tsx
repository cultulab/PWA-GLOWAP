import React, { useState, useEffect } from 'react';
import { Garden } from '../garden/Garden';
import { Trash2, Info, Bell, Sprout, Check, Edit3, DownloadCloud, History, CheckCircle, X, Moon, Sun, Monitor } from 'lucide-react';
import { SEED_OPTIONS } from '../../lib/plant-metaphor';
import { SeedType } from '../../lib/types';
import { db } from '../../lib/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { isDateInCurrentWeek } from '../../lib/date-utils';

export const Settings = () => {
  const [notificationStatus, setNotificationStatus] = useState(Notification.permission);
  const [currentSeed, setCurrentSeed] = useState<SeedType | null>(null);
  const [flowerName, setFlowerName] = useState('');
  const [isChangingSeed, setIsChangingSeed] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  
  // Theme State
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(
    (localStorage.getItem('theme') as any) || 'system'
  );

  useEffect(() => {
    const storedSeed = localStorage.getItem('cf_seed') as SeedType;
    if (storedSeed) setCurrentSeed(storedSeed);
    
    const storedName = localStorage.getItem('cf_flower_name');
    if (storedName) setFlowerName(storedName);
  }, []);

  // Theme Logic
  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    if (newTheme === 'system') {
        localStorage.removeItem('theme');
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    } else {
        localStorage.setItem('theme', newTheme);
        if (newTheme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }
  };

  const handleExport = async () => {
    try {
        const tasks = await db.tasks.toArray();
        const logs = await db.daily_logs.toArray();
        const data = {
            tasks,
            logs,
            seed: localStorage.getItem('cf_seed'),
            flowerName: localStorage.getItem('cf_flower_name'),
            exportedAt: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `conscious-focus-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } catch (e) {
        alert('Error al exportar los datos.');
    }
  };

  const handleReset = () => {
    if (confirm('¿ESTÁS SEGURO? \n\nEsto borrará todas tus tareas, historial del jardín y configuraciones. \n\nTe recomendamos "Exportar copia" antes de continuar.')) {
      window.indexedDB.deleteDatabase('ConsciousFocusDB');
      localStorage.removeItem('cf_seed');
      localStorage.removeItem('cf_flower_name');
      localStorage.removeItem('cf_last_visit_week');
      localStorage.removeItem('theme');
      window.location.reload();
    }
  };

  const handleSeedChange = (seed: SeedType) => {
    localStorage.setItem('cf_seed', seed);
    setCurrentSeed(seed);
    setIsChangingSeed(false);
  };

  const saveFlowerName = () => {
    localStorage.setItem('cf_flower_name', flowerName.trim());
    setIsEditingName(false);
  };

  const requestNotifications = async () => {
    if (!('Notification' in window)) {
      alert('Tu navegador no soporta notificaciones.');
      return;
    }
    const permission = await Notification.requestPermission();
    setNotificationStatus(permission);
    if (permission === 'granted') {
      new Notification('¡Conscious Focus activado!', {
        body: 'Te avisaremos amablemente si olvidas tus metas de hoy.',
        icon: '/vite.svg'
      });
    }
  };

  return (
    <div className="flex flex-col h-full bg-background dark:bg-slate-900 pt-8 pb-24 overflow-y-auto no-scrollbar transition-colors duration-300">
      <header className="px-6 mb-8">
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">Mi Espacio</h1>
        <p className="text-sm text-gray-500 dark:text-slate-400">Tu historial de crecimiento.</p>
      </header>

      <div className="px-6 pb-8 space-y-8">
        
        {/* The Garden Feature */}
        <section>
          <Garden />
        </section>

        {/* History Button */}
        <section>
          <button 
            onClick={() => setShowHistory(true)}
            className="w-full bg-white dark:bg-slate-800 p-4 rounded-2xl border border-gray-100 dark:border-slate-700 flex items-center justify-between shadow-sm hover:border-blue-200 dark:hover:border-blue-700 transition-colors"
          >
             <div className="flex items-center gap-3">
               <div className="p-2 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300 rounded-full">
                 <History size={20} />
               </div>
               <div className="text-left">
                 <span className="block font-medium text-gray-800 dark:text-gray-100">Historial de Actividades</span>
                 <span className="text-xs text-gray-400 dark:text-slate-500">Ver todo lo completado por fecha</span>
               </div>
             </div>
             <div className="p-1 text-gray-300 dark:text-slate-600">
               <CheckCircle size={20} />
             </div>
          </button>
        </section>

        <hr className="border-gray-100 dark:border-slate-800" />

        {/* Theme Settings */}
        <section>
             <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                <Monitor size={16} /> Apariencia
             </h3>
             <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-1 flex">
                 <button 
                   onClick={() => handleThemeChange('light')}
                   className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all ${theme === 'light' ? 'bg-gray-100 dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-sm' : 'text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300'}`}
                 >
                    <Sun size={16} /> Claro
                 </button>
                 <button 
                   onClick={() => handleThemeChange('dark')}
                   className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all ${theme === 'dark' ? 'bg-gray-100 dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-sm' : 'text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300'}`}
                 >
                    <Moon size={16} /> Oscuro
                 </button>
                 <button 
                   onClick={() => handleThemeChange('system')}
                   className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all ${theme === 'system' ? 'bg-gray-100 dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-sm' : 'text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300'}`}
                 >
                    <Monitor size={16} /> Auto
                 </button>
             </div>
        </section>

        {/* Identity Settings */}
        <section>
          <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
            <Sprout size={16} /> Identidad Simbólica
          </h3>

          {!isChangingSeed ? (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-4 space-y-4">
              {/* Active Seed Display */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                   {currentSeed ? SEED_OPTIONS.find(s => s.id === currentSeed)?.icon : <Sprout size={24} className="text-gray-300 dark:text-slate-600"/>}
                   <div className="text-left">
                     <span className="block text-sm font-medium text-gray-800 dark:text-white">
                       {currentSeed ? SEED_OPTIONS.find(s => s.id === currentSeed)?.label : 'Sin definir'}
                     </span>
                     <span className="text-xs text-gray-400 dark:text-slate-500">Especie</span>
                   </div>
                </div>
                <button 
                  onClick={() => setIsChangingSeed(true)}
                  className="text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-full"
                >
                  Cambiar
                </button>
              </div>

              <div className="h-px bg-gray-50 dark:bg-slate-700" />

              {/* Name Display / Edit */}
              <div className="flex items-center justify-between">
                 {isEditingName ? (
                   <div className="flex items-center gap-2 w-full">
                     <input 
                       type="text" 
                       value={flowerName}
                       onChange={(e) => setFlowerName(e.target.value)}
                       placeholder="Nombra a tu planta..."
                       className="flex-1 bg-gray-50 dark:bg-slate-900 border border-blue-200 dark:border-blue-800 rounded-lg px-3 py-1 text-sm outline-none dark:text-white"
                       autoFocus
                     />
                     <button onClick={saveFlowerName} className="p-1 bg-blue-600 text-white rounded-md">
                        <Check size={16} />
                     </button>
                   </div>
                 ) : (
                    <>
                      <div className="flex items-center gap-3">
                        <div className="w-8 flex justify-center"><Edit3 size={18} className="text-gray-300 dark:text-slate-500"/></div>
                        <div className="text-left">
                          <span className="block text-sm font-medium text-gray-800 dark:text-white">
                            {flowerName || '(Sin nombre)'}
                          </span>
                          <span className="text-xs text-gray-400 dark:text-slate-500">Nombre de tu planta</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => setIsEditingName(true)}
                        className="text-xs font-semibold text-gray-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 px-3 py-1"
                      >
                        Editar
                      </button>
                    </>
                 )}
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-4 animate-in slide-in-from-top-2">
               <p className="text-xs text-gray-400 dark:text-slate-500 mb-3">Elige tu nueva semilla:</p>
               <div className="flex flex-col gap-2">
                  {SEED_OPTIONS.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => handleSeedChange(option.id)}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${currentSeed === option.id ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-100 dark:border-blue-800' : 'hover:bg-gray-50 dark:hover:bg-slate-700 border-transparent'}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="scale-75">{option.icon}</div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{option.label}</span>
                      </div>
                      {currentSeed === option.id && <Check size={16} className="text-blue-500"/>}
                    </button>
                  ))}
               </div>
               <button 
                 onClick={() => setIsChangingSeed(false)}
                 className="text-xs text-gray-400 dark:text-slate-500 mt-4 underline w-full text-center"
               >
                 Cancelar
               </button>
            </div>
          )}
        </section>

        {/* Preferences */}
        <section>
          <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
            <Info size={16} /> Preferencias
          </h3>
          
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 overflow-hidden mb-6">
             <button 
               onClick={requestNotifications}
               className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
               disabled={notificationStatus === 'granted'}
             >
               <div className="flex items-center gap-3">
                 <div className={`p-2 rounded-full ${notificationStatus === 'granted' ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' : 'bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400'}`}>
                   <Bell size={18} />
                 </div>
                 <div className="text-left">
                   <span className="block text-sm font-medium text-gray-800 dark:text-white">Notificaciones empáticas</span>
                   <span className="text-xs text-gray-400 dark:text-slate-500">
                     {notificationStatus === 'granted' ? 'Activadas' : 'Desactivadas'}
                   </span>
                 </div>
               </div>
               {notificationStatus !== 'granted' && (
                 <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-full">Activar</span>
               )}
             </button>
          </div>
        </section>

        {/* Data Management */}
        <section>
          <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
             Sistema
          </h3>
          
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 overflow-hidden space-y-px">
             <button 
               onClick={handleExport}
               className="w-full p-4 text-left flex items-center gap-3 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors bg-white dark:bg-slate-800"
             >
               <DownloadCloud size={18} className="text-blue-500 dark:text-blue-400" />
               <div className="text-left">
                    <span className="block text-sm font-medium">Exportar copia de seguridad</span>
                    <span className="text-xs text-gray-400 dark:text-slate-500">Guardar toda la información (JSON)</span>
               </div>
             </button>

             <button 
               onClick={handleReset}
               className="w-full p-4 text-left flex items-center gap-3 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors bg-white dark:bg-slate-800"
             >
               <Trash2 size={18} />
               <span className="text-sm font-medium">Reiniciar todo el sistema</span>
             </button>
          </div>
          <p className="text-xs text-gray-400 dark:text-slate-600 mt-2 px-2">
            Los datos se guardan solo en este dispositivo.
          </p>
        </section>
      </div>

      {/* HISTORY MODAL */}
      {showHistory && <HistoryModal onClose={() => setShowHistory(false)} />}
    </div>
  );
};

const HistoryModal = ({ onClose }: { onClose: () => void }) => {
    const [filter, setFilter] = useState<'today' | 'week' | 'all'>('week');
    const tasks = useLiveQuery(() => db.tasks.where('status').equals('done').reverse().sortBy('updatedAt'), []);

    if (!tasks) return null;

    const filteredTasks = tasks.filter(t => {
        const date = new Date(t.updatedAt);
        const today = new Date();
        if (filter === 'today') {
            return date.toDateString() === today.toDateString();
        }
        if (filter === 'week') {
            return isDateInCurrentWeek(t.updatedAt);
        }
        return true;
    });

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-900 w-full max-w-md h-[80vh] rounded-3xl shadow-2xl flex flex-col animate-in zoom-in-95 border border-gray-100 dark:border-slate-800">
                <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <History size={20} className="text-purple-500"/> Historial
                    </h3>
                    <button onClick={onClose} className="p-2 bg-gray-50 dark:bg-slate-800 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500 dark:text-slate-400"><X size={18}/></button>
                </div>
                
                <div className="p-4 flex gap-2 bg-gray-50 dark:bg-slate-950">
                    <button onClick={() => setFilter('today')} className={`flex-1 py-2 text-xs font-bold rounded-lg ${filter === 'today' ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-400 dark:text-slate-600'}`}>Hoy</button>
                    <button onClick={() => setFilter('week')} className={`flex-1 py-2 text-xs font-bold rounded-lg ${filter === 'week' ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-400 dark:text-slate-600'}`}>Semana</button>
                    <button onClick={() => setFilter('all')} className={`flex-1 py-2 text-xs font-bold rounded-lg ${filter === 'all' ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-400 dark:text-slate-600'}`}>Todo</button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {filteredTasks.length === 0 ? (
                        <div className="text-center text-gray-400 dark:text-slate-600 py-10">
                            <p>No hay actividad registrada en este periodo.</p>
                        </div>
                    ) : (
                        filteredTasks.map(t => (
                            <div key={t.id} className="p-4 border border-gray-100 dark:border-slate-800 rounded-xl flex items-start gap-3 bg-white dark:bg-slate-800/50">
                                <div className="mt-1"><CheckCircle size={16} className="text-green-500"/></div>
                                <div>
                                    <p className="text-gray-800 dark:text-slate-200 text-sm font-medium line-through decoration-gray-300 dark:decoration-slate-600">{t.content}</p>
                                    <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">
                                        {new Date(t.updatedAt).toLocaleDateString()} • {new Date(t.updatedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </p>
                                    {t.reflection && (
                                        <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-1 italic">
                                            Sentimiento: {t.reflection === 'fluid' ? 'Fluido 🍃' : t.reflection === 'heavy' ? 'Pesado ⚓' : 'Satisfactorio ⭐'}
                                        </p>
                                    )}
                                    {t.subtasks && t.subtasks.length > 0 && (
                                        <div className="mt-2 text-xs text-gray-500 pl-2 border-l-2 border-gray-100 dark:border-slate-700">
                                            {t.subtasks.filter(s => s.isDone).length}/{t.subtasks.length} pasos
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};