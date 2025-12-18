import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { 
  formatDateDisplay, 
  formatDateKey,
  getNextDay, 
  getPreviousDay,
  isToday 
} from '../utils/dateUtils';
import AddTaskModal from './AddTaskModal';
import './DayView.css';

function DayView() {
  const { projectId, dateKey } = useParams();
  const navigate = useNavigate();
  const { 
    state, 
    getTasksForDate, 
    selectTask, 
    setSelectedDate,
    selectProject 
  } = useApp();
  
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Parse the date from URL
  const currentDate = dateKey ? new Date(dateKey + 'T00:00:00') : new Date();
  
  // Ensure project is selected
  React.useEffect(() => {
    if (projectId && state.selectedProject !== projectId) {
      selectProject(projectId);
    }
    setSelectedDate(currentDate);
  }, [projectId, dateKey]);
  
  const project = state.projects.find(p => p.id === projectId);
  const tasks = getTasksForDate(projectId, currentDate);
  
  const handlePrevDay = () => {
    const prevDay = getPreviousDay(currentDate);
    navigate(`/project/${projectId}/day/${formatDateKey(prevDay)}`);
  };
  
  const handleNextDay = () => {
    const nextDay = getNextDay(currentDate);
    navigate(`/project/${projectId}/day/${formatDateKey(nextDay)}`);
  };
  
  const handleTaskClick = (task) => {
    selectTask(task);
  };
  
  const getDayLabel = () => {
    if (isToday(currentDate)) return 'Today';
    const tomorrow = getNextDay(new Date());
    if (formatDateKey(currentDate) === formatDateKey(tomorrow)) return 'Tomorrow';
    const yesterday = getPreviousDay(new Date());
    if (formatDateKey(currentDate) === formatDateKey(yesterday)) return 'Yesterday';
    return currentDate.toLocaleDateString('en-US', { weekday: 'long' });
  };
  
  if (!project) {
    return (
      <div className="empty-state">
        <span className="material-symbols-outlined empty-state-icon">folder_off</span>
        <p className="empty-state-title">Project not found</p>
      </div>
    );
  }
  
  return (
    <div className="day-view container">
      {/* Date Navigation */}
      <div className="day-nav">
        <div className="day-nav-controls">
          <button className="day-nav-btn" onClick={handlePrevDay}>
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
          <div className="day-nav-date">
            <span className="day-nav-label">{getDayLabel()}</span>
            <span className="day-nav-value">{formatDateDisplay(currentDate)}</span>
          </div>
          <button className="day-nav-btn" onClick={handleNextDay}>
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
        </div>
        
        <button className="day-add-btn" onClick={() => setShowAddModal(true)}>
          <span className="material-symbols-outlined">add</span>
          <span>Add Task</span>
        </button>
      </div>
      
      {/* Task List */}
      <div className="task-list">
        {tasks.length === 0 ? (
          <div className="task-list-empty">
            <span className="material-symbols-outlined task-list-empty-icon">
              checklist
            </span>
            <p className="task-list-empty-title">No tasks for this day</p>
            <p className="task-list-empty-text">
              Click "Add Task" to create your first task
            </p>
          </div>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              className={`task-item ${task.status} ${state.selectedTask?.id === task.id ? 'selected' : ''}`}
              onClick={() => handleTaskClick(task)}
            >
              <div className="task-item-content">
                <div className="task-item-status">
                  <div className={`task-item-status-dot ${task.status}`}></div>
                </div>
                <div className="task-item-info">
                  <h3 className="task-item-title">{task.title}</h3>
                  <div className="task-item-meta">
                    {task.estimatedDays > 0 && (
                      <span className="task-item-badge">
                        {task.estimatedDays} day{task.estimatedDays !== 1 ? 's' : ''}
                      </span>
                    )}
                    {task.status === 'canceled' && (
                      <span className="task-item-badge">Canceled</span>
                    )}
                  </div>
                </div>
              </div>
              <button className="task-item-menu">
                <span className="material-symbols-outlined">more_horiz</span>
              </button>
            </div>
          ))
        )}
      </div>
      
      {/* Add Task Modal */}
      {showAddModal && (
        <AddTaskModal
          projectId={projectId}
          date={currentDate}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  );
}

export default DayView;
