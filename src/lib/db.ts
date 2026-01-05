import Dexie, { type Table } from 'dexie';
import { Task, TaskStatus, DailyLog, EnergyLevel, Emotion, Horizon, SeedType, TaskWeight, Subtask, TaskReflection } from './types';

// Define the class for the database
export class ProductivityDB extends Dexie {
  tasks!: Table<Task, number>;
  daily_logs!: Table<DailyLog, number>;

  constructor() {
    super('ConsciousFocusDB');
    (this as any).version(1).stores({
      tasks: '++id, content, horizon, status, createdAt',
      daily_logs: '++id, date, energy'
    });
  }
}

export const db = new ProductivityDB();

// Helper to add a task
export const addTask = async (content: string, horizon: 'today' | 'week' | 'later') => {
  const status = horizon === 'today' ? 'pending' : 'inbox';
  
  await db.tasks.add({
    content,
    horizon,
    status,
    subtasks: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
};

export const updateTaskStatus = async (id: number, status: TaskStatus) => {
  await db.tasks.update(id, { 
    status, 
    updatedAt: Date.now() 
  });
};

// Generic update for content and subtasks
export const updateTaskFull = async (id: number, updates: Partial<Task>) => {
  await db.tasks.update(id, {
    ...updates,
    updatedAt: Date.now()
  });
};

export const updateTaskContent = async (id: number, content: string) => {
  await db.tasks.update(id, {
    content,
    updatedAt: Date.now()
  });
};

export const moveTaskHorizon = async (id: number, newHorizon: Horizon) => {
  const status = newHorizon === 'today' ? 'pending' : 'inbox';
  await db.tasks.update(id, {
    horizon: newHorizon,
    status: status,
    updatedAt: Date.now()
  });
};

export const updateTaskWeight = async (id: number, weight: TaskWeight) => {
  await db.tasks.update(id, {
    weight,
    updatedAt: Date.now()
  });
};

export const updateTaskReflection = async (id: number, reflection: TaskReflection) => {
  await db.tasks.update(id, {
    reflection,
    updatedAt: Date.now()
  });
};

export const updateTaskReminder = async (id: number, reminderTime: string) => {
  await db.tasks.update(id, {
    reminderTime,
    updatedAt: Date.now()
  });
};

export const deleteTask = async (id: number) => {
  await db.tasks.delete(id);
};

export const logDailyCheckIn = async (energy: EnergyLevel, emotion: Emotion, seedType: SeedType) => {
  const date = new Date().toISOString().split('T')[0];
  
  // Check if exists to avoid duplicates
  const existing = await db.daily_logs.where('date').equals(date).first();
  
  if (existing && existing.id) {
    await db.daily_logs.update(existing.id, { energy, emotion, seedType });
  } else {
    await db.daily_logs.add({
      date,
      energy,
      emotion,
      seedType,
      createdAt: Date.now()
    });
  }
};