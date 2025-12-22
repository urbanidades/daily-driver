import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import './Header.css';

function Header() {
  const { state, toggleTheme, getCurrentProject } = useApp();
  const { signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  const currentProject = getCurrentProject();
  
  // Determine breadcrumbs based on current route
  const getBreadcrumbs = () => {
    const path = location.pathname;
    
    if (path === '/') {
      return null;
    }
    
    if (path.startsWith('/project/') && currentProject) {
      const isDay = path.includes('/day/');
      return (
        <div className="header-breadcrumbs">
          <Link to="/">Projects</Link>
          <span className="header-breadcrumbs-separator">/</span>
          {isDay ? (
            <>
              <Link to={`/project/${currentProject.id}`}>{currentProject.name}</Link>
              <span className="header-breadcrumbs-separator">/</span>
              <span className="header-breadcrumbs-current">Day View</span>
            </>
          ) : (
            <span className="header-breadcrumbs-current">{currentProject.name}</span>
          )}
        </div>
      );
    }
    
    return null;
  };
  
  const showBackButton = location.pathname !== '/';
  
  const handleBack = () => {
    const path = location.pathname;
    
    if (path.includes('/day/')) {
      // Go back to calendar view
      const projectId = path.split('/project/')[1].split('/day')[0];
      navigate(`/project/${projectId}`);
    } else if (path.startsWith('/project/')) {
      // Go back to project list
      navigate('/');
    } else {
      navigate(-1);
    }
  };
  
  return (
    <header className="header">
      <div className="header-content">
        <div className="header-left">
          {showBackButton && (
            <button className="header-back-btn" onClick={handleBack}>
              <span className="material-symbols-outlined">arrow_back</span>
              <span className="hide-mobile">Back</span>
            </button>
          )}
          
          <Link to="/" className="header-branding">
            <img 
              src={state.theme === 'light' ? '/logo-light.png' : '/logo-dark.png'} 
              alt="Daily Driver Logo" 
              className="header-logo-full" 
            />
          </Link>
          
          {getBreadcrumbs()}
        </div>
        
        <div className="header-right">
          <button 
            className="header-theme-toggle"
            onClick={toggleTheme}
            aria-label={`Switch to ${state.theme === 'light' ? 'dark' : 'light'} mode`}
          >
            <span className="material-symbols-outlined">
              {state.theme === 'light' ? 'dark_mode' : 'light_mode'}
            </span>
          </button>
          <Link 
            to="/settings"
            className="header-logout-btn" // Reuse same class for now or rename to header-icon-btn
            title="Settings"
            aria-label="Settings"
          >
            <span className="material-symbols-outlined">settings</span>
          </Link>
        </div>
      </div>
    </header>
  );
}

export default Header;
