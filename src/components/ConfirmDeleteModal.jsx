import React from 'react';
import './ConfirmDeleteModal.css';

export function ConfirmDeleteModal({ isOpen, projectName, onClose, onConfirm }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content confirm-modal" onClick={e => e.stopPropagation()}>
        <h3>Delete Project?</h3>
        <p>
            Are you sure you want to delete <strong>{projectName}</strong>? 
            <br/>All tasks within it will be permanently lost.
        </p>
        <div className="confirm-actions">
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
          <button className="btn-delete" onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
  );
}
