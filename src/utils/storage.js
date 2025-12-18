/**
 * localStorage utilities for data persistence
 */

const STORAGE_KEYS = {
  PROJECTS: 'tasklog_projects',
  TASKS: 'tasklog_tasks',
  THEME: 'tasklog_theme'
};

/**
 * Get projects from localStorage
 */
export function getProjects() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.PROJECTS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error reading projects from localStorage:', error);
    return [];
  }
}

/**
 * Save projects to localStorage
 */
export function saveProjects(projects) {
  try {
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
  } catch (error) {
    console.error('Error saving projects to localStorage:', error);
  }
}

/**
 * Get tasks from localStorage
 * Returns object keyed by projectId, containing objects keyed by date
 */
export function getTasks() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.TASKS);
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.error('Error reading tasks from localStorage:', error);
    return {};
  }
}

/**
 * Save tasks to localStorage
 */
export function saveTasks(tasks) {
  try {
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
  } catch (error) {
    console.error('Error saving tasks to localStorage:', error);
  }
}

/**
 * Get theme preference
 */
export function getTheme() {
  try {
    return localStorage.getItem(STORAGE_KEYS.THEME) || 'light';
  } catch (error) {
    console.error('Error reading theme from localStorage:', error);
    return 'light';
  }
}

/**
 * Save theme preference
 */
export function saveTheme(theme) {
  try {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  } catch (error) {
    console.error('Error saving theme to localStorage:', error);
  }
}

/**
 * Clear all app data
 */
export function clearAllData() {
  try {
    localStorage.removeItem(STORAGE_KEYS.PROJECTS);
    localStorage.removeItem(STORAGE_KEYS.TASKS);
  } catch (error) {
    console.error('Error clearing localStorage:', error);
  }
}
