import React from 'react';
import { NavLink } from 'react-router-dom';
import './BottomNav.css';

function BottomNav() {
  return (
    <nav className="bottom-nav">
      <NavLink to="/" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`} end>
        <span className="material-symbols-outlined">dashboard</span>
        <span className="bottom-nav-label">Dashboard</span>
      </NavLink>
      <NavLink to="/settings" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
        <span className="material-symbols-outlined">settings</span>
        <span className="bottom-nav-label">Settings</span>
      </NavLink>
    </nav>
  );
}

export default BottomNav;
