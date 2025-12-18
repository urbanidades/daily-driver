import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { formatDateDisplay } from '../utils/dateUtils';
import './ProjectList.css';

function ProjectList() {
  const { state, addProject, selectProject, deleteProject } = useApp();
  const navigate = useNavigate();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [menuOpenId, setMenuOpenId] = useState(null);
  
  const today = formatDateDisplay(new Date());
  
  const handleProjectClick = (projectId) => {
    selectProject(projectId);
    navigate(`/project/${projectId}`);
  };
  
  const handleCreateProject = (e) => {
    e.preventDefault();
    if (newProjectName.trim()) {
      addProject(newProjectName.trim());
      setNewProjectName('');
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
  
  return (
    <div className="project-list container">
      <div className="project-list-header">
        <h1 className="project-list-title">My Projects</h1>
        <p className="project-list-subtitle">
          <span className="material-symbols-outlined">calendar_today</span>
          Today is {today}
        </p>
      </div>
      
      <div className="project-grid">
        {state.projects.map((project) => (
          <div
            key={project.id}
            className="project-card"
            onClick={() => handleProjectClick(project.id)}
          >
            <div className="project-card-header">
              <div className="project-card-icon">
                <span className="material-symbols-outlined">folder</span>
              </div>
              <div style={{ position: 'relative' }}>
                <button 
                  className="project-card-menu"
                  onClick={(e) => handleMenuClick(e, project.id)}
                >
                  <span className="material-symbols-outlined">more_horiz</span>
                </button>
                {menuOpenId === project.id && (
                  <div 
                    style={{
                      position: 'absolute',
                      right: 0,
                      top: '100%',
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-md)',
                      padding: 'var(--spacing-sm)',
                      boxShadow: 'var(--shadow-lg)',
                      zIndex: 10
                    }}
                  >
                    <button
                      onClick={(e) => handleDeleteProject(e, project.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--spacing-sm)',
                        padding: 'var(--spacing-sm) var(--spacing-md)',
                        color: '#ef4444',
                        fontSize: '0.875rem',
                        width: '100%',
                        borderRadius: 'var(--radius-sm)'
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>delete</span>
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="project-card-content">
              <h3 className="project-card-name">{project.name}</h3>
              <p className="project-card-meta">
                Created {new Date(project.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        ))}
        
        <button 
          className="project-card project-card-new"
          onClick={() => setShowCreateModal(true)}
        >
          <div className="project-card-new-icon">
            <span className="material-symbols-outlined">add</span>
          </div>
          <div>
            <p className="project-card-new-title">Create New Project</p>
            <p className="project-card-new-subtitle">Start a new journey</p>
          </div>
        </button>
      </div>
      
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

export default ProjectList;
