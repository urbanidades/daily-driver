import React, { useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { 
  formatMonthYear, 
  getCalendarGrid, 
  getWeekdayNames, 
  isToday, 
  formatDateKey,
  formatDateDisplay
} from '../utils/dateUtils';
import { Eye, EyeOff, Plus, Briefcase, Home, ChevronLeft, ChevronRight, MoreHorizontal, Trash2 } from 'lucide-react';
import './Dashboard.css';

// Project type colors for calendar
const PROJECT_COLORS = [
  '#7c3aed', // purple
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#8b5cf6', // violet
];

function Dashboard() {
  const { 
    state, 
    addProject, 
    updateProject,
    deleteProject,
    selectProject, 
    setSelectedDate,
    getProjectTasks 
  } = useApp();
  const navigate = useNavigate();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectType, setNewProjectType] = useState('personal');
  const [menuOpenId, setMenuOpenId] = useState(null);
  
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  const today = formatDateDisplay(new Date());
  
  // Group projects by type
  const workProjects = state.projects.filter(p => p.type === 'work');
  const personalProjects = state.projects.filter(p => p.type === 'personal' || !p.type);
  
  // Get visible projects
  const visibleProjects = state.projects.filter(p => p.visible !== false);
  
  // Assign colors to projects
  const projectColorMap = useMemo(() => {
    const map = {};
    state.projects.forEach((project, index) => {
      map[project.id] = PROJECT_COLORS[index % PROJECT_COLORS.length];
    });
    return map;
  }, [state.projects]);
  
  // Get all tasks from visible projects for calendar
  const getAllTasksForDay = (date) => {
    const dateKey = formatDateKey(date);
    const allTasks = [];
    
    visibleProjects.forEach(project => {
      const projectTasks = getProjectTasks(project.id);
      const dayTasks = projectTasks[dateKey] || [];
      dayTasks.forEach(task => {
        allTasks.push({
          ...task,
          projectName: project.name,
          projectColor: projectColorMap[project.id]
        });
      });
    });
    
    return allTasks;
  };
  
  // Generate calendar grid
  const calendarGrid = useMemo(() => {
    return getCalendarGrid(currentYear, currentMonth);
  }, [currentYear, currentMonth]);
  
  const weekdays = getWeekdayNames();
  
  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };
  
  const handleNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };
  
  const handleToday = () => {
    setCurrentDate(new Date());
  };
  
  const handleDayClick = (date, projectId) => {
    if (projectId) {
      selectProject(projectId);
      setSelectedDate(date);
      navigate(`/project/${projectId}/day/${formatDateKey(date)}`);
    }
  };
  
  const handleProjectClick = (projectId) => {
    selectProject(projectId);
    navigate(`/project/${projectId}`);
  };
  
  const toggleVisibility = (e, projectId) => {
    e.stopPropagation();
    const project = state.projects.find(p => p.id === projectId);
    updateProject(projectId, { visible: project?.visible === false ? true : false });
  };
  
  const changeProjectType = (e, projectId, newType) => {
    e.stopPropagation();
    updateProject(projectId, { type: newType });
    setMenuOpenId(null);
  };
  
  const handleCreateProject = (e) => {
    e.preventDefault();
    if (newProjectName.trim()) {
      addProject(newProjectName.trim(), newProjectType);
      setNewProjectName('');
      setNewProjectType('personal');
      setShowCreateModal(false);
    }
  };
  
  const handleDeleteProject = (e, projectId) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this project? All tasks will be lost.')) {
      deleteProject(projectId);
    }
    setMenuOpenId(null);
  };
  
  const handleMenuClick = (e, projectId) => {
    e.stopPropagation();
    setMenuOpenId(menuOpenId === projectId ? null : projectId);
  };

  // Drag and drop handlers
  const [draggedProject, setDraggedProject] = useState(null);
  const [dragOverSection, setDragOverSection] = useState(null);

  // Refs for touch drag detection
  const workSectionRef = useRef(null);
  const personalSectionRef = useRef(null);
  const touchDragRef = useRef({ project: null, startY: 0 });

  const handleDragStart = (e, project) => {
    setDraggedProject(project);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', project.id);
    // Make the dragged item semi-transparent
    setTimeout(() => {
      e.target.style.opacity = '0.5';
    }, 0);
  };

  const handleDragEnd = (e) => {
    e.target.style.opacity = '1';
    setDraggedProject(null);
    setDragOverSection(null);
  };

  const handleDragOver = (e, sectionType) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverSection(sectionType);
  };

  const handleDragLeave = () => {
    setDragOverSection(null);
  };

  const handleDrop = (e, targetType) => {
    e.preventDefault();
    if (draggedProject && draggedProject.type !== targetType) {
      updateProject(draggedProject.id, { type: targetType });
    }
    setDraggedProject(null);
    setDragOverSection(null);
  };

  // Touch handlers for mobile drag-and-drop
  const handleTouchStart = (e, project) => {
    touchDragRef.current = { project, startY: e.touches[0].clientY };
  };

  const handleTouchMove = (e) => {
    if (!touchDragRef.current.project) return;
    
    const touchY = e.touches[0].clientY;
    const workRect = workSectionRef.current?.getBoundingClientRect();
    const personalRect = personalSectionRef.current?.getBoundingClientRect();

    if (workRect && touchY >= workRect.top && touchY <= workRect.bottom) {
      setDragOverSection('work');
    } else if (personalRect && touchY >= personalRect.top && touchY <= personalRect.bottom) {
      setDragOverSection('personal');
    } else {
      setDragOverSection(null);
    }
  };

  const handleTouchEnd = () => {
    const project = touchDragRef.current.project;
    if (project && dragOverSection && project.type !== dragOverSection) {
      updateProject(project.id, { type: dragOverSection });
    }
    touchDragRef.current = { project: null, startY: 0 };
    setDragOverSection(null);
  };

  const renderProjectItem = (project) => (
    <div 
      key={project.id}
      className={`sidebar-project-item ${project.visible === false ? 'hidden-project' : ''}`}
      onClick={() => handleProjectClick(project.id)}
      draggable
      onDragStart={(e) => handleDragStart(e, project)}
      onDragEnd={handleDragEnd}
      onTouchStart={(e) => handleTouchStart(e, project)}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div 
        className="project-color-dot" 
        style={{ backgroundColor: projectColorMap[project.id] }}
      />
      <span className="project-name">{project.name}</span>
      <div className="project-actions">
        <button 
          className="visibility-toggle"
          onClick={(e) => toggleVisibility(e, project.id)}
          title={project.visible === false ? 'Show in calendar' : 'Hide from calendar'}
        >
          {project.visible === false ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
        <div className="project-menu-wrapper">
          <button 
            className="project-menu-btn"
            onClick={(e) => handleMenuClick(e, project.id)}
          >
            <MoreHorizontal size={14} />
          </button>
          {menuOpenId === project.id && (
            <div className="project-dropdown-menu">
              {project.type !== 'work' && (
                <button onClick={(e) => changeProjectType(e, project.id, 'work')}>
                  <Briefcase size={14} /> Move to Work
                </button>
              )}
              {project.type !== 'personal' && project.type && (
                <button onClick={(e) => changeProjectType(e, project.id, 'personal')}>
                  <Home size={14} /> Move to Personal
                </button>
              )}
              <button 
                className="delete-option"
                onClick={(e) => handleDeleteProject(e, project.id)}
              >
                <Trash2 size={14} /> Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="dashboard">
      {/* Left Sidebar */}
      <aside className="dashboard-sidebar">
        <div className="sidebar-header">
          <h2>Projects</h2>
          <button 
            className="add-project-btn"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus size={18} />
          </button>
        </div>
        
        {/* Work Section */}
        <div 
          ref={workSectionRef}
          className={`sidebar-section ${dragOverSection === 'work' ? 'drag-over' : ''}`}
          onDragOver={(e) => handleDragOver(e, 'work')}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, 'work')}
        >
          <div className="sidebar-section-header">
            <Briefcase size={16} />
            <span>Work</span>
            <span className="project-count">{workProjects.length}</span>
          </div>
          <div className="sidebar-project-list">
            {workProjects.length === 0 ? (
              <p className="empty-section">{dragOverSection === 'work' ? 'Drop here' : 'No work projects'}</p>
            ) : (
              workProjects.map(renderProjectItem)
            )}
          </div>
        </div>
        
        {/* Personal Section */}
        <div 
          ref={personalSectionRef}
          className={`sidebar-section ${dragOverSection === 'personal' ? 'drag-over' : ''}`}
          onDragOver={(e) => handleDragOver(e, 'personal')}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, 'personal')}
        >
          <div className="sidebar-section-header">
            <Home size={16} />
            <span>Personal</span>
            <span className="project-count">{personalProjects.length}</span>
          </div>
          <div className="sidebar-project-list">
            {personalProjects.length === 0 ? (
              <p className="empty-section">{dragOverSection === 'personal' ? 'Drop here' : 'No personal projects'}</p>
            ) : (
              personalProjects.map(renderProjectItem)
            )}
          </div>
        </div>
      </aside>
      
      {/* Main Calendar Area */}
      <main className="dashboard-main">
        <div className="dashboard-header">
          <div className="dashboard-title">
            <h1>Dashboard</h1>
            <p className="dashboard-date">
              <span className="material-symbols-outlined">calendar_today</span>
              Today is {today}
            </p>
          </div>
        </div>
        
        <div className="dashboard-calendar">
          <div className="calendar-header">
            <div className="calendar-nav">
              <button onClick={handlePrevMonth} className="calendar-nav-btn">
                <ChevronLeft size={20} />
              </button>
              <h2 className="calendar-month-title">{formatMonthYear(currentDate)}</h2>
              <button onClick={handleNextMonth} className="calendar-nav-btn">
                <ChevronRight size={20} />
              </button>
            </div>
            <button className="calendar-today-btn" onClick={handleToday}>
              Today
            </button>
          </div>
          
          <div className="calendar-grid">
            {weekdays.map(day => (
              <div key={day} className="calendar-weekday">{day}</div>
            ))}
            
            {calendarGrid.flat().map((dayObj, index) => {
              const date = dayObj.date;
              const isCurrentMonth = dayObj.isCurrentMonth;
              const isTodayDate = isToday(date);
              const tasks = getAllTasksForDay(date);
              
              return (
                <div
                  key={index}
                  className={`calendar-day ${!isCurrentMonth ? 'other-month' : ''} ${isTodayDate ? 'today' : ''}`}
                >
                  <span className="calendar-day-number">{date.getDate()}</span>
                  <div className="calendar-day-tasks">
                    {tasks.slice(0, 3).map((task, taskIndex) => (
                      <div
                        key={task.id || taskIndex}
                        className="calendar-task-chip"
                        style={{ backgroundColor: task.projectColor }}
                        onClick={() => handleDayClick(date, task.projectId)}
                        title={`${task.title} (${task.projectName})`}
                      >
                        {task.title}
                      </div>
                    ))}
                    {tasks.length > 3 && (
                      <span className="calendar-more-tasks">+{tasks.length - 3} more</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
      
      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="modal-backdrop" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content create-project-modal" onClick={(e) => e.stopPropagation()}>
            <h2>New Project</h2>
            <form className="create-project-form" onSubmit={handleCreateProject}>
              <input
                type="text"
                className="create-project-input"
                placeholder="Project name..."
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                autoFocus
              />
              <div className="type-selector">
                <button
                  type="button"
                  className={`type-btn ${newProjectType === 'work' ? 'active' : ''}`}
                  onClick={() => setNewProjectType('work')}
                >
                  <Briefcase size={16} /> Work
                </button>
                <button
                  type="button"
                  className={`type-btn ${newProjectType === 'personal' ? 'active' : ''}`}
                  onClick={() => setNewProjectType('personal')}
                >
                  <Home size={16} /> Personal
                </button>
              </div>
              <div className="create-project-actions">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={!newProjectName.trim()}
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
