import React from 'react';
import { NavLink } from 'react-router-dom';
import './BottomNav.css';

import { Capacitor } from '@capacitor/core';
import { Keyboard } from '@capacitor/keyboard';
import haptic from '../utils/haptics';

function BottomNav() {
  const [isVisible, setIsVisible] = React.useState(true);

  React.useEffect(() => {
    // 1. Capacitor Keyboard Plugin Listeners
    if (Capacitor.isNativePlatform()) {
        const onKeyboardShow = () => setIsVisible(false);
        const onKeyboardHide = () => setIsVisible(true);

        Keyboard.addListener('keyboardDidShow', onKeyboardShow);
        Keyboard.addListener('keyboardDidHide', onKeyboardHide);
    }

    // 2. Visual Viewport / Resize Fallback (Robust)
    const handleResize = () => {
        // With adjustResize, window.innerHeight effectively shrinks.
        // We compare it to the full screen height (approximated).
        // If innerHeight is < 75% of screen height, keyboard is likely open.
        const isKeyboardOpen = window.innerHeight < (window.screen.height * 0.75);
        setIsVisible(!isKeyboardOpen);
    };

    window.addEventListener('resize', handleResize);
    if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', handleResize);
    }

    return () => {
      Keyboard.removeAllListeners();
      window.removeEventListener('resize', handleResize);
      if (window.visualViewport) {
          window.visualViewport.removeEventListener('resize', handleResize);
      }
    };
  }, []);

  if (!isVisible) return null;

  return (
    <nav className="bottom-nav">
      <NavLink to="/" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`} end onClick={() => haptic.light()}>
        <span className="material-symbols-outlined">dashboard</span>
        <span className="bottom-nav-label">Dashboard</span>
      </NavLink>
      <NavLink to="/settings" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`} onClick={() => haptic.light()}>
        <span className="material-symbols-outlined">settings</span>
        <span className="bottom-nav-label">Settings</span>
      </NavLink>
    </nav>
  );
}

export default BottomNav;
