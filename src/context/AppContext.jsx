import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { getProjects, saveProjects, getTasks, saveTasks, getTheme, saveTheme } from '../utils/storage';
import { formatDateKey } from '../utils/dateUtils';
import { useAuth } from './AuthContext';
import * as db from '../utils/dbService';

// Initial state
const initialState = {
  projects: [],
  tasks: {}, // { projectId: { "YYYY-MM-DD": [tasks] } }
  selectedProject: null,
  selectedDate: new Date(),
  selectedTask: null,
  theme: 'light',
  isLoading: true,
  isSyncing: false
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
  COPY_TASK_TO_DATE: 'COPY_TASK_TO_DATE',
  SET_SYNCING: 'SET_SYNCING'
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

    case ACTIONS.SET_SYNCING:
      return { ...state, isSyncing: action.payload };
      
    case ACTIONS.SET_THEME:
      return { ...state, theme: action.payload };
      
    case ACTIONS.ADD_PROJECT: {
      const newProject = action.payload;
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
      const newTask = action.payload;
      const projectId = newTask.projectId;
      const dateKey = newTask.date;
      
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
      const newTask = action.payload;
      const projectId = newTask.projectId;
      const dateKey = newTask.date;
      
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
    
    default:
      return state;
  }
}

// Context
const AppContext = createContext(null);

// Provider component
export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const { user } = useAuth();
  
  // Load data on mount or when user changes
  useEffect(() => {
    const loadData = async () => {
      const theme = getTheme();
      document.documentElement.setAttribute('data-theme', theme);

      if (user) {
        // User is logged in: fetch from Supabase
        try {
          const [projects, tasks] = await Promise.all([
            db.fetchProjects(),
            db.fetchTasks()
          ]);
          dispatch({
            type: ACTIONS.INIT_DATA,
            payload: { projects, tasks, theme }
          });
        } catch (error) {
          console.error('Error loading data from Supabase:', error);
          // Fallback to empty state
          dispatch({
            type: ACTIONS.INIT_DATA,
            payload: { projects: [], tasks: {}, theme }
          });
        }
      } else {
        // No user: use localStorage (offline/demo mode)
        const projects = getProjects();
        const tasks = getTasks();
        dispatch({
          type: ACTIONS.INIT_DATA,
          payload: { projects, tasks, theme }
        });
      }
    };

    loadData();
  }, [user]);
  
  // Persist projects to localStorage (only when not logged in)
  useEffect(() => {
    if (!state.isLoading && !user) {
      saveProjects(state.projects);
    }
  }, [state.projects, state.isLoading, user]);
  
  // Persist tasks to localStorage (only when not logged in)
  useEffect(() => {
    if (!state.isLoading && !user) {
      saveTasks(state.tasks);
    }
  }, [state.tasks, state.isLoading, user]);
  
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
    
    addProject: async (name, type = 'personal') => {
      if (user) {
        try {
          const project = await db.createProject(name, type);
          dispatch({ type: ACTIONS.ADD_PROJECT, payload: project });
        } catch (error) {
          console.error('Failed to add project:', error);
        }
      } else {
        const newProject = {
          id: uuidv4(),
          name,
          type,
          visible: true,
          createdAt: new Date().toISOString()
        };
        dispatch({ type: ACTIONS.ADD_PROJECT, payload: newProject });
      }
    },

    updateProject: async (id, updates) => {
      if (user) {
        try {
          await db.updateProject(id, updates);
          dispatch({ type: ACTIONS.UPDATE_PROJECT, payload: { id, ...updates } });
        } catch (error) {
          console.error('Failed to update project:', error);
        }
      } else {
        dispatch({ type: ACTIONS.UPDATE_PROJECT, payload: { id, ...updates } });
      }
    },

    deleteProject: async (id) => {
      if (user) {
        try {
          await db.deleteProject(id);
          dispatch({ type: ACTIONS.DELETE_PROJECT, payload: id });
        } catch (error) {
          console.error('Failed to delete project:', error);
        }
      } else {
        dispatch({ type: ACTIONS.DELETE_PROJECT, payload: id });
      }
    },

    selectProject: (id) => dispatch({ type: ACTIONS.SELECT_PROJECT, payload: id }),
    
    setSelectedDate: (date) => dispatch({ type: ACTIONS.SET_SELECTED_DATE, payload: date }),
    
    addTask: async (projectId, date, title, estimatedDays, priority) => {
      const dateKey = formatDateKey(date);
      if (user) {
        try {
          const task = await db.createTask({
            projectId,
            date: dateKey,
            title,
            estimatedDays: estimatedDays || 1,
            priority: priority || 'normal'
          });
          dispatch({ type: ACTIONS.ADD_TASK, payload: task });
        } catch (error) {
          console.error('Failed to add task:', error);
        }
      } else {
        const newTask = {
          id: uuidv4(),
          projectId,
          date: dateKey,
          title,
          description: '',
          content: '',
          status: 'not_started',
          priority: priority || 'normal',
          estimatedDays: estimatedDays || 1,
          createdAt: new Date().toISOString()
        };
        dispatch({ type: ACTIONS.ADD_TASK, payload: newTask });
      }
    },

    updateTask: async (projectId, taskId, updates) => {
      if (user) {
        try {
          await db.updateTask(taskId, updates);
          dispatch({ type: ACTIONS.UPDATE_TASK, payload: { projectId, taskId, updates } });
        } catch (error) {
          console.error('Failed to update task:', error);
        }
      } else {
        dispatch({ type: ACTIONS.UPDATE_TASK, payload: { projectId, taskId, updates } });
      }
    },

    deleteTask: async (projectId, taskId, dateKey) => {
      if (user) {
        try {
          await db.deleteTask(taskId);
          dispatch({ type: ACTIONS.DELETE_TASK, payload: { projectId, taskId, dateKey } });
        } catch (error) {
          console.error('Failed to delete task:', error);
        }
      } else {
        dispatch({ type: ACTIONS.DELETE_TASK, payload: { projectId, taskId, dateKey } });
      }
    },

    selectTask: (task) => dispatch({ type: ACTIONS.SELECT_TASK, payload: task }),
    
    copyTaskToDate: async (task, targetDate) => {
      const dateKey = formatDateKey(targetDate);
      if (user) {
        try {
          const newTask = await db.createTask({
            projectId: task.projectId,
            date: dateKey,
            title: task.title,
            content: task.content || '',
            priority: task.priority || 'normal',
            estimatedDays: task.estimatedDays || 1
          });
          dispatch({ type: ACTIONS.COPY_TASK_TO_DATE, payload: newTask });
        } catch (error) {
          console.error('Failed to copy task:', error);
        }
      } else {
        const newTask = {
          ...task,
          id: uuidv4(),
          date: dateKey,
          status: 'not_started',
          createdAt: new Date().toISOString()
        };
        dispatch({ type: ACTIONS.COPY_TASK_TO_DATE, payload: newTask });
      }
    }
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
  
  // Helper to find task by ID across all projects/dates
  const getTaskById = (taskId) => {
    for (const projectId of Object.keys(state.tasks)) {
      const projectTasks = state.tasks[projectId];
      for (const dateKey of Object.keys(projectTasks)) {
        const dateTasks = projectTasks[dateKey];
        const task = dateTasks.find(t => t.id === taskId);
        if (task) return task;
      }
    }
    return null;
  };
  
  return (
    <AppContext.Provider value={{ 
      state, 
      ...actions,
      getTasksForDate,
      getProjectTasks,
      getCurrentProject,
      getTaskById
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
