import React from 'react';
import { useAppStore, Tab } from '../lib/store';
import { Home, Layers, Kanban, Settings } from 'lucide-react';

export const BottomNav = () => {
  const { currentTab, setTab } = useAppStore();

  const navItems: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Inicio', icon: <Home size={24} /> },
    { id: 'brain_dump', label: 'Vaciado', icon: <Layers size={24} /> },
    { id: 'board', label: 'Tablero', icon: <Kanban size={24} /> },
    { id: 'settings', label: 'Ajustes', icon: <Settings size={24} /> },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 border-t border-gray-100 dark:border-slate-700 pb-safe pt-2 px-6 h-20 flex justify-between items-start z-50 transition-colors duration-300">
      {navItems.map((item) => {
        const isActive = currentTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setTab(item.id)}
            className={`flex flex-col items-center gap-1 transition-all duration-300 ${
              isActive ? 'text-blue-600 dark:text-blue-400 transform -translate-y-1' : 'text-gray-400 dark:text-slate-500'
            }`}
          >
            <div className={`p-1 rounded-full ${isActive ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
             {item.icon}
            </div>
            <span className="text-[10px] font-medium">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};