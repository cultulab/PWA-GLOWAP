import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../lib/db';
import { Task } from '../../lib/types';
import { getYearWeekString, getDateRangeOfWeek } from '../../lib/date-utils';
import { PlantVisual, getPlantStage, PlantStage } from '../../lib/plant-metaphor';
import { X, CheckCircle } from 'lucide-react';

interface WeekMemory {
  id: string; // "2024-W10"
  year: number;
  week: number;
  tasks: Task[];
}

export const Garden = () => {
  // Fetch all done tasks
  const doneTasks = useLiveQuery(() => db.tasks.where('status').equals('done').toArray(), []);
  const [selectedWeek, setSelectedWeek] = useState<WeekMemory | null>(null);

  if (!doneTasks) return <div className="p-8 text-center text-gray-400">Cargando el campo...</div>;

  // Aggregate Data
  const weeksMap = new Map<string, WeekMemory>();

  doneTasks.forEach(task => {
    const key = getYearWeekString(task.updatedAt); 
    const [yearStr, weekStr] = key.split('-W');
    
    if (!weeksMap.has(key)) {
      weeksMap.set(key, { 
        id: key, 
        year: parseInt(yearStr), 
        week: parseInt(weekStr), 
        tasks: []
      });
    }
    const mem = weeksMap.get(key)!;
    mem.tasks.push(task);
  });

  const weeks = Array.from(weeksMap.values()).sort((a, b) => b.id.localeCompare(a.id)); 

  return (
    <div className="space-y-6">
      <div className="bg-stone-50 p-6 rounded-3xl border border-stone-100">
        <h3 className="font-semibold text-stone-800 mb-2">El Campo</h3>
        <p className="text-sm text-stone-500 leading-relaxed font-light">
          Aquí descansa lo que ya hiciste. No hay competencia ni juicio. 
          Solo memoria de tu dedicación.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {weeks.length === 0 ? (
          <div className="col-span-2 text-center py-12 text-gray-300">
             <div className="mx-auto mb-2 text-4xl opacity-30">🌱</div>
             <p className="text-sm">Tu primera planta crecerá aquí pronto.</p>
          </div>
        ) : (
          weeks.map(week => {
            const config = getPlantStage(week.tasks.length);
            return (
              <button 
                key={week.id} 
                onClick={() => setSelectedWeek(week)}
                className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center justify-center gap-3 hover:border-blue-100 transition-colors"
              >
                <PlantVisual count={week.tasks.length} isSmall={true} />
                <div className="text-center">
                  <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Semana {week.week}</span>
                  <span className="text-[10px] text-gray-400 block mt-1">{getDateRangeOfWeek(week.week, week.year)}</span>
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Week Detail Modal */}
      {selectedWeek && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setSelectedWeek(null)} />
            <div className="relative w-full max-w-sm bg-white rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-10 max-h-[85vh] flex flex-col">
                <button 
                    onClick={() => setSelectedWeek(null)}
                    className="absolute top-6 right-6 p-2 bg-gray-50 rounded-full text-gray-400 hover:bg-gray-100 z-10"
                >
                    <X size={20} />
                </button>

                <div className="text-center mb-6 flex-shrink-0">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Memoria Semanal</span>
                    <h3 className="text-xl font-semibold text-gray-800 mt-1">{getDateRangeOfWeek(selectedWeek.week, selectedWeek.year)}</h3>
                </div>

                <div className="flex justify-center mb-6 flex-shrink-0">
                     <div className="scale-100">
                        <PlantVisual count={selectedWeek.tasks.length} />
                     </div>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 space-y-2 mb-4">
                  {selectedWeek.tasks.map((t) => (
                    <div key={t.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                      <CheckCircle size={16} className="text-green-500 mt-1 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-gray-700 line-through opacity-80">{t.content}</p>
                        {t.subtasks && t.subtasks.length > 0 && (
                          <p className="text-[10px] text-gray-400 mt-1">{t.subtasks.filter(s => s.isDone).length} pasos completados</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="text-center space-y-4 pt-4 border-t border-gray-50 flex-shrink-0">
                    <p className="text-gray-600 leading-relaxed font-light text-sm italic">
                        "Lo que hiciste cuenta. Lo demás puede esperar."
                    </p>
                    <div className="text-xs text-gray-400">
                        {selectedWeek.tasks.length} tareas completadas.
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};