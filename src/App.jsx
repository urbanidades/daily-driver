import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { useAuth } from './context/AuthContext';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import CalendarView from './components/CalendarView';
import DayView from './components/DayView';
import LoginPage from './components/LoginPage';
import TaskWorkspace from './components/TaskWorkspace';
import './index.css';
import './App.css';

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
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
