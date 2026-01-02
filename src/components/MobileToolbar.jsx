import React, { useState, useEffect } from 'react';
import { 
  Bold, Italic, Strikethrough, Heading1, Heading2, Heading3, 
  List, ListOrdered, CheckSquare, Image as ImageIcon, 
  Code, Quote, Minus, Undo, Redo, Plus, X, Sparkles 
} from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { Keyboard } from '@capacitor/keyboard';
import haptic from '../utils/haptics';
import './MobileToolbar.css';

export function MobileToolbar({ editor }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  // Detect mobile platform
  const isMobile = Capacitor.isNativePlatform() || window.innerWidth < 768;

  useEffect(() => {
    if (!editor) return;

    const handleSelectionUpdate = () => {
      setIsVisible(editor.isFocused);
    };

    // Fallback: If viewport/window suggests keyboard is open, force visible
    const handleViewportResize = () => {
         const isKeyboardOpen = window.innerHeight < (window.screen.height * 0.75);
         if (isKeyboardOpen) {
             setIsVisible(true);
         } else {
             // Only hide if editor is also blurred
             if (!editor.isFocused) {
                 setIsVisible(false);
             }
         }
    };

    editor.on('selectionUpdate', handleSelectionUpdate);
    editor.on('focus', handleSelectionUpdate);
    editor.on('blur', () => {
      setTimeout(() => {
        if (!document.activeElement?.closest('.mobile-toolbar')) {
            if (!isExpanded) {
                // Double check viewport before hiding
                if (window.visualViewport && window.visualViewport.height < window.innerHeight * 0.85) {
                    // Keyboard still open? Keep visible.
                    setIsVisible(true);
                } else {
                    setIsVisible(false);
                }
            }
        }
      }, 100);
    });
    
    if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', handleViewportResize);
    }

    return () => {
      editor.off('selectionUpdate', handleSelectionUpdate);
      editor.off('focus', handleSelectionUpdate);
      editor.off('blur');
      window.removeEventListener('resize', handleViewportResize);
      if (window.visualViewport) {
         window.visualViewport.removeEventListener('resize', handleViewportResize);
      }
    };
  }, [editor, isExpanded]);

  // Handle keyboard events using Capacitor Keyboard plugin
  useEffect(() => {
    if (!isMobile) return;

    const onKeyboardShow = (info) => {
        if (!isExpanded) {
            const toolbar = document.querySelector('.mobile-toolbar');
            if (toolbar) {
                // When resize mode is Native, the webview shrinks. 
                // So bottom: 0 is correct relative to the new viewport.
                // However, sometimes it takes a split second. 
                // We can ensure visibility here or just trust CSS.
                // If using 'Body' resize mode, we would need to adjust bottom by info.keyboardHeight
                // With 'Native' resize mode, CSS bottom: 0 should just work.
                
                // For safety against some webview quirks:
                toolbar.style.bottom = '0px';
                toolbar.style.top = 'auto';
            }
        }
    };

    const onKeyboardHide = () => {
        if (!isExpanded) {
            const toolbar = document.querySelector('.mobile-toolbar');
            if (toolbar) {
                toolbar.style.bottom = '0px';
                toolbar.style.top = 'auto';
            }
        }
    };

    Keyboard.addListener('keyboardDidShow', onKeyboardShow);
    Keyboard.addListener('keyboardDidHide', onKeyboardHide);

    return () => {
        Keyboard.removeAllListeners();
    };
  }, [isExpanded, isMobile]);

  if (!editor || !isMobile) return null;
  // If not visible and not expanded, hide (unless we are in the process of expanding)
  if (!isVisible && !isExpanded) return null;

  const toggleExpand = () => {
    haptic.light(); // Haptic feedback on toggle
    if (!isExpanded) {
      // Expand: Hide keyboard by blurring editor, but keep toolbar visible
      editor.view.dom.blur();
      setIsExpanded(true);
    } else {
      // Collapse: Focus editor to bring back keyboard
      setIsExpanded(false);
      editor.commands.focus();
    }
  };

  const execute = (callback) => {
    callback();
    // If we were expanded, close menu and bring back keyboard
    if (isExpanded) {
        setIsExpanded(false);
        editor.commands.focus();
    }
  };

  return (
    <div className={`mobile-toolbar ${isExpanded ? 'expanded' : ''}`}>
      {/* Quick Actions Bar (Always Visible above keyboard) */}
      <div className="toolbar-quick-actions">
        <button 
            className={`toolbar-btn expand-btn ${isExpanded ? 'active' : ''}`}
            onMouseDown={(e) => { e.preventDefault(); toggleExpand(); }}
        >
          {isExpanded ? <X size={20} /> : <Plus size={20} />}
        </button>

        <div className="quick-action-divider" />

        <div className="scrollable-actions">
            <button 
                className={`toolbar-btn ${editor.isActive('heading', { level: 1 }) ? 'active' : ''}`}
                onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleHeading({ level: 1 }).run(); }}
            >
                <Heading1 size={18} />
            </button>
            <button 
                className={`toolbar-btn ${editor.isActive('bold') ? 'active' : ''}`}
                onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleBold().run(); }}
            >
                <Bold size={18} />
            </button>
             <button 
                className={`toolbar-btn ${editor.isActive('taskList') ? 'active' : ''}`}
                onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleTaskList().run(); }}
            >
                <CheckSquare size={18} />
            </button>
            <button 
                className={`toolbar-btn ${editor.isActive('bulletList') ? 'active' : ''}`}
                onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleBulletList().run(); }}
            >
                <List size={18} />
            </button>
        </div>
      </div>

      {/* Expanded Menu (Grid of all options) */}
      {isExpanded && (
        <div className="toolbar-expanded-menu">
            <div className="menu-section">
                <span>Text</span>
                <div className="menu-grid">
                    <MenuButton icon={<Heading1 />} label="Heading 1" onClick={() => execute(() => editor.chain().focus().toggleHeading({ level: 1 }).run())} active={editor.isActive('heading', { level: 1 })} />
                    <MenuButton icon={<Heading2 />} label="Heading 2" onClick={() => execute(() => editor.chain().focus().toggleHeading({ level: 2 }).run())} active={editor.isActive('heading', { level: 2 })} />
                    <MenuButton icon={<Heading3 />} label="Heading 3" onClick={() => execute(() => editor.chain().focus().toggleHeading({ level: 3 }).run())} active={editor.isActive('heading', { level: 3 })} />
                    <MenuButton icon={<Bold />} label="Bold" onClick={() => execute(() => editor.chain().focus().toggleBold().run())} active={editor.isActive('bold')} />
                    <MenuButton icon={<Italic />} label="Italic" onClick={() => execute(() => editor.chain().focus().toggleItalic().run())} active={editor.isActive('italic')} />
                    <MenuButton icon={<Strikethrough />} label="Strike" onClick={() => execute(() => editor.chain().focus().toggleStrike().run())} active={editor.isActive('strike')} />
                </div>
            </div>
            
            <div className="menu-section">
                <span>Lists</span>
                <div className="menu-grid">
                    <MenuButton icon={<CheckSquare />} label="To-do" onClick={() => execute(() => editor.chain().focus().toggleTaskList().run())} active={editor.isActive('taskList')} />
                    <MenuButton icon={<List />} label="Bullet" onClick={() => execute(() => editor.chain().focus().toggleBulletList().run())} active={editor.isActive('bulletList')} />
                    <MenuButton icon={<ListOrdered />} label="Numbered" onClick={() => execute(() => editor.chain().focus().toggleOrderedList().run())} active={editor.isActive('orderedList')} />
                </div>
            </div>

            <div className="menu-section">
                <span>Insert</span>
                <div className="menu-grid">
                    <MenuButton icon={<ImageIcon />} label="Image" onClick={() => execute(() => document.getElementById('image-upload-trigger').click())} />
                    <MenuButton icon={<Code />} label="Code" onClick={() => execute(() => editor.chain().focus().toggleCodeBlock().run())} active={editor.isActive('codeBlock')} />
                    <MenuButton icon={<Quote />} label="Quote" onClick={() => execute(() => editor.chain().focus().toggleBlockquote().run())} active={editor.isActive('blockquote')} />
                    <MenuButton icon={<Minus />} label="Divider" onClick={() => execute(() => editor.chain().focus().setHorizontalRule().run())} />
                </div>
            </div>
             <div className="menu-section">
                <span>Actions</span>
                <div className="menu-grid">
                    <MenuButton icon={<Undo />} label="Undo" onClick={() => execute(() => editor.chain().focus().undo().run())} />
                    <MenuButton icon={<Redo />} label="Redo" onClick={() => execute(() => editor.chain().focus().redo().run())} />
                </div>
            </div>
            
            <div className="menu-section ai-section">
                <span>AI</span>
                <div className="menu-grid">
                    <MenuButton 
                        icon={<Sparkles />} 
                        label="Ask AI" 
                        onClick={() => execute(() => {
                            // Insert AI prompt node at cursor position
                            editor.chain().focus().insertContent({ type: 'aiPrompt', attrs: { onSubmit: 'handleAiPrompt' } }).run();
                        })} 
                    />
                </div>
            </div>
        </div>
      )}
    </div>
  );
}

function MenuButton({ icon, label, onClick, active }) {
    return (
        <button className={`menu-grid-btn ${active ? 'active' : ''}`} onMouseDown={(e) => { e.preventDefault(); onClick(); }}>
            <div className="icon-wrapper">{icon}</div>
            <span className="label">{label}</span>
        </button>
    )
}
