import React from 'react';
import { Circle, Sprout, Leaf, Flower, Sun, Heart, Sparkles, Gem } from 'lucide-react';
import { SeedType } from './types';

export type PlantStage = 'seed' | 'sprout' | 'sapling' | 'blooming' | 'full';

interface PlantConfig {
  stage: PlantStage;
  label: string;
  message: string;
  icon: React.ReactNode;
  color: string;
}

export interface SeedDefinition {
  id: SeedType;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

export const SEED_OPTIONS: SeedDefinition[] = [
  {
    id: 'tulip',
    label: 'Tulipán',
    description: 'Resiliencia elegante. Florezco con fuerza después del frío.',
    icon: <Flower size={32} />, // Generic flower representing Tulip shape
    color: 'bg-pink-50 text-pink-600 border-pink-200'
  },
  {
    id: 'rose',
    label: 'Rosa',
    description: 'Pasión y defensa. Tengo espinas para protegerme y belleza para dar.',
    icon: <Heart size={32} />, // Heart representing the passion/rose core
    color: 'bg-rose-50 text-rose-600 border-rose-200'
  },
  {
    id: 'sunflower',
    label: 'Girasol',
    description: 'Búsqueda de luz. Siempre miro hacia lo positivo y brillo sola.',
    icon: <Sun size={32} />,
    color: 'bg-yellow-50 text-yellow-600 border-yellow-200'
  },
  {
    id: 'orchid',
    label: 'Orquídea',
    description: 'Paciencia y detalle. Tomo mi tiempo para mostrar mi complejidad única.',
    icon: <Gem size={32} />, // Gem representing the rareness/beauty
    color: 'bg-purple-50 text-purple-600 border-purple-200'
  }
];

// Helper to get the icon based on seed type and stage
const getIconForStage = (stage: PlantStage, seedType?: SeedType) => {
  const type = seedType || 'tulip'; // Default fallback

  switch (stage) {
    case 'seed':
      return <Circle size={24} className="fill-stone-400 text-stone-500" />;
    case 'sprout':
      return <Sprout size={32} strokeWidth={1.5} className="text-emerald-500" />;
    case 'sapling':
      return <Leaf size={40} strokeWidth={1.5} className="text-green-500" />;
    case 'blooming':
    case 'full':
      // Here represents the "Identity" of the plant revealed
      switch (type) {
        case 'tulip': return <Flower size={48} strokeWidth={1.5} className="text-pink-500" />;
        case 'rose': return <Flower size={48} strokeWidth={1.5} className="text-rose-600 fill-rose-100" />;
        case 'sunflower': return <Sun size={56} strokeWidth={1.5} className="text-yellow-500 fill-yellow-100" />;
        case 'orchid': return <Sparkles size={48} strokeWidth={1.5} className="text-purple-600" />;
        default: return <Flower size={48} strokeWidth={1.5} className="text-teal-500" />;
      }
    default:
      return <Circle size={24} />;
  }
};

export const getPlantStage = (taskCount: number, seedType?: SeedType): PlantConfig => {
  if (taskCount === 0) {
    return {
      stage: 'seed',
      label: 'Semilla',
      message: 'Todo empieza pequeño. No hay prisa.',
      icon: getIconForStage('seed', seedType),
      color: 'bg-stone-50 border-stone-100 text-stone-600'
    };
  }
  if (taskCount <= 3) {
    return {
      stage: 'sprout',
      label: 'Brote',
      message: 'La intención empieza a asomar.',
      icon: getIconForStage('sprout', seedType),
      color: 'bg-emerald-50 border-emerald-100 text-emerald-700'
    };
  }
  if (taskCount <= 8) {
    return {
      stage: 'sapling',
      label: 'Tallo',
      message: 'Echando raíces, buscando luz.',
      icon: getIconForStage('sapling', seedType),
      color: 'bg-green-50 border-green-100 text-green-700'
    };
  }
  if (taskCount <= 14) {
    return {
      stage: 'blooming',
      label: 'Creciendo',
      message: 'Se nota el cuidado que le diste esta semana.',
      icon: getIconForStage('blooming', seedType),
      color: 'bg-teal-50 border-teal-100 text-teal-700'
    };
  }
  return {
    stage: 'full',
    label: 'Plenitud',
    message: 'Una semana llena de vida.',
    icon: getIconForStage('full', seedType),
    color: 'bg-amber-50 border-amber-100 text-amber-700'
  };
};

export const PlantVisual = ({ 
  count, 
  seedType, 
  customName, 
  isSmall = false 
}: { 
  count: number, 
  seedType?: SeedType, 
  customName?: string, 
  isSmall?: boolean 
}) => {
  const config = getPlantStage(count, seedType);
  
  // Use custom name if provided and not in 'seed' stage (seeds are nameless until they sprout)
  const displayLabel = (customName && config.stage !== 'seed') ? customName : config.label;

  if (isSmall) {
    return <div title={displayLabel}>{config.icon}</div>;
  }

  return (
    <div className={`w-full p-6 rounded-3xl border ${config.color} transition-all duration-700 ease-out flex flex-col items-center justify-center gap-4 text-center shadow-sm`}>
      <div className="p-4 bg-white/60 rounded-full shadow-sm animate-in zoom-in duration-1000">
        {config.icon}
      </div>
      <div>
        <h3 className="text-lg font-medium opacity-90">{displayLabel}</h3>
        <p className="text-sm opacity-70 font-light mt-1 max-w-xs mx-auto leading-relaxed">
          {config.message}
        </p>
      </div>
    </div>
  );
};