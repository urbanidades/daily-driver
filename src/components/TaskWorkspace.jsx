import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import TaskEditor from './TaskEditor';
import { formatDateLong } from '../utils/dateUtils';
import { ChevronLeft, Trash2, Calendar, Target, Flag, Circle, Sparkles, Wand2, Check, X, Layers } from 'lucide-react';
import { improveDescription, IMPROVEMENT_OPTIONS } from '../utils/aiService';
import { supabase } from '../utils/supabaseClient';
import './TaskWorkspace.css';

const MAX_AI_USES = 5;
const ADMIN_EMAILS = ['afonsurbano@gmail.com'];

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
// Convert plain text/markdown to proper TipTap HTML
function textToHtml(text) {
  if (!text) return '';
  
  // Helper to convert inline markdown
  function convertInlineMarkdown(str) {
    return str
      // Bold: **text** or __text__
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/__(.+?)__/g, '<strong>$1</strong>')
      // Italic: *text* or _text_
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      .replace(/_([^_]+)_/g, '<em>$1</em>')
      // Inline code: `code`
      .replace(/`([^`]+)`/g, '<code>$1</code>');
  }
  
  // Split by double newlines for paragraphs
  const paragraphs = text.split(/\n\n+/);
  
  return paragraphs.map(para => {
    // Check for list items (lines starting with - or *)
    if (para.match(/^[\-\*]\s/m)) {
      const items = para.split('\n')
        .filter(line => line.trim())
        .map(line => {
          const content = convertInlineMarkdown(line.replace(/^[\-\*]\s*/, ''));
          return `<li><p>${content}</p></li>`;
        })
        .join('');
      return `<ul>${items}</ul>`;
    }
    
    // Check for numbered list items
    if (para.match(/^\d+\.\s/m)) {
      const items = para.split('\n')
        .filter(line => line.trim())
        .map(line => {
          const content = convertInlineMarkdown(line.replace(/^\d+\.\s*/, ''));
          return `<li><p>${content}</p></li>`;
        })
        .join('');
      return `<ol>${items}</ol>`;
    }
    
    // Regular paragraph - convert inline markdown and replace newlines
    const content = convertInlineMarkdown(para).replace(/\n/g, '<br>');
    return `<p>${content}</p>`;
  }).join('');
}


function TaskWorkspace() {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const { getTaskById, updateTask, deleteTask, state } = useApp();
  const { user } = useAuth();
  
  const [task, setTask] = useState(null);
  const [title, setTitle] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);
  const [aiUsesRemaining, setAiUsesRemaining] = useState(MAX_AI_USES);
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [aiPreview, setAiPreview] = useState(null); // { originalHtml, originalText, enhanced, mode }
  const [editorKey, setEditorKey] = useState(0); // Force editor refresh
  
  const isAdmin = user?.email && ADMIN_EMAILS.includes(user.email);

  // Fetch AI usage count for this user
  useEffect(() => {
    const fetchUsage = async () => {
      if (!user || isAdmin) {
        if (isAdmin) setAiUsesRemaining(Infinity);
        return;
      }
      
      try {
        const { data, error } = await supabase
          .from('user_settings')
          .select('ai_uses')
          .eq('user_id', user.id)
          .single();
        
        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching AI usage:', error);
          return;
        }
        
        if (data) {
          setAiUsesRemaining(Math.max(0, MAX_AI_USES - (data.ai_uses || 0)));
        }
      } catch (err) {
        console.error('Failed to fetch AI usage:', err);
      }
    };
    
    fetchUsage();
  }, [user, isAdmin]);

  // Sync task from global state
  useEffect(() => {
    const foundTask = getTaskById(taskId);
    if (foundTask) {
      setTask(foundTask);
      setTitle(foundTask.title);
    } else if (!state.isLoading) {
      navigate('/');
    }
  }, [taskId, getTaskById, state.isLoading, navigate, state.tasks]);

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

  const handleAiEnhance = async (mode) => {
    if (!isAdmin && aiUsesRemaining <= 0) {
      setAiError('You have reached your AI enhancement limit.');
      return;
    }

    // Get fresh task data from global state
    const currentTask = getTaskById(taskId);
    if (!currentTask) {
      setAiError('Task not found.');
      return;
    }

    const content = currentTask.content || '';
    // Strip HTML tags for plain text input
    const plainText = content.replace(/<[^>]*>/g, '').trim();
    
    if (!plainText) {
      setAiError('Please add some content to the task first.');
      return;
    }

    setAiLoading(true);
    setAiError(null);

    try {
      const improved = await improveDescription(plainText, mode, currentTask.title);
      
      // Show preview
      setAiPreview({
        originalHtml: content,
        originalText: plainText,
        enhanced: improved,
        mode
      });
      
      setShowAiPanel(false);
    } catch (err) {
      setAiError(err.message);
    } finally {
      setAiLoading(false);
    }
  };

  const incrementUsage = async () => {
    if (!user || isAdmin) return;
    
    try {
      const { data: existing } = await supabase
        .from('user_settings')
        .select('ai_uses')
        .eq('user_id', user.id)
        .single();
      
      if (existing) {
        await supabase
          .from('user_settings')
          .update({ ai_uses: (existing.ai_uses || 0) + 1 })
          .eq('user_id', user.id);
      } else {
        await supabase
          .from('user_settings')
          .insert({ user_id: user.id, ai_uses: 1 });
      }
      
      setAiUsesRemaining(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to update usage:', err);
    }
  };

  const handleAcceptEnhancement = async () => {
    if (!aiPreview) return;
    
    // Convert enhanced text to proper HTML
    const newContent = textToHtml(aiPreview.enhanced);
    
    // Update local state immediately for instant UI refresh
    setTask(prev => ({ ...prev, content: newContent }));
    setEditorKey(prev => prev + 1);
    
    // Then persist to database
    updateTask(task.projectId, task.id, { content: newContent });
    
    await incrementUsage();
    
    setAiPreview(null);
  };

  const handleKeepBoth = async () => {
    if (!aiPreview) return;
    
    // Create combined content with headers and divider
    const enhancedHtml = textToHtml(aiPreview.enhanced);
    const combinedContent = `<h1>Enhanced</h1>${enhancedHtml}<hr><h1>Original</h1>${aiPreview.originalHtml}`;
    
    // Update local state immediately for instant UI refresh
    setTask(prev => ({ ...prev, content: combinedContent }));
    setEditorKey(prev => prev + 1);
    
    // Then persist to database
    updateTask(task.projectId, task.id, { content: combinedContent });
    
    await incrementUsage();
    
    setAiPreview(null);
  };

  const handleDeclineEnhancement = () => {
    setAiPreview(null);
  };

  return (
    <div className="task-workspace">
      {/* AI Preview Modal */}
      {aiPreview && (
        <div className="ai-preview-overlay">
          <div className="ai-preview-modal">
            <div className="ai-preview-header">
              <Sparkles size={20} />
              <h3>AI Enhancement Preview</h3>
              <span className="ai-preview-mode">{aiPreview.mode}</span>
            </div>
            
            <div className="ai-preview-content">
              <div className="ai-preview-section">
                <label>Enhanced Version:</label>
                <div className="ai-preview-text enhanced">
                  {aiPreview.enhanced}
                </div>
              </div>
            </div>
            
            <div className="ai-preview-actions">
              <button className="ai-decline-btn" onClick={handleDeclineEnhancement}>
                <X size={16} />
                Decline
              </button>
              <button className="ai-keep-both-btn" onClick={handleKeepBoth}>
                <Layers size={16} />
                Keep Both
              </button>
              <button className="ai-accept-btn" onClick={handleAcceptEnhancement}>
                <Check size={16} />
                Accept
              </button>
            </div>
          </div>
        </div>
      )}

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

        {/* AI Enhancement Section */}
        <div className="workspace-property-group ai-section">
          <label><Sparkles size={14} /> AI Enhance</label>
          <div className="ai-uses-badge">
            {isAdmin ? '∞ Admin' : `${aiUsesRemaining}/${MAX_AI_USES} uses left`}
          </div>
          
          {!showAiPanel ? (
            <button 
              className="ai-trigger-btn"
              onClick={() => setShowAiPanel(true)}
              disabled={!isAdmin && aiUsesRemaining <= 0}
            >
              <Wand2 size={16} />
              <span>Enhance with AI</span>
            </button>
          ) : (
            <div className="ai-options-panel">
              {IMPROVEMENT_OPTIONS.map(opt => (
                <button
                  key={opt.key}
                  className="ai-option-btn"
                  onClick={() => handleAiEnhance(opt.key)}
                  disabled={aiLoading}
                >
                  <span className="material-symbols-outlined">{opt.icon}</span>
                  <div className="ai-option-text">
                    <span className="ai-option-label">{opt.label}</span>
                    <span className="ai-option-desc">{opt.description}</span>
                  </div>
                </button>
              ))}
              <button 
                className="ai-cancel-btn"
                onClick={() => setShowAiPanel(false)}
              >
                Cancel
              </button>
            </div>
          )}
          
          {aiLoading && (
            <div className="ai-loading">
              <span className="material-symbols-outlined spinning">progress_activity</span>
              Enhancing...
            </div>
          )}
          
          {aiError && (
            <div className="ai-error">{aiError}</div>
          )}
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
            key={`${task.id}-${editorKey}`}
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
