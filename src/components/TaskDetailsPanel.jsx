import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { formatDateKey, getNextDay, formatDateLong } from '../utils/dateUtils';
import { improveDescription, IMPROVEMENT_OPTIONS } from '../utils/aiService';
import './TaskDetailsPanel.css';

const STATUS_OPTIONS = [
  { key: 'not_started', label: 'To Do' },
  { key: 'ongoing', label: 'In Progress' },
  { key: 'done', label: 'Done' },
  { key: 'canceled', label: 'Canceled' }
];

function TaskDetailsPanel() {
  const { 
    state, 
    selectTask, 
    updateTask, 
    deleteTask, 
    copyTaskToDate,
    getCurrentProject 
  } = useApp();
  
  const task = state.selectedTask;
  const project = getCurrentProject();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [copyDate, setCopyDate] = useState('');
  
  // AI improvement state
  const [showAiMenu, setShowAiMenu] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  
  // Sync local state with selected task
  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
    }
  }, [task?.id]);
  
  if (!task) {
    return null;
  }
  
  const handleClose = () => {
    selectTask(null);
  };
  
  const handleTitleChange = (e) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
  };
  
  const handleTitleBlur = () => {
    if (title.trim() && title !== task.title) {
      updateTask(task.projectId, task.id, { title: title.trim() });
    }
  };
  
  const handleDescriptionChange = (e) => {
    const newDescription = e.target.value;
    setDescription(newDescription);
  };
  
  const handleDescriptionBlur = () => {
    if (description !== task.description) {
      updateTask(task.projectId, task.id, { description });
    }
  };
  
  const handleStatusChange = (status) => {
    updateTask(task.projectId, task.id, { status });
  };
  
  const handleEstimatedDaysChange = (delta) => {
    const newDays = Math.max(1, task.estimatedDays + delta);
    updateTask(task.projectId, task.id, { estimatedDays: newDays });
  };
  
  const handleCopyToTomorrow = () => {
    const tomorrow = getNextDay(new Date());
    copyTaskToDate(task, tomorrow);
  };
  
  const handleCopyToDate = () => {
    if (copyDate) {
      const targetDate = new Date(copyDate + 'T00:00:00');
      copyTaskToDate(task, targetDate);
      setShowDatePicker(false);
      setCopyDate('');
    }
  };
  
  const handleAiImprove = async (mode) => {
    setShowAiMenu(false);
    setAiError('');
    setAiLoading(true);
    
    try {
      const improved = await improveDescription(description, mode, title);
      setDescription(improved);
      // Auto-save the improved description
      updateTask(task.projectId, task.id, { description: improved });
    } catch (error) {
      setAiError(error.message);
      // Clear error after 5 seconds
      setTimeout(() => setAiError(''), 5000);
    } finally {
      setAiLoading(false);
    }
  };
  
  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this task?')) {
      deleteTask(task.projectId, task.id, task.date);
    }
  };
  
  return (
    <>
      {/* Mobile overlay */}
      <div 
        className={`task-panel-overlay ${task ? 'visible' : ''}`}
        onClick={handleClose}
      />
      
      {/* Panel */}
      <aside className={`task-panel ${task ? 'open' : ''}`}>
        {/* Header */}
        <div className="task-panel-header">
          <div className="task-panel-breadcrumb">
            <span className="material-symbols-outlined">folder_open</span>
            <span>{project?.name || 'Project'}</span>
          </div>
          <div className="task-panel-actions">
            <button 
              className="task-panel-action-btn delete"
              onClick={handleDelete}
              aria-label="Delete task"
            >
              <span className="material-symbols-outlined">delete</span>
            </button>
            <button 
              className="task-panel-action-btn"
              onClick={handleClose}
              aria-label="Close panel"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="task-panel-content">
          {/* Title Section */}
          <div className="task-panel-title-section">
            <textarea
              className="task-panel-title"
              value={title}
              onChange={handleTitleChange}
              onBlur={handleTitleBlur}
              placeholder="Task title..."
              rows={2}
            />
            
            {/* Status Chips */}
            <div className="task-panel-status-chips">
              {STATUS_OPTIONS.map(({ key, label }) => (
                <button
                  key={key}
                  className={`status-chip ${task.status === key ? 'active' : ''}`}
                  onClick={() => handleStatusChange(key)}
                >
                  <span className={`status-dot ${key}`}></span>
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>
          
          {/* Quick Actions */}
          <div className="task-panel-quick-actions">
            <button 
              className="task-panel-quick-action primary"
              onClick={handleCopyToTomorrow}
            >
              <span className="material-symbols-outlined">content_copy</span>
              <span>Copy to Tomorrow</span>
            </button>
            <button 
              className="task-panel-quick-action secondary"
              onClick={() => setShowDatePicker(!showDatePicker)}
            >
              <span className="material-symbols-outlined">event</span>
              <span>Copy to Date...</span>
            </button>
          </div>
          
          {/* Date Picker */}
          {showDatePicker && (
            <div className="task-panel-date-picker">
              <input
                type="date"
                className="task-panel-date-input"
                value={copyDate}
                onChange={(e) => setCopyDate(e.target.value)}
                min={formatDateKey(new Date())}
              />
              <div className="task-panel-date-actions">
                <button 
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowDatePicker(false);
                    setCopyDate('');
                  }}
                >
                  Cancel
                </button>
                <button 
                  className="btn btn-primary"
                  onClick={handleCopyToDate}
                  disabled={!copyDate}
                >
                  Copy
                </button>
              </div>
            </div>
          )}
          
          {/* Estimation */}
          <div className="task-panel-section">
            <div className="task-panel-section-header">
              <h4 className="task-panel-section-title">Estimation</h4>
              <span className="task-panel-section-subtitle">Manual Entry</span>
            </div>
            <div className="task-panel-estimation">
              <div className="task-panel-estimation-card">
                <div className="task-panel-estimation-label">
                  <span className="material-symbols-outlined">timelapse</span>
                  <span>Estimated Effort</span>
                </div>
                <div className="task-panel-estimation-value">
                  <span className="task-panel-estimation-number">{task.estimatedDays}</span>
                  <span className="task-panel-estimation-unit">
                    day{task.estimatedDays !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
              <div className="task-panel-estimation-controls">
                <button 
                  className="task-panel-estimation-btn"
                  onClick={() => handleEstimatedDaysChange(1)}
                >
                  <span className="material-symbols-outlined">add</span>
                </button>
                <button 
                  className="task-panel-estimation-btn"
                  onClick={() => handleEstimatedDaysChange(-1)}
                  disabled={task.estimatedDays <= 1}
                >
                  <span className="material-symbols-outlined">remove</span>
                </button>
              </div>
            </div>
          </div>
          
          {/* Description */}
          <div className="task-panel-section">
            <h4 className="task-panel-section-title">Description</h4>
            <div className="task-panel-description-wrapper">
              <textarea
                className="task-panel-description"
                value={description}
                onChange={handleDescriptionChange}
                onBlur={handleDescriptionBlur}
                placeholder="Add more details about this task..."
                disabled={aiLoading}
              />
              
              {/* AI Improve Button */}
              <div className="ai-improve-container">
                <button 
                  className={`ai-improve-btn ${aiLoading ? 'loading' : ''}`}
                  onClick={() => setShowAiMenu(!showAiMenu)}
                  disabled={aiLoading}
                  aria-label="Improve with AI"
                  title="Improve with AI"
                >
                  {aiLoading ? (
                    <span className="ai-spinner"></span>
                  ) : (
                    <span className="material-symbols-outlined">auto_awesome</span>
                  )}
                </button>
                
                {/* AI Menu Dropdown */}
                {showAiMenu && (
                  <div className="ai-improve-menu">
                    <div className="ai-improve-menu-header">
                      <span className="material-symbols-outlined">auto_awesome</span>
                      <span>Improve with AI</span>
                    </div>
                    {IMPROVEMENT_OPTIONS.map(option => (
                      <button
                        key={option.key}
                        className="ai-improve-option"
                        onClick={() => handleAiImprove(option.key)}
                      >
                        <span className="material-symbols-outlined">{option.icon}</span>
                        <div className="ai-improve-option-text">
                          <span className="ai-improve-option-label">{option.label}</span>
                          <span className="ai-improve-option-desc">{option.description}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              {/* AI Error Message */}
              {aiError && (
                <div className="ai-error-message">
                  <span className="material-symbols-outlined">error</span>
                  <span>{aiError}</span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="task-panel-footer">
          <div className="task-panel-footer-info">
            <span>Created {new Date(task.createdAt).toLocaleDateString()}</span>
            <span>Date: {formatDateLong(task.date)}</span>
          </div>
        </div>
      </aside>
    </>
  );
}

export default TaskDetailsPanel;
