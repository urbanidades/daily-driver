import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { useAuth } from './context/AuthContext';
import { Keyboard, KeyboardResize } from '@capacitor/keyboard';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import CalendarView from './components/CalendarView';
import DayView from './components/DayView';
import LoginPage from './components/LoginPage';
import TaskWorkspace from './components/TaskWorkspace';
import Settings from './components/Settings';
import BottomNav from './components/BottomNav';
import './index.css';
import './App.css';

// Sync status bar with current theme
const syncStatusBar = () => {
  if (!Capacitor.isNativePlatform()) return;
  
  const isDark = document.documentElement.classList.contains('dark');
  // Dark theme = light text (Style.Dark), Light theme = dark text (Style.Light)
  StatusBar.setStyle({ style: isDark ? Style.Dark : Style.Light });
  
  // Android only: set background color
  if (Capacitor.getPlatform() === 'android') {
    StatusBar.setBackgroundColor({ color: isDark ? '#1a1a2e' : '#ffffff' });
  }
};

function AppContent() {
  const { user } = useAuth();
  
  if (!user) {
    return <LoginPage />;
  }
  
  return (
    <div className="app">
      <Header />
      <div className="app-content">
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/project/:projectId" element={<CalendarView />} />
            <Route path="/project/:projectId/day/:dateKey" element={<DayView />} />
            <Route path="/task/:taskId" element={<TaskWorkspace />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
      <BottomNav />
    </div>
  );
}

function App() {
  React.useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      Keyboard.setResizeMode({ mode: KeyboardResize.Native });
      Keyboard.setAccessoryBarVisible({ isVisible: false });
      
      // Initial status bar sync
      syncStatusBar();
      
      // Watch for theme changes via MutationObserver
      const observer = new MutationObserver(() => {
        syncStatusBar();
      });
      observer.observe(document.documentElement, { 
        attributes: true, 
        attributeFilter: ['class'] 
      });
      
      return () => observer.disconnect();
    }
  }, []);

  return (
    <AppProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
