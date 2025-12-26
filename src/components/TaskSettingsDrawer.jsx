import React, { useRef, useState } from 'react';
import { Circle, Flag, Calendar, Target, Trash2, X, Sparkles, Wand2 } from 'lucide-react';
import { formatDateLong } from '../utils/dateUtils';
import './TaskSettingsDrawer.css';

const STATUS_OPTIONS = [
  { key: 'not_started', label: 'To Do', icon: 'circle' },
  { key: 'ongoing', label: 'In Progress', icon: 'cached' },
  { key: 'done', label: 'Done', icon: 'check_circle' },
  { key: 'canceled', label: 'Canceled', icon: 'cancel' }
];

const PRIORITY_OPTIONS = [
  { key: 'urgent', label: 'Urgent', color: '#ef4444', icon: 'priority_high' },
  { key: 'high', label: 'High', color: '#f59e0b', icon: 'stat_3' },
  { key: 'normal', label: 'Normal', color: '#3b82f6', icon: 'stat_2' },
  { key: 'low', label: 'Low', color: '#10b981', icon: 'stat_1' }
];

function TaskSettingsDrawer({ 
  isOpen, 
  onClose, 
  task, 
  onStatusChange, 
  onPriorityChange, 
  onEffortChange,
  onDelete,
  onOpenAiPanel
}) {
  const drawerRef = useRef(null);
  const [startY, setStartY] = useState(0);
  const [currentY, setCurrentY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  if (!task) return null;

  const handleTouchStart = (e) => {
    setStartY(e.touches[0].clientY);
    setIsDragging(true);
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    const diff = e.touches[0].clientY - startY;
    // Only allow dragging down
    if (diff > 0) {
      setCurrentY(diff);
    }
  };

  const handleTouchEnd = () => {
    if (currentY > 100) {
      // If dragged more than 100px, close
      onClose();
    }
    setCurrentY(0);
    setIsDragging(false);
  };

  const drawerStyle = currentY > 0 ? { transform: `translateY(${currentY}px)` } : {};

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`drawer-backdrop ${isOpen ? 'open' : ''}`} 
        onClick={onClose}
      />

      {/* Drawer */}
      <div 
        ref={drawerRef}
        className={`task-settings-drawer ${isOpen ? 'open' : ''}`}
        style={drawerStyle}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="drawer-handle">
          <div className="drawer-handle-bar" />
        </div>

        <div className="drawer-content">
          {/* Status */}
          <div className="drawer-section">
            <label><Circle size={14} /> Status</label>
            <div className="drawer-options">
              {STATUS_OPTIONS.map(opt => (
                <button 
                  key={opt.key}
                  className={`drawer-opt-btn ${task.status === opt.key ? 'active' : ''}`}
                  onClick={() => onStatusChange(opt.key)}
                >
                  <span className="material-symbols-outlined">{opt.icon}</span>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Priority */}
          <div className="drawer-section">
            <label><Flag size={14} /> Priority</label>
            <div className="drawer-options">
              {PRIORITY_OPTIONS.map(opt => (
                <button 
                  key={opt.key}
                  className={`drawer-opt-btn ${task.priority === opt.key ? 'active' : ''}`}
                  style={{ '--opt-color': opt.color }}
                  onClick={() => onPriorityChange(opt.key)}
                >
                  <span className="material-symbols-outlined">{opt.icon}</span>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Date */}
          <div className="drawer-section">
            <label><Calendar size={14} /> Date</label>
            <div className="drawer-value">{formatDateLong(task.date)}</div>
          </div>

          {/* Effort */}
          <div className="drawer-section">
            <label><Target size={14} /> Effort</label>
            <div className="drawer-effort-control">
              <button onClick={() => onEffortChange(Math.max(1, task.estimatedDays - 1))}>-</button>
              <span>{task.estimatedDays} day{task.estimatedDays !== 1 ? 's' : ''}</span>
              <button onClick={() => onEffortChange(task.estimatedDays + 1)}>+</button>
            </div>
          </div>

          {/* AI Enhance */}
          <div className="drawer-section">
            <label><Sparkles size={14} /> AI Enhance</label>
            <button className="drawer-ai-btn" onClick={onOpenAiPanel}>
              <Wand2 size={16} />
              <span>Enhance with AI</span>
            </button>
          </div>

          {/* Delete */}
          <div className="drawer-section drawer-danger">
            <button className="drawer-delete-btn" onClick={onDelete}>
              <Trash2 size={16} />
              <span>Delete Task</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default TaskSettingsDrawer;

