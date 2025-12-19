import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { Image } from '@tiptap/extension-image';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableCell } from '@tiptap/extension-table-cell';
import { AiPromptNode } from './extensions/AiPromptNode';
import './TaskEditor.css';

// Base slash command options (static)
const BASE_SLASH_COMMANDS = [
  { name: 'Heading 1', icon: 'format_h1', command: (editor) => editor.chain().focus().toggleHeading({ level: 1 }).run() },
  { name: 'Heading 2', icon: 'format_h2', command: (editor) => editor.chain().focus().toggleHeading({ level: 2 }).run() },
  { name: 'Bullet List', icon: 'format_list_bulleted', command: (editor) => editor.chain().focus().toggleBulletList().run() },
  { name: 'Numbered List', icon: 'format_list_numbered', command: (editor) => editor.chain().focus().toggleOrderedList().run() },
  { name: 'Code Block', icon: 'code', command: (editor) => editor.chain().focus().toggleCodeBlock().run() },
  { name: 'Quote', icon: 'format_quote', command: (editor) => editor.chain().focus().toggleBlockquote().run() },
  { name: 'Divider', icon: 'horizontal_rule', command: (editor) => editor.chain().focus().setHorizontalRule().run() },
  { name: 'Table', icon: 'table_chart', command: (editor) => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run() },
];

// Debounce delay in ms
const SAVE_DEBOUNCE_MS = 500;

function TaskEditor({ 
  content, 
  onChange, 
  placeholder = 'Write your task details here... Type / for commands',
  onAiPrompt,
  onAiEnhance
}) {
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashMenuPosition, setSlashMenuPosition] = useState({ top: 0, left: 0 });
  const [slashFilter, setSlashFilter] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  const slashMenuRef = useRef(null);
  const editorContainerRef = useRef(null);
  
  // Refs for debouncing and slash menu state
  const debounceTimerRef = useRef(null);
  const showSlashMenuRef = useRef(showSlashMenu);
  const selectedIndexRef = useRef(selectedIndex);
  const slashFilterRef = useRef(slashFilter);
  const onChangeRef = useRef(onChange);
  
  // Build dynamic SLASH_COMMANDS with AI options
  const SLASH_COMMANDS = useMemo(() => {
    const commands = [...BASE_SLASH_COMMANDS];
    
    // Add AI Prompt command - inserts inline input box
    commands.push({
      name: 'AI Prompt',
      icon: 'smart_toy',
      description: 'Ask AI anything',
      command: (editor) => {
        editor.chain().focus().insertContent({
          type: 'aiPrompt',
          attrs: { onSubmit: '__aiPromptCallback' }
        }).run();
      }
    });
    
    // Add AI Enhance command if callback provided
    if (onAiEnhance) {
      commands.push({
        name: 'AI Enhance',
        icon: 'auto_fix_high',
        description: 'Improve your text',
        command: () => onAiEnhance()
      });
    }
    
    return commands;
  }, [onAiEnhance]);
  
  // Ref for SLASH_COMMANDS to use in callbacks
  const slashCommandsRef = useRef(SLASH_COMMANDS);
  useEffect(() => {
    slashCommandsRef.current = SLASH_COMMANDS;
  }, [SLASH_COMMANDS]);
  
  // Keep refs in sync
  useEffect(() => {
    showSlashMenuRef.current = showSlashMenu;
  }, [showSlashMenu]);
  
  useEffect(() => {
    selectedIndexRef.current = selectedIndex;
  }, [selectedIndex]);
  
  useEffect(() => {
    slashFilterRef.current = slashFilter;
  }, [slashFilter]);
  
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Get filtered commands
  const getFilteredCommands = useCallback(() => {
    return slashCommandsRef.current.filter(cmd =>
      cmd.name.toLowerCase().includes(slashFilterRef.current.toLowerCase())
    );
  }, []);

  const filteredCommands = SLASH_COMMANDS.filter(cmd =>
    cmd.name.toLowerCase().includes(slashFilter.toLowerCase())
  );

  // Execute slash command ref
  const executeSlashCommandRef = useRef(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder,
      }),
      Image,
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      AiPromptNode,
    ],
    // Initial content - only used on mount (uncontrolled)
    content: content || '',
    editorProps: {
      handleKeyDown: (view, event) => {
        // Intercept keyboard events when slash menu is open
        if (!showSlashMenuRef.current) return false;
        
        const commands = getFilteredCommands();
        
        if (event.key === 'ArrowDown') {
          event.preventDefault();
          setSelectedIndex(prev => (prev + 1) % commands.length);
          return true;
        }
        
        if (event.key === 'ArrowUp') {
          event.preventDefault();
          setSelectedIndex(prev => (prev - 1 + commands.length) % commands.length);
          return true;
        }
        
        if (event.key === 'Enter') {
          event.preventDefault();
          const cmd = commands[selectedIndexRef.current];
          if (cmd && executeSlashCommandRef.current) {
            executeSlashCommandRef.current(cmd);
          }
          return true;
        }
        
        if (event.key === 'Escape') {
          event.preventDefault();
          setShowSlashMenu(false);
          setSlashFilter('');
          return true;
        }
        
        return false;
      },
    },
    onUpdate: ({ editor }) => {
      // Debounced save - prevents race conditions when typing fast
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      
      debounceTimerRef.current = setTimeout(() => {
        onChangeRef.current(editor.getHTML());
      }, SAVE_DEBOUNCE_MS);
      
      // Check for slash command trigger (no debounce needed)
      const { state } = editor;
      const { selection } = state;
      const { $anchor } = selection;
      
      // Get text before cursor on current line
      const textBefore = $anchor.nodeBefore?.text || '';
      const lineText = textBefore;
      
      // Check if we just typed a slash at the start or after a space
      const slashMatch = lineText.match(/(?:^|\s)\/(\w*)$/);
      
      if (slashMatch) {
        setSlashFilter(slashMatch[1] || '');
        setSelectedIndex(0);
        
        // Get cursor position for menu placement
        const coords = editor.view.coordsAtPos($anchor.pos);
        const containerRect = editorContainerRef.current?.getBoundingClientRect();
        
        if (containerRect) {
          setSlashMenuPosition({
            top: coords.bottom - containerRect.top + 8,
            left: coords.left - containerRect.left,
          });
        }
        
        setShowSlashMenu(true);
      } else {
        setShowSlashMenu(false);
        setSlashFilter('');
      }
    },
    onFocus: () => setIsFocused(true),
    onBlur: ({ event }) => {
      // Don't blur if clicking on slash menu
      if (slashMenuRef.current?.contains(event.relatedTarget)) {
        return;
      }
      setIsFocused(false);
      setShowSlashMenu(false);
      
      // Save immediately on blur (don't wait for debounce)
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (editor) {
        onChangeRef.current(editor.getHTML());
      }
    },
  });

  // Execute a slash command
  const executeSlashCommand = useCallback((cmd) => {
    if (!editor || !cmd) return;

    // Remove the slash and any filter text
    const { state } = editor;
    const { selection } = state;
    const { $anchor } = selection;
    
    // Find and delete the /command text
    const textBefore = $anchor.nodeBefore?.text || '';
    const match = textBefore.match(/(?:^|\s)(\/\w*)$/);
    
    if (match) {
      const deleteFrom = $anchor.pos - match[1].length;
      editor.chain()
        .focus()
        .deleteRange({ from: deleteFrom, to: $anchor.pos })
        .run();
    }

    // Execute the command
    cmd.command(editor);
    setShowSlashMenu(false);
    setSlashFilter('');
  }, [editor]);

  // Keep ref updated
  useEffect(() => {
    executeSlashCommandRef.current = executeSlashCommand;
  }, [executeSlashCommand]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Scroll selected item into view
  useEffect(() => {
    if (showSlashMenu && slashMenuRef.current) {
      const menu = slashMenuRef.current;
      // Index + 1 because the first child is the header
      const selectedItem = menu.children[selectedIndex + 1];
      
      if (selectedItem) {
        selectedItem.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex, showSlashMenu]);

  if (!editor) {
    return null;
  }

  return (
    <div className={`task-editor ${isFocused ? 'focused' : ''}`} ref={editorContainerRef}>
      {/* Floating Bubble Menu - appears on text selection */}
      <BubbleMenu 
        editor={editor} 
        options={{ duration: 150 }}
        className="bubble-menu"
      >
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive('bold') ? 'is-active' : ''}
          title="Bold"
        >
          <span className="material-symbols-outlined">format_bold</span>
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive('italic') ? 'is-active' : ''}
          title="Italic"
        >
          <span className="material-symbols-outlined">format_italic</span>
        </button>
        <button
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={editor.isActive('strike') ? 'is-active' : ''}
          title="Strikethrough"
        >
          <span className="material-symbols-outlined">format_strikethrough</span>
        </button>
        <div className="bubble-divider" />
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={editor.isActive('heading', { level: 1 }) ? 'is-active' : ''}
          title="Heading 1"
        >
          <span className="material-symbols-outlined">format_h1</span>
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={editor.isActive('heading', { level: 2 }) ? 'is-active' : ''}
          title="Heading 2"
        >
          <span className="material-symbols-outlined">format_h2</span>
        </button>
        <div className="bubble-divider" />
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={editor.isActive('bulletList') ? 'is-active' : ''}
          title="Bullet List"
        >
          <span className="material-symbols-outlined">format_list_bulleted</span>
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={editor.isActive('orderedList') ? 'is-active' : ''}
          title="Numbered List"
        >
          <span className="material-symbols-outlined">format_list_numbered</span>
        </button>
        <div className="bubble-divider" />
        <button
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={editor.isActive('codeBlock') ? 'is-active' : ''}
          title="Code Block"
        >
          <span className="material-symbols-outlined">code</span>
        </button>
      </BubbleMenu>

      {/* Table Controls - appears when cursor is in a table */}
      {editor.isActive('table') && (
        <div className="table-controls">
          <div className="table-controls-group">
            <span className="table-controls-label">Row</span>
            <button
              onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().addRowBefore().run(); }}
              title="Add row above"
            >
              <span className="material-symbols-outlined">arrow_upward</span>
            </button>
            <button
              onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().addRowAfter().run(); }}
              title="Add row below"
            >
              <span className="material-symbols-outlined">arrow_downward</span>
            </button>
            <button
              onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().deleteRow().run(); }}
              title="Delete row"
            >
              <span className="material-symbols-outlined">delete</span>
            </button>
          </div>
          <div className="table-controls-divider" />
          <div className="table-controls-group">
            <span className="table-controls-label">Column</span>
            <button
              onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().addColumnBefore().run(); }}
              title="Add column left"
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <button
              onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().addColumnAfter().run(); }}
              title="Add column right"
            >
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>
            <button
              onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().deleteColumn().run(); }}
              title="Delete column"
            >
              <span className="material-symbols-outlined">delete</span>
            </button>
          </div>
          <div className="table-controls-divider" />
          <div className="table-controls-group">
            <button
              onMouseDown={(e) => { 
                e.preventDefault(); 
                editor.chain().focus().toggleHeaderRow().run();
              }}
              title="Toggle header row"
            >
              <span className="material-symbols-outlined">table_rows</span>
              <span className="btn-label">Header</span>
            </button>
            <button
              onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().deleteTable().run(); }}
              className="delete-table"
              title="Delete table"
            >
              <span className="material-symbols-outlined">delete_forever</span>
            </button>
          </div>
        </div>
      )}

      {/* Editor Content */}
      <EditorContent editor={editor} className="task-editor-content" />

      {/* Slash Command Menu */}
      {showSlashMenu && filteredCommands.length > 0 && (
        <div 
          ref={slashMenuRef}
          className="slash-command-menu"
          style={{ top: slashMenuPosition.top, left: slashMenuPosition.left }}
        >
          <div className="slash-menu-header">
            <span className="material-symbols-outlined">add_circle</span>
            <span>Insert block</span>
          </div>
          {filteredCommands.map((cmd, index) => (
            <button
              key={cmd.name}
              className={`slash-command-item ${index === selectedIndex ? 'selected' : ''}`}
              onMouseDown={(e) => {
                e.preventDefault(); // Prevent blur
                executeSlashCommand(cmd);
              }}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <span className="material-symbols-outlined">{cmd.icon}</span>
              <span>{cmd.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default TaskEditor;
