export type Horizon = 'today' | 'week' | 'later';
export type TaskStatus = 'inbox' | 'pending' | 'in_progress' | 'done';
export type EnergyLevel = 'high' | 'medium' | 'low';
export type Emotion = 'stressed' | 'tired' | 'neutral' | 'calm' | 'excited' | 'sad';
export type SeedType = 'tulip' | 'rose' | 'sunflower' | 'orchid';
export type TaskWeight = 'light' | 'medium' | 'heavy';
export type TaskReflection = 'fluid' | 'heavy' | 'satisfying' | 'neutral';

export interface Subtask {
  id: string;
  content: string;
  isDone: boolean;
}

export interface Task {
  id?: number;
  content: string;
  horizon: Horizon;
  status: TaskStatus;
  weight?: TaskWeight;
  reminderTime?: string; // Format "HH:MM"
  subtasks?: Subtask[];
  reflection?: TaskReflection; // New field for post-focus sentiment
  createdAt: number;
  updatedAt: number;
}

export interface DailyLog {
  id?: number;
  date: string; // ISO string YYYY-MM-DD for easy lookup
  energy: EnergyLevel;
  emotion: Emotion;
  seedType?: SeedType; // Optional for backward compatibility
  createdAt: number;
}

export interface WipConfig {
  limit: number;
  message: string;
}