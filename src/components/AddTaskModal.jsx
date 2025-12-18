import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import './AddTaskModal.css';

function AddTaskModal({ projectId, date, onClose }) {
  const { addTask } = useApp();
  const [title, setTitle] = useState('');
  const [estimatedDays, setEstimatedDays] = useState(1);
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (title.trim()) {
      addTask(projectId, date, title.trim(), estimatedDays);
      onClose();
    }
  };
  
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content add-task-modal" onClick={(e) => e.stopPropagation()}>
        <h2>New Task</h2>
        <form className="add-task-form" onSubmit={handleSubmit}>
          <div className="add-task-field">
            <label className="add-task-label" htmlFor="task-title">
              Task Name
            </label>
            <input
              id="task-title"
              type="text"
              className="add-task-input"
              placeholder="What needs to be done?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </div>
          
          <div className="add-task-field">
            <label className="add-task-label" htmlFor="estimated-days">
              Estimated Duration
            </label>
            <div className="add-task-days-input">
              <input
                id="estimated-days"
                type="number"
                className="add-task-input"
                min="1"
                max="365"
                value={estimatedDays}
                onChange={(e) => setEstimatedDays(Math.max(1, parseInt(e.target.value) || 1))}
              />
              <span>day{estimatedDays !== 1 ? 's' : ''}</span>
            </div>
          </div>
          
          <div className="add-task-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={!title.trim()}
            >
              Create Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddTaskModal;
