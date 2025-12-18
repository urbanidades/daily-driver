import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { getProjects, saveProjects, getTasks, saveTasks, getTheme, saveTheme } from '../utils/storage';
import { formatDateKey } from '../utils/dateUtils';

// Initial state
const initialState = {
  projects: [],
  tasks: {}, // { projectId: { "YYYY-MM-DD": [tasks] } }
  selectedProject: null,
  selectedDate: new Date(),
  selectedTask: null,
  theme: 'light',
  isLoading: true
};

// Action types
const ACTIONS = {
  INIT_DATA: 'INIT_DATA',
  SET_THEME: 'SET_THEME',
  ADD_PROJECT: 'ADD_PROJECT',
  UPDATE_PROJECT: 'UPDATE_PROJECT',
  DELETE_PROJECT: 'DELETE_PROJECT',
  SELECT_PROJECT: 'SELECT_PROJECT',
  SET_SELECTED_DATE: 'SET_SELECTED_DATE',
  ADD_TASK: 'ADD_TASK',
  UPDATE_TASK: 'UPDATE_TASK',
  DELETE_TASK: 'DELETE_TASK',
  SELECT_TASK: 'SELECT_TASK',
  COPY_TASK_TO_DATE: 'COPY_TASK_TO_DATE'
};

// Reducer
function appReducer(state, action) {
  switch (action.type) {
    case ACTIONS.INIT_DATA:
      return {
        ...state,
        projects: action.payload.projects,
        tasks: action.payload.tasks,
        theme: action.payload.theme,
        isLoading: false
      };
      
    case ACTIONS.SET_THEME:
      return { ...state, theme: action.payload };
      
    case ACTIONS.ADD_PROJECT: {
      const newProject = {
        id: uuidv4(),
        name: action.payload.name,
        createdAt: new Date().toISOString()
      };
      return {
        ...state,
        projects: [...state.projects, newProject]
      };
    }
    
    case ACTIONS.UPDATE_PROJECT:
      return {
        ...state,
        projects: state.projects.map(p =>
          p.id === action.payload.id ? { ...p, ...action.payload } : p
        )
      };
      
    case ACTIONS.DELETE_PROJECT: {
      const newTasks = { ...state.tasks };
      delete newTasks[action.payload];
      return {
        ...state,
        projects: state.projects.filter(p => p.id !== action.payload),
        tasks: newTasks,
        selectedProject: state.selectedProject === action.payload ? null : state.selectedProject
      };
    }
    
    case ACTIONS.SELECT_PROJECT:
      return { ...state, selectedProject: action.payload, selectedTask: null };
      
    case ACTIONS.SET_SELECTED_DATE:
      return { ...state, selectedDate: action.payload, selectedTask: null };
      
    case ACTIONS.ADD_TASK: {
      const { projectId, date, title, estimatedDays } = action.payload;
      const dateKey = formatDateKey(date);
      const newTask = {
        id: uuidv4(),
        projectId,
        date: dateKey,
        title,
        description: '',
        status: 'not_started',
        estimatedDays: estimatedDays || 1,
        createdAt: new Date().toISOString()
      };
      
      const projectTasks = state.tasks[projectId] || {};
      const dateTasks = projectTasks[dateKey] || [];
      
      return {
        ...state,
        tasks: {
          ...state.tasks,
          [projectId]: {
            ...projectTasks,
            [dateKey]: [...dateTasks, newTask]
          }
        }
      };
    }
    
    case ACTIONS.UPDATE_TASK: {
      const { projectId, taskId, updates } = action.payload;
      const projectTasks = state.tasks[projectId] || {};
      
      // Find which date the task is in
      let updatedProjectTasks = { ...projectTasks };
      let updatedSelectedTask = state.selectedTask;
      
      for (const dateKey of Object.keys(projectTasks)) {
        const dateTasks = projectTasks[dateKey];
        const taskIndex = dateTasks.findIndex(t => t.id === taskId);
        
        if (taskIndex !== -1) {
          const updatedTask = { ...dateTasks[taskIndex], ...updates };
          updatedProjectTasks[dateKey] = [
            ...dateTasks.slice(0, taskIndex),
            updatedTask,
            ...dateTasks.slice(taskIndex + 1)
          ];
          
          if (state.selectedTask?.id === taskId) {
            updatedSelectedTask = updatedTask;
          }
          break;
        }
      }
      
      return {
        ...state,
        tasks: {
          ...state.tasks,
          [projectId]: updatedProjectTasks
        },
        selectedTask: updatedSelectedTask
      };
    }
    
    case ACTIONS.DELETE_TASK: {
      const { projectId, taskId, dateKey } = action.payload;
      const projectTasks = state.tasks[projectId] || {};
      const dateTasks = projectTasks[dateKey] || [];
      
      return {
        ...state,
        tasks: {
          ...state.tasks,
          [projectId]: {
            ...projectTasks,
            [dateKey]: dateTasks.filter(t => t.id !== taskId)
          }
        },
        selectedTask: state.selectedTask?.id === taskId ? null : state.selectedTask
      };
    }
    
    case ACTIONS.SELECT_TASK:
      return { ...state, selectedTask: action.payload };
      
    case ACTIONS.COPY_TASK_TO_DATE: {
      const { task, targetDate } = action.payload;
      const dateKey = formatDateKey(targetDate);
      const newTask = {
        ...task,
        id: uuidv4(),
        date: dateKey,
        status: 'not_started',
        createdAt: new Date().toISOString()
      };
      
      const projectTasks = state.tasks[task.projectId] || {};
      const dateTasks = projectTasks[dateKey] || [];
      
      return {
        ...state,
        tasks: {
          ...state.tasks,
          [task.projectId]: {
            ...projectTasks,
            [dateKey]: [...dateTasks, newTask]
          }
        }
      };
    }
    
    default:
      return state;
  }
}

// Context
const AppContext = createContext(null);

// Provider component
export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  
  // Load data from localStorage on mount
  useEffect(() => {
    const projects = getProjects();
    const tasks = getTasks();
    const theme = getTheme();
    
    dispatch({
      type: ACTIONS.INIT_DATA,
      payload: { projects, tasks, theme }
    });
    
    // Apply theme to document
    document.documentElement.setAttribute('data-theme', theme);
  }, []);
  
  // Persist projects to localStorage
  useEffect(() => {
    if (!state.isLoading) {
      saveProjects(state.projects);
    }
  }, [state.projects, state.isLoading]);
  
  // Persist tasks to localStorage
  useEffect(() => {
    if (!state.isLoading) {
      saveTasks(state.tasks);
    }
  }, [state.tasks, state.isLoading]);
  
  // Persist and apply theme
  useEffect(() => {
    if (!state.isLoading) {
      saveTheme(state.theme);
      document.documentElement.setAttribute('data-theme', state.theme);
    }
  }, [state.theme, state.isLoading]);
  
  // Action creators
  const actions = {
    setTheme: (theme) => dispatch({ type: ACTIONS.SET_THEME, payload: theme }),
    toggleTheme: () => dispatch({ 
      type: ACTIONS.SET_THEME, 
      payload: state.theme === 'light' ? 'dark' : 'light' 
    }),
    
    addProject: (name) => dispatch({ type: ACTIONS.ADD_PROJECT, payload: { name } }),
    updateProject: (id, updates) => dispatch({ type: ACTIONS.UPDATE_PROJECT, payload: { id, ...updates } }),
    deleteProject: (id) => dispatch({ type: ACTIONS.DELETE_PROJECT, payload: id }),
    selectProject: (id) => dispatch({ type: ACTIONS.SELECT_PROJECT, payload: id }),
    
    setSelectedDate: (date) => dispatch({ type: ACTIONS.SET_SELECTED_DATE, payload: date }),
    
    addTask: (projectId, date, title, estimatedDays) => 
      dispatch({ type: ACTIONS.ADD_TASK, payload: { projectId, date, title, estimatedDays } }),
    updateTask: (projectId, taskId, updates) => 
      dispatch({ type: ACTIONS.UPDATE_TASK, payload: { projectId, taskId, updates } }),
    deleteTask: (projectId, taskId, dateKey) => 
      dispatch({ type: ACTIONS.DELETE_TASK, payload: { projectId, taskId, dateKey } }),
    selectTask: (task) => dispatch({ type: ACTIONS.SELECT_TASK, payload: task }),
    
    copyTaskToDate: (task, targetDate) => 
      dispatch({ type: ACTIONS.COPY_TASK_TO_DATE, payload: { task, targetDate } })
  };
  
  // Helper to get tasks for a specific project and date
  const getTasksForDate = (projectId, date) => {
    const dateKey = formatDateKey(date);
    return state.tasks[projectId]?.[dateKey] || [];
  };
  
  // Helper to get all tasks for a project (for calendar indicators)
  const getProjectTasks = (projectId) => {
    return state.tasks[projectId] || {};
  };
  
  // Helper to get current project
  const getCurrentProject = () => {
    return state.projects.find(p => p.id === state.selectedProject);
  };
  
  return (
    <AppContext.Provider value={{ 
      state, 
      ...actions,
      getTasksForDate,
      getProjectTasks,
      getCurrentProject
    }}>
      {children}
    </AppContext.Provider>
  );
}

// Hook to use the context
export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

export default AppContext;
