import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import TaskEditor from './TaskEditor';
import { formatDateLong, getNextDay } from '../utils/dateUtils';
import { ChevronLeft, Trash2, Calendar, Target, Flag, Circle } from 'lucide-react';
import './TaskWorkspace.css';

const PRIORITY_OPTIONS = [
  { key: 'urgent', label: 'Urgent', color: '#ef4444', icon: 'priority_high' },
  { key: 'high', label: 'High', color: '#f59e0b', icon: 'stat_3' },
  { key: 'normal', label: 'Normal', color: '#3b82f6', icon: 'stat_2' },
  { key: 'low', label: 'Low', color: '#10b981', icon: 'stat_1' }
];

const STATUS_OPTIONS = [
  { key: 'not_started', label: 'To Do', icon: 'circle' },
  { key: 'ongoing', label: 'In Progress', icon: 'cached' },
  { key: 'done', label: 'Done', icon: 'check_circle' },
  { key: 'canceled', label: 'Canceled', icon: 'cancel' }
];

function TaskWorkspace() {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const { getTaskById, updateTask, deleteTask, state } = useApp();
  
  const [task, setTask] = useState(null);
  const [title, setTitle] = useState('');

  useEffect(() => {
    const foundTask = getTaskById(taskId);
    if (foundTask) {
      setTask(foundTask);
      setTitle(foundTask.title);
    } else if (!state.isLoading) {
      navigate('/');
    }
  }, [taskId, getTaskById, state.isLoading]);

  if (!task) return <div className="loading-workspace">Loading...</div>;

  const handleTitleBlur = () => {
    if (title.trim() && title !== task.title) {
      updateTask(task.projectId, task.id, { title: title.trim() });
    }
  };

  const handleContentChange = (content) => {
    updateTask(task.projectId, task.id, { content });
  };

  const handleStatusChange = (status) => {
    updateTask(task.projectId, task.id, { status });
  };

  const handlePriorityChange = (priority) => {
    updateTask(task.projectId, task.id, { priority });
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this task?')) {
      deleteTask(task.projectId, task.id, task.date);
      navigate(-1);
    }
  };

  const currentPriority = PRIORITY_OPTIONS.find(p => p.key === (task.priority || 'normal'));

  return (
    <div className="task-workspace">
      {/* Sidebar - Properties */}
      <aside className="task-workspace-sidebar">
        <button className="workspace-back" onClick={() => navigate(-1)}>
          <ChevronLeft size={18} />
          <span>Back</span>
        </button>

        <div className="workspace-property-group">
          <label><Circle size={14} /> Status</label>
          <div className="workspace-options">
            {STATUS_OPTIONS.map(opt => (
              <button 
                key={opt.key}
                className={`workspace-opt-btn ${task.status === opt.key ? 'active' : ''}`}
                onClick={() => handleStatusChange(opt.key)}
              >
                <span className="material-symbols-outlined">{opt.icon}</span>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="workspace-property-group">
          <label><Flag size={14} /> Priority</label>
          <div className="workspace-options">
            {PRIORITY_OPTIONS.map(opt => (
              <button 
                key={opt.key}
                className={`workspace-opt-btn ${task.priority === opt.key ? 'active' : ''}`}
                style={{ '--opt-color': opt.color }}
                onClick={() => handlePriorityChange(opt.key)}
              >
                <span className="material-symbols-outlined">{opt.icon}</span>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="workspace-property-group">
          <label><Calendar size={14} /> Date</label>
          <div className="workspace-property-value">{formatDateLong(task.date)}</div>
        </div>

        <div className="workspace-property-group">
          <label><Target size={14} /> Effort</label>
          <div className="workspace-effort-control">
             <button onClick={() => updateTask(task.projectId, task.id, { estimatedDays: Math.max(1, task.estimatedDays - 1) })}>-</button>
             <span>{task.estimatedDays} day{task.estimatedDays !== 1 ? 's' : ''}</span>
             <button onClick={() => updateTask(task.projectId, task.id, { estimatedDays: task.estimatedDays + 1 })}>+</button>
          </div>
        </div>

        <div className="workspace-footer">
          <button className="workspace-delete-btn" onClick={handleDelete}>
            <Trash2 size={16} />
            <span>Delete Task</span>
          </button>
        </div>
      </aside>

      {/* Main Content - Editor */}
      <main className="task-workspace-main">
        <header className="workspace-header">
           <textarea
              className="workspace-title-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleBlur}
              placeholder="Untitled Task"
              rows={1}
            />
        </header>

        <div className="workspace-editor-container">
          <TaskEditor 
            key={task.id}
            content={task.content || task.description || ''} 
            onChange={handleContentChange}
            placeholder="Write your task details here... Use / for commands"
          />
        </div>
      </main>
    </div>
  );
}

export default TaskWorkspace;
