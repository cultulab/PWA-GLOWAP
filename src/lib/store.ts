import { create } from 'zustand';

export type Tab = 'dashboard' | 'brain_dump' | 'board' | 'settings';
export type FocusExitReason = 'manual' | 'completed' | 'auto_pause' | null;

interface AppState {
  currentTab: Tab;
  isFocusMode: boolean; // Is the full screen focus overlay open?
  activeTaskId: number | null; // The ID of the task currently being worked on
  initialFocusSeconds: number | null; // Duration set by user
  focusExitReason: FocusExitReason; // Why did focus end?
  setTab: (tab: Tab) => void;
  enterFocusMode: (taskId: number, seconds?: number) => void;
  exitFocusMode: (reason?: FocusExitReason) => void;
  clearExitReason: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentTab: 'dashboard',
  isFocusMode: false,
  activeTaskId: null,
  initialFocusSeconds: null,
  focusExitReason: null,
  setTab: (tab) => set({ currentTab: tab }),
  enterFocusMode: (taskId, seconds) => set({ 
    isFocusMode: true, 
    activeTaskId: taskId,
    initialFocusSeconds: seconds || null,
    focusExitReason: null 
  }),
  exitFocusMode: (reason = 'manual') => set({ 
    isFocusMode: false, 
    activeTaskId: null, 
    initialFocusSeconds: null,
    focusExitReason: reason
  }),
  clearExitReason: () => set({ focusExitReason: null }),
}));