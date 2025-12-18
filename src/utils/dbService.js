/**
 * Supabase Database Service for Projects and Tasks
 */
import { supabase } from './supabaseClient';

// ==================== PROJECTS ====================

/**
 * Fetch all projects for the current user
 */
export async function fetchProjects() {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching projects:', error);
    throw error;
  }
  return data || [];
}

/**
 * Create a new project
 */
export async function createProject(name, type = 'personal', visible = true) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('projects')
    .insert({ name, user_id: user.id, type, visible })
    .select()
    .single();

  if (error) {
    console.error('Error creating project:', error);
    throw error;
  }
  return data;
}

/**
 * Update a project
 */
export async function updateProject(id, updates) {
  const { data, error } = await supabase
    .from('projects')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating project:', error);
    throw error;
  }
  return data;
}

/**
 * Delete a project (cascades to tasks)
 */
export async function deleteProject(id) {
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting project:', error);
    throw error;
  }
}

// ==================== TASKS ====================

/**
 * Fetch all tasks for the current user
 * Returns object keyed by projectId -> dateKey -> [tasks]
 */
export async function fetchTasks() {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching tasks:', error);
    throw error;
  }

  // Transform flat array into nested structure: { projectId: { dateKey: [tasks] } }
  const tasksMap = {};
  for (const task of data || []) {
    const projectId = task.project_id;
    const dateKey = task.date; // Already in YYYY-MM-DD format from DB

    if (!tasksMap[projectId]) {
      tasksMap[projectId] = {};
    }
    if (!tasksMap[projectId][dateKey]) {
      tasksMap[projectId][dateKey] = [];
    }

    // Map DB columns to app format
    tasksMap[projectId][dateKey].push({
      id: task.id,
      projectId: task.project_id,
      date: task.date,
      title: task.title,
      content: task.content || '',
      status: task.status || 'not_started',
      priority: task.priority || 'normal',
      estimatedDays: task.estimated_days || 1,
      createdAt: task.created_at
    });
  }

  return tasksMap;
}

/**
 * Create a new task
 */
export async function createTask(taskData) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('tasks')
    .insert({
      user_id: user.id,
      project_id: taskData.projectId,
      date: taskData.date,
      title: taskData.title,
      content: taskData.content || '',
      status: taskData.status || 'not_started',
      priority: taskData.priority || 'normal',
      estimated_days: taskData.estimatedDays || 1
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating task:', error);
    throw error;
  }

  // Return in app format
  return {
    id: data.id,
    projectId: data.project_id,
    date: data.date,
    title: data.title,
    content: data.content || '',
    status: data.status,
    priority: data.priority,
    estimatedDays: data.estimated_days,
    createdAt: data.created_at
  };
}

/**
 * Update a task
 */
export async function updateTask(id, updates) {
  // Map app format to DB columns
  const dbUpdates = {};
  if (updates.title !== undefined) dbUpdates.title = updates.title;
  if (updates.content !== undefined) dbUpdates.content = updates.content;
  if (updates.status !== undefined) dbUpdates.status = updates.status;
  if (updates.priority !== undefined) dbUpdates.priority = updates.priority;
  if (updates.estimatedDays !== undefined) dbUpdates.estimated_days = updates.estimatedDays;

  const { data, error } = await supabase
    .from('tasks')
    .update(dbUpdates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating task:', error);
    throw error;
  }

  return {
    id: data.id,
    projectId: data.project_id,
    date: data.date,
    title: data.title,
    content: data.content || '',
    status: data.status,
    priority: data.priority,
    estimatedDays: data.estimated_days,
    createdAt: data.created_at
  };
}

/**
 * Delete a task
 */
export async function deleteTask(id) {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting task:', error);
    throw error;
  }
}
