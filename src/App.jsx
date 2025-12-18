import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Header from './components/Header';
import ProjectList from './components/ProjectList';
import CalendarView from './components/CalendarView';
import DayView from './components/DayView';
import TaskDetailsPanel from './components/TaskDetailsPanel';
import './index.css';
import './App.css';

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <div className="app">
          <Header />
          <div className="app-content">
            <main className="main-content">
              <Routes>
                <Route path="/" element={<ProjectList />} />
                <Route path="/project/:projectId" element={<CalendarView />} />
                <Route path="/project/:projectId/day/:dateKey" element={<DayView />} />
              </Routes>
            </main>
            <TaskDetailsPanel />
          </div>
        </div>
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
