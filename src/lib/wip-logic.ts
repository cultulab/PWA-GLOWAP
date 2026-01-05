import { Emotion, EnergyLevel, WipConfig } from './types';

export const getWipConfig = (emotion: Emotion, energy: EnergyLevel): WipConfig => {
  // TABLE LOGIC IMPLEMENTATION
  
  // 1. STRESSED
  if (emotion === 'stressed') {
    if (energy === 'low') return { limit: 0, message: "Pausa técnica. Tu sistema nervioso necesita reiniciarse." };
    return { limit: 1, message: "Con estrés, haz solo una cosa a la vez para recuperar el control." };
  }

  // 2. TIRED
  if (emotion === 'tired') {
    if (energy === 'low') return { limit: 0, message: "Descanso restaurativo. No fuerces la máquina hoy." };
    if (energy === 'medium') return { limit: 2, message: "Buen día para tareas mecánicas o rutinarias." };
    return { limit: 1, message: "Evita decisiones importantes. Mantén el ritmo suave." };
  }

  // 3. NEUTRAL
  if (emotion === 'neutral') {
    if (energy === 'low') return { limit: 1, message: "Elige tareas simples para generar inercia poco a poco." };
    if (energy === 'medium') return { limit: 3, message: "Flujo estándar. Puedes organizar varias cosas hoy." };
    return { limit: 1, message: "Energía ideal para una sola tarea de alto valor (Deep Work)." };
  }

  // 4. CALM
  if (emotion === 'calm') {
    if (energy === 'low') return { limit: 1, message: "Día perfecto para reflexión o planificación tranquila." };
    if (energy === 'medium') return { limit: 2, message: "Ejecución creativa fluida. Disfruta el proceso." };
    return { limit: 1, message: "Estado óptimo. Aprovecha para trabajo profundo sin distracciones." };
  }

  // 5. EXCITED
  if (emotion === 'excited') {
    if (energy === 'low') return { limit: 1, message: "Captura esas grandes ideas, pero no intentes ejecutarlas todas hoy." };
    if (energy === 'medium') return { limit: 2, message: "Buen momento para ideación y comunicación." };
    return { limit: 1, message: "Canaliza esa energía en una sola meta grande. Evita dispersarte." };
  }

  // 6. SAD
  if (emotion === 'sad') {
    if (energy === 'low') return { limit: 0, message: "Prioriza tu autocuidado y procesamiento emocional." };
    return { limit: 1, message: "Busca una pequeña victoria o tarea mecánica que te dé paz." };
  }

  // Fallback
  return { limit: 1, message: "Escucha a tu cuerpo y avanza paso a paso." };
};