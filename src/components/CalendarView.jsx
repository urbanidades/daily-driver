import React, { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { 
  formatMonthYear, 
  getCalendarGrid, 
  getWeekdayNames, 
  isToday, 
  formatDateKey 
} from '../utils/dateUtils';
import './CalendarView.css';

function CalendarView() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { state, getProjectTasks, selectProject, setSelectedDate } = useApp();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  
  const project = state.projects.find(p => p.id === projectId);
  const projectTasks = getProjectTasks(projectId);
  
  // Ensure project is selected
  React.useEffect(() => {
    if (projectId && state.selectedProject !== projectId) {
      selectProject(projectId);
    }
  }, [projectId, state.selectedProject, selectProject]);
  
  // Generate calendar grid
  const calendarGrid = useMemo(() => {
    return getCalendarGrid(currentYear, currentMonth);
  }, [currentYear, currentMonth]);
  
  const weekdays = getWeekdayNames();
  
  // Calculate stats
  const stats = useMemo(() => {
    let ongoing = 0;
    let done = 0;
    
    Object.values(projectTasks).forEach(dateTasks => {
      dateTasks.forEach(task => {
        if (task.status === 'ongoing') ongoing++;
        if (task.status === 'done') done++;
      });
    });
    
    return { ongoing, done };
  }, [projectTasks]);
  
  // Get tasks for a specific day
  const getTasksForDay = (date) => {
    const dateKey = formatDateKey(date);
    return projectTasks[dateKey] || [];
  };
  
  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };
  
  const handleNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };
  
  const handleToday = () => {
    setCurrentDate(new Date());
  };
  
  const handleDayClick = (date) => {
    setSelectedDate(date);
    navigate(`/project/${projectId}/day/${formatDateKey(date)}`);
  };
  
  if (!project) {
    return (
      <div className="empty-state">
        <span className="material-symbols-outlined empty-state-icon">folder_off</span>
        <p className="empty-state-title">Project not found</p>
        <p className="empty-state-description">This project may have been deleted.</p>
      </div>
    );
  }
  
  return (
    <div className="calendar-view container">
      <div className="calendar-header">
        <div className="calendar-title-section">
          <h2 className="calendar-title">{formatMonthYear(currentDate)}</h2>
          <div className="calendar-nav">
            <button className="calendar-nav-btn" onClick={handlePrevMonth}>
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
            <button className="calendar-today-btn" onClick={handleToday}>
              Today
            </button>
            <button className="calendar-nav-btn" onClick={handleNextMonth}>
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
        </div>
        
        <div className="calendar-stats">
          <div className="calendar-stat">
            <div className="calendar-stat-dot ongoing"></div>
            <div className="calendar-stat-info">
              <span className="calendar-stat-label">Ongoing</span>
              <span className="calendar-stat-value">{stats.ongoing}</span>
            </div>
          </div>
          <div className="calendar-stat">
            <div className="calendar-stat-dot done"></div>
            <div className="calendar-stat-info">
              <span className="calendar-stat-label">Done</span>
              <span className="calendar-stat-value">{stats.done}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="calendar-grid-container">
        <div className="calendar-weekdays">
          {weekdays.map(day => (
            <div key={day} className="calendar-weekday">{day}</div>
          ))}
        </div>
        
        <div className="calendar-days">
          {calendarGrid.map((week, weekIndex) => (
            week.map((dayInfo, dayIndex) => {
              const tasks = getTasksForDay(dayInfo.date);
              const dayIsToday = isToday(dayInfo.date);
              
              return (
                <div
                  key={`${weekIndex}-${dayIndex}`}
                  className={`calendar-day ${!dayInfo.isCurrentMonth ? 'other-month' : ''} ${dayIsToday ? 'today' : ''}`}
                  onClick={() => handleDayClick(dayInfo.date)}
                >
                  <span className="calendar-day-number">{dayInfo.day}</span>
                  
                  {dayInfo.isCurrentMonth && (
                    <button 
                      className="calendar-day-add"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDayClick(dayInfo.date);
                      }}
                    >
                      <span className="material-symbols-outlined">add</span>
                    </button>
                  )}
                  
                  {tasks.length > 0 && (
                    <div className="calendar-day-tasks">
                      {tasks.slice(0, 5).map(task => (
                        <div 
                          key={task.id} 
                          className={`calendar-day-task-dot ${task.status}`}
                        ></div>
                      ))}
                      {tasks.length > 5 && (
                        <span style={{ fontSize: '0.625rem', color: 'var(--text-muted)' }}>
                          +{tasks.length - 5}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          ))}
        </div>
      </div>
    </div>
  );
}

export default CalendarView;
