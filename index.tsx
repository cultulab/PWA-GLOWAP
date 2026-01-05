import React, { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { useAppStore } from './src/lib/store';
import { BottomNav } from './src/components/BottomNav';
import { BrainDump } from './src/features/brain-dump/BrainDump';
import { Board } from './src/features/board/Board';
import { FocusSession } from './src/features/focus/FocusSession';
import { Dashboard } from './src/features/dashboard/Dashboard';
import { Settings } from './src/features/settings/Settings';
import { db } from './src/lib/db';

const App = () => {
  const { currentTab, isFocusMode } = useAppStore();

  // Simple Notification Check on App Mount
  useEffect(() => {
    const checkNotification = async () => {
      if (Notification.permission === 'granted') {
        const todayStr = new Date().toISOString().split('T')[0];
        // Check if we have pending tasks for today but haven't started any
        const todayTasks = await db.tasks.where('horizon').equals('today').toArray();
        const pending = todayTasks.filter(t => t.status === 'pending');
        const inProgress = todayTasks.filter(t => t.status === 'in_progress');
        const done = todayTasks.filter(t => t.status === 'done');

        // Condition: It's past 10am, we have pending tasks, none done, none in progress
        const hour = new Date().getHours();
        if (hour >= 10 && pending.length > 0 && inProgress.length === 0 && done.length === 0) {
           // We use a simple localStorage flag to avoid spamming every refresh
           const lastNotif = localStorage.getItem('cf_last_notif_date');
           if (lastNotif !== todayStr) {
              new Notification("Empieza pequeño 🌱", {
                body: "Sabemos que empezar cuesta. ¿Qué tal si lo intentas solo 5 minutos?",
                icon: '/vite.svg'
              });
              localStorage.setItem('cf_last_notif_date', todayStr);
           }
        }
      }
    };

    checkNotification();
  }, []);

  const renderContent = () => {
    switch (currentTab) {
      case 'dashboard': return <Dashboard />;
      case 'brain_dump': return <BrainDump />;
      case 'board': return <Board />;
      case 'settings': return <Settings />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20 relative font-sans text-gray-900 selection:bg-blue-100">
      {/* Full Screen Focus Overlay */}
      {isFocusMode && <FocusSession />}

      <main className="h-full">
        {renderContent()}
      </main>
      
      {/* Hide nav in focus mode? Or keep simple? Let's hide to enforce focus */}
      {!isFocusMode && <BottomNav />}
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);