import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { ResizableImage } from './extensions/ResizableImage';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableCell } from '@tiptap/extension-table-cell';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Highlight from '@tiptap/extension-highlight';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';
import { AiPromptNode } from './extensions/AiPromptNode';
import { CalloutNode } from './extensions/CalloutNode';
import { ToggleNode } from './extensions/ToggleNode';
import { uploadImage } from '../utils/upload';
import './TaskEditor.css';

const lowlight = createLowlight(common);

// Base slash command options (static)
const BASE_SLASH_COMMANDS = [
  { 
    name: 'Heading 1', 
    icon: 'format_h1', 
    description: 'Big section heading',
    command: (editor) => editor.chain().focus().toggleHeading({ level: 1 }).run() 
  },
  { 
    name: 'Heading 2', 
    icon: 'format_h2', 
    description: 'Medium section heading',
    command: (editor) => editor.chain().focus().toggleHeading({ level: 2 }).run() 
  },
  { 
    name: 'To-do', 
    icon: 'check_box', 
    description: 'Track tasks with checkboxes',
    command: (editor) => editor.chain().focus().toggleTaskList().run() 
  },
  { 
    name: 'Bullet List', 
    icon: 'format_list_bulleted', 
    description: 'Create a simple bulleted list',
    command: (editor) => editor.chain().focus().toggleBulletList().run() 
  },
  { 
    name: 'Numbered List', 
    icon: 'format_list_numbered', 
    description: 'Create a list with numbering',
    command: (editor) => editor.chain().focus().toggleOrderedList().run() 
  },
  { 
    name: 'Highlight', 
    icon: 'border_color', 
    description: 'Mark text for emphasis',
    command: (editor) => editor.chain().focus().toggleHighlight().run() 
  },
  { 
    name: 'Code Block', 
    icon: 'code', 
    description: 'Code snippet with syntax highlighting',
    command: (editor) => editor.chain().focus().toggleCodeBlock().run() 
  },
  { 
    name: 'Quote', 
    icon: 'format_quote', 
    description: 'Capture a quote',
    command: (editor) => editor.chain().focus().toggleBlockquote().run() 
  },
  { 
    name: 'Callout', 
    icon: 'lightbulb', 
    description: 'Make writing stand out',
    command: (editor) => editor.chain().focus().setCallout().run() 
  },
  { 
    name: 'Divider', 
    icon: 'horizontal_rule', 
    description: 'Visually separate sections',
    command: (editor) => editor.chain().focus().setHorizontalRule().run() 
  },
  { 
    name: 'Table', 
    icon: 'table_chart', 
    description: 'Add a table for structured data',
    command: (editor) => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run() 
  },
  { 
    name: 'Toggle', 
    icon: 'expand_more', 
    description: 'Collapsible section',
    description: 'Collapsible section',
    command: (editor) => editor.chain().focus().setToggle().run() 
  },
  { 
    name: 'Image', 
    icon: 'image', 
    description: 'Upload or embed image',
    command: () => document.getElementById('image-upload-trigger').click() 
  },
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
  const [hoveredBlockPos, setHoveredBlockPos] = useState(null);
  const [blockControlsPos, setBlockControlsPos] = useState({ top: 0 });
  const [showBlockMenu, setShowBlockMenu] = useState(false);
  const [showTurnIntoMenu, setShowTurnIntoMenu] = useState(false);
  const [lockedBlockPos, setLockedBlockPos] = useState(null);
  const [lockedControlsPos, setLockedControlsPos] = useState({ top: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragBlockPos, setDragBlockPos] = useState(null);
  const [dropIndicatorTop, setDropIndicatorTop] = useState(null);
  const slashMenuRef = useRef(null);
  const editorContainerRef = useRef(null);
  const blockMenuRef = useRef(null);
  const blockControlsRef = useRef(null);
  const dragNodeRef = useRef(null);
  
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
      StarterKit.configure({
        codeBlock: false,
      }),
      Placeholder.configure({
        placeholder,
      }),
      Highlight.configure({ multicolor: true }),
      CodeBlockLowlight.configure({
        lowlight,
      }),
      ResizableImage,
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      CalloutNode,
      ToggleNode,
      AiPromptNode,
    ],
    // Initial content - only used on mount (uncontrolled)
    content: content || '',
    content: content || '',
    editorProps: {
      handlePaste: (view, event) => {
        const item = event.clipboardData?.items[0];
        if (item?.type.indexOf('image') === 0) {
          event.preventDefault();
          const file = item.getAsFile();
          
          if (file) {
            uploadImage(file).then(url => {
              if (url) {
                const { schema } = view.state;
                const node = schema.nodes.image.create({ src: url });
                const transaction = view.state.tr.replaceSelectionWith(node);
                view.dispatch(transaction);
              }
            });
            return true;
          }
        }
        return false;
      },
      handleDrop: (view, event, slice, moved) => {
        if (!moved && event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0]) {
          const file = event.dataTransfer.files[0];
          if (file.type.indexOf('image') === 0) {
            event.preventDefault();
            
            uploadImage(file).then(url => {
              if (url) {
                const { schema } = view.state;
                const coordinates = view.posAtCoords({ left: event.clientX, top: event.clientY });
                if (coordinates) {
                  const node = schema.nodes.image.create({ src: url });
                  const transaction = view.state.tr.insert(coordinates.pos, node);
                  view.dispatch(transaction);
                }
              }
            });
            return true;
          }
        }
        return false;
      },
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

  // Sync content when prop changes (from real-time updates)
  useEffect(() => {
    // Check if content is truly different to avoid loops
    if (editor && content !== undefined && content !== editor.getHTML()) {
      // We accept updates even if focused, to ensure other devices see changes.
      // We try to preserve the cursor position.
      
      const { from, to } = editor.state.selection;
      
      // Store current scroll position
      const { scrollTop } = editor.view.dom;
      
      editor.commands.setContent(content);
      
      // Restore cursor and scroll if focused
      if (isFocused) {
        editor.commands.setTextSelection({ from, to });
        // Attempt to restore scroll (might need requestAnimationFrame)
        requestAnimationFrame(() => {
           if (editor.view.dom) editor.view.dom.scrollTop = scrollTop;
        });
      }
    }
  }, [editor, content, isFocused]);

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

  // Handle mouse move to detect hovered block
  const handleEditorMouseMove = useCallback((e) => {
    // Don't update hover position if menu is open (position is locked)
    if (showBlockMenu) return;
    
    if (!editor || !editorContainerRef.current) return;
    
    const editorElement = editorContainerRef.current.querySelector('.ProseMirror');
    if (!editorElement) return;
    
    // Find the block element at the mouse position
    const rect = editorContainerRef.current.getBoundingClientRect();
    const y = e.clientY;
    
    // Get all top-level block elements
    const blocks = editorElement.children;
    let foundBlock = null;
    let blockTop = 0;
    
    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      const blockRect = block.getBoundingClientRect();
      
      if (y >= blockRect.top && y <= blockRect.bottom) {
        foundBlock = block;
        blockTop = blockRect.top - rect.top;
        break;
      }
    }
    
    if (foundBlock) {
      // Get the position in the document
      const pos = editor.view.posAtDOM(foundBlock, 0);
      setHoveredBlockPos(pos);
      setBlockControlsPos({ top: blockTop });
    } else {
      setHoveredBlockPos(null);
    }
  }, [editor, showBlockMenu]);

  // Handle mouse leave from editor area
  const handleEditorMouseLeave = useCallback(() => {
    // If menu is open, don't hide controls (they're locked)
    if (showBlockMenu) return;
    
    // Small delay to allow clicking controls
    setTimeout(() => {
      if (!blockControlsRef.current?.matches(':hover')) {
        setHoveredBlockPos(null);
      }
    }, 100);
  }, [showBlockMenu]);

  // Handle mouse leave from controls area (close menu)
  const handleControlsMouseLeave = useCallback(() => {
    setTimeout(() => {
      if (!blockControlsRef.current?.matches(':hover') && !blockMenuRef.current?.matches(':hover')) {
        setShowBlockMenu(false);
        setLockedBlockPos(null);
        setHoveredBlockPos(null);
      }
    }, 150);
  }, []);

  // Handle plus button click - insert new paragraph and focus
  const handlePlusClick = useCallback(() => {
    if (!editor || hoveredBlockPos === null) return;
    
    // Insert a new paragraph after the current block
    const resolvedPos = editor.state.doc.resolve(hoveredBlockPos);
    const endOfBlock = resolvedPos.end();
    
    editor.chain()
      .focus()
      .insertContentAt(endOfBlock + 1, { type: 'paragraph' })
      .setTextSelection(endOfBlock + 2)
      .run();
    
    // Trigger slash menu
    setTimeout(() => {
      editor.commands.insertContent('/');
    }, 10);
  }, [editor, hoveredBlockPos]);

  // Handle block menu toggle - lock position when opening
  const handleBlockMenuToggle = useCallback(() => {
    if (!showBlockMenu) {
      // Opening menu - lock the current position
      setLockedBlockPos(hoveredBlockPos);
      setLockedControlsPos(blockControlsPos);
    } else {
      // Closing menu - unlock
      setLockedBlockPos(null);
    }
    setShowBlockMenu(prev => !prev);
  }, [showBlockMenu, hoveredBlockPos, blockControlsPos]);

  // Get the effective block position (locked or hovered)
  const effectiveBlockPos = showBlockMenu ? lockedBlockPos : hoveredBlockPos;
  const effectiveControlsPos = showBlockMenu ? lockedControlsPos : blockControlsPos;

  // Handle duplicate block
  const handleDuplicateBlock = useCallback(() => {
    if (!editor || effectiveBlockPos === null) return;
    
    const resolvedPos = editor.state.doc.resolve(effectiveBlockPos);
    const node = resolvedPos.parent;
    const endOfBlock = resolvedPos.end();
    
    // Get the current block's content and duplicate it
    editor.chain()
      .focus()
      .insertContentAt(endOfBlock + 1, node.toJSON())
      .run();
    
    setShowBlockMenu(false);
    setLockedBlockPos(null);
  }, [editor, effectiveBlockPos]);

  // Handle delete block
  const handleDeleteBlock = useCallback(() => {
    if (!editor || effectiveBlockPos === null) return;
    
    const resolvedPos = editor.state.doc.resolve(effectiveBlockPos);
    const start = resolvedPos.before();
    const end = resolvedPos.after();
    
    editor.chain()
      .focus()
      .deleteRange({ from: start, to: end })
      .run();
    
    setShowBlockMenu(false);
    setShowTurnIntoMenu(false);
    setLockedBlockPos(null);
    setHoveredBlockPos(null);
  }, [editor, effectiveBlockPos]);

  // Handle move block up
  const handleMoveUp = useCallback(() => {
    if (!editor || effectiveBlockPos === null) return;
    
    try {
      const resolvedPos = editor.state.doc.resolve(effectiveBlockPos);
      const nodeStart = resolvedPos.before();
      
      // Can't move up if already at the top
      if (nodeStart <= 1) {
        setShowBlockMenu(false);
        return;
      }
      
      // Get the previous node's position
      const prevPos = editor.state.doc.resolve(nodeStart - 1);
      const prevStart = prevPos.before();
      
      // Get current node JSON
      const currentNode = resolvedPos.parent.toJSON();
      const currentEnd = resolvedPos.after();
      
      // Delete current and insert before previous
      editor.chain()
        .deleteRange({ from: nodeStart, to: currentEnd })
        .insertContentAt(prevStart, currentNode)
        .run();
    } catch (err) {
      console.error('Move up error:', err);
    }
    
    setShowBlockMenu(false);
    setLockedBlockPos(null);
  }, [editor, effectiveBlockPos]);

  // Handle move block down
  const handleMoveDown = useCallback(() => {
    if (!editor || effectiveBlockPos === null) return;
    
    try {
      const resolvedPos = editor.state.doc.resolve(effectiveBlockPos);
      const nodeStart = resolvedPos.before();
      const nodeEnd = resolvedPos.after();
      
      // Can't move down if already at the bottom
      if (nodeEnd >= editor.state.doc.content.size - 1) {
        setShowBlockMenu(false);
        return;
      }
      
      // Get the next node's end position
      const nextPos = editor.state.doc.resolve(nodeEnd + 1);
      const nextEnd = nextPos.after();
      
      // Get current node JSON
      const currentNode = resolvedPos.parent.toJSON();
      
      // Delete current and insert after next
      editor.chain()
        .deleteRange({ from: nodeStart, to: nodeEnd })
        .insertContentAt(nextEnd - (nodeEnd - nodeStart), currentNode)
        .run();
    } catch (err) {
      console.error('Move down error:', err);
    }
    
    setShowBlockMenu(false);
    setLockedBlockPos(null);
  }, [editor, effectiveBlockPos]);

  // Handle turn into different block type
  const handleTurnInto = useCallback((type) => {
    if (!editor || effectiveBlockPos === null) return;
    
    try {
      // Get the block range and select all content in it
      const resolvedPos = editor.state.doc.resolve(effectiveBlockPos);
      const start = resolvedPos.start();
      const end = resolvedPos.end();
      
      // Select the entire block content first
      editor.chain().focus().setTextSelection({ from: start, to: end }).run();
      
      // Apply transformation based on type
      switch (type) {
        case 'paragraph':
          editor.chain().focus().setParagraph().run();
          break;
        case 'heading1':
          editor.chain().focus().setHeading({ level: 1 }).run();
          break;
        case 'heading2':
          editor.chain().focus().setHeading({ level: 2 }).run();
          break;
        case 'bulletList':
          editor.chain().focus().toggleBulletList().run();
          break;
        case 'orderedList':
          editor.chain().focus().toggleOrderedList().run();
          break;
        case 'blockquote':
          editor.chain().focus().toggleBlockquote().run();
          break;
        case 'codeBlock':
          editor.chain().focus().toggleCodeBlock().run();
          break;
        default:
          break;
      }
    } catch (err) {
      console.error('Turn into error:', err);
    }
    
    setShowBlockMenu(false);
    setShowTurnIntoMenu(false);
    setLockedBlockPos(null);
  }, [editor, effectiveBlockPos]);

  // Drag and Drop handlers
  const handleDragStart = useCallback((e) => {
    if (!editor || hoveredBlockPos === null) return;
    
    try {
      // Store drag info
      const resolvedPos = editor.state.doc.resolve(hoveredBlockPos);
      const node = resolvedPos.parent;
      
      // Store in refs for reliable access
      dragNodeRef.current = {
        json: node.toJSON(),
        sourcePos: hoveredBlockPos,
        sourceStart: resolvedPos.before(),
        sourceEnd: resolvedPos.after()
      };
      
      setIsDragging(true);
      setDragBlockPos(hoveredBlockPos);
      setShowBlockMenu(false);
      setShowTurnIntoMenu(false);
      
      // Set drag data
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', 'block-drag');
    } catch (err) {
      console.error('Drag start error:', err);
      cleanupDrag();
    }
  }, [editor, hoveredBlockPos]);

  const cleanupDrag = useCallback(() => {
    setIsDragging(false);
    setDragBlockPos(null);
    setDropIndicatorTop(null);
    dragNodeRef.current = null;
  }, []);

  const handleDragOver = useCallback((e) => {
    if (!isDragging || !editorContainerRef.current) return;
    
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    const editorElement = editorContainerRef.current.querySelector('.ProseMirror');
    if (!editorElement) return;
    
    const rect = editorContainerRef.current.getBoundingClientRect();
    const y = e.clientY;
    
    // Find drop position
    const blocks = Array.from(editorElement.children);
    let dropTop = null;
    
    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      const blockRect = block.getBoundingClientRect();
      const midY = blockRect.top + blockRect.height / 2;
      
      if (y < midY) {
        dropTop = blockRect.top - rect.top;
        break;
      }
      if (i === blocks.length - 1) {
        dropTop = blockRect.bottom - rect.top;
      }
    }
    
    setDropIndicatorTop(dropTop);
  }, [isDragging]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    
    if (!isDragging || !editor || !dragNodeRef.current) {
      cleanupDrag();
      return;
    }
    
    try {
      const editorElement = editorContainerRef.current?.querySelector('.ProseMirror');
      if (!editorElement) {
        cleanupDrag();
        return;
      }
      
      const y = e.clientY;
      const dragData = dragNodeRef.current;
      
      // Find target block
      const blocks = Array.from(editorElement.children);
      let insertBefore = true;
      let targetBlockIndex = 0;
      
      for (let i = 0; i < blocks.length; i++) {
        const blockRect = blocks[i].getBoundingClientRect();
        const midY = blockRect.top + blockRect.height / 2;
        
        if (y < midY) {
          targetBlockIndex = i;
          insertBefore = true;
          break;
        }
        targetBlockIndex = i;
        insertBefore = false;
      }
      
      // Get target position
      const targetBlock = blocks[targetBlockIndex];
      if (!targetBlock) {
        cleanupDrag();
        return;
      }
      
      const targetPos = editor.view.posAtDOM(targetBlock, 0);
      const targetResolved = editor.state.doc.resolve(targetPos);
      const targetInsertPos = insertBefore ? targetResolved.before() : targetResolved.after();
      
      // Don't move if dropping in same position
      if (targetInsertPos === dragData.sourceStart || targetInsertPos === dragData.sourceEnd) {
        cleanupDrag();
        return;
      }
      
      // Perform the move
      const { json, sourceStart, sourceEnd } = dragData;
      
      if (targetInsertPos < sourceStart) {
        // Moving up
        editor.chain()
          .deleteRange({ from: sourceStart, to: sourceEnd })
          .insertContentAt(targetInsertPos, json)
          .run();
      } else {
        // Moving down - adjust for deleted content
        const adjustedPos = targetInsertPos - (sourceEnd - sourceStart);
        editor.chain()
          .deleteRange({ from: sourceStart, to: sourceEnd })
          .insertContentAt(adjustedPos, json)
          .run();
      }
    } catch (err) {
      console.error('Drop error:', err);
    }
    
    cleanupDrag();
  }, [isDragging, editor, cleanupDrag]);

  const handleDragEnd = useCallback(() => {
    cleanupDrag();
  }, [cleanupDrag]);

  // Global dragend listener for cleanup when drag ends outside
  useEffect(() => {
    const handleGlobalDragEnd = () => {
      if (isDragging) {
        cleanupDrag();
      }
    };
    
    document.addEventListener('dragend', handleGlobalDragEnd);
    return () => document.removeEventListener('dragend', handleGlobalDragEnd);
  }, [isDragging, cleanupDrag]);

  if (!editor) {
    return null;
  }

  // Show controls if hovered OR if menu is open with locked position
  const showControls = (hoveredBlockPos !== null || (showBlockMenu && lockedBlockPos !== null)) && !isDragging;

  return (
    <div 
      className={`task-editor ${isFocused ? 'focused' : ''} ${isDragging ? 'is-dragging' : ''}`} 
      ref={editorContainerRef}
      onMouseMove={handleEditorMouseMove}
      onMouseLeave={handleEditorMouseLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onDragEnd={handleDragEnd}
    >
      {/* Hidden File Input for Image Upload */}
      <input 
        type="file" 
        id="image-upload-trigger" 
        style={{ display: 'none' }} 
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file && editor) {
            uploadImage(file).then(url => {
              if (url) {
                editor.chain().focus().setImage({ src: url }).run();
              }
            });
            e.target.value = ''; // Reset
          }
        }}
      />

      {/* Drop Indicator */}
      {isDragging && dropIndicatorTop !== null && (
        <div 
          className="drop-indicator"
          style={{ top: dropIndicatorTop }}
        />
      )}

      {/* Block Controls - appears on hover */}
      {showControls && (
        <div 
          className="block-controls"
          style={{ top: effectiveControlsPos.top }}
          ref={blockControlsRef}
          onMouseLeave={handleControlsMouseLeave}
        >
          <button 
            className="block-control-btn block-add-btn"
            onClick={handlePlusClick}
            title="Add block below"
          >
            <span className="material-symbols-outlined">add</span>
          </button>
          <button 
            className="block-control-btn block-move-btn"
            onClick={handleMoveUp}
            title="Move up"
          >
            <span className="material-symbols-outlined">arrow_upward</span>
          </button>
          <button 
            className="block-control-btn block-move-btn"
            onClick={handleMoveDown}
            title="Move down"
          >
            <span className="material-symbols-outlined">arrow_downward</span>
          </button>
          <div 
            className={`block-control-btn block-drag-btn ${showBlockMenu ? 'active' : ''}`}
            onClick={handleBlockMenuToggle}
            title="More options"
          >
            <span className="material-symbols-outlined">more_horiz</span>
          </div>
          
          {/* Block Menu Dropdown */}
          {showBlockMenu && (
            <div className="block-menu" ref={blockMenuRef}>
              <div 
                className="block-menu-item has-submenu"
                onMouseEnter={() => setShowTurnIntoMenu(true)}
                onMouseLeave={() => setShowTurnIntoMenu(false)}
              >
                <button>
                  <span className="material-symbols-outlined">sync_alt</span>
                  Turn into
                  <span className="material-symbols-outlined submenu-arrow">chevron_right</span>
                </button>
                
                {/* Turn Into Submenu */}
                {showTurnIntoMenu && (
                  <div className="block-submenu">
                    <button onClick={() => handleTurnInto('paragraph')}>
                      <span className="material-symbols-outlined">notes</span>
                      Text
                    </button>
                    <button onClick={() => handleTurnInto('heading1')}>
                      <span className="material-symbols-outlined">format_h1</span>
                      Heading 1
                    </button>
                    <button onClick={() => handleTurnInto('heading2')}>
                      <span className="material-symbols-outlined">format_h2</span>
                      Heading 2
                    </button>
                    <button onClick={() => handleTurnInto('bulletList')}>
                      <span className="material-symbols-outlined">format_list_bulleted</span>
                      Bullet List
                    </button>
                    <button onClick={() => handleTurnInto('orderedList')}>
                      <span className="material-symbols-outlined">format_list_numbered</span>
                      Numbered List
                    </button>
                    <button onClick={() => handleTurnInto('blockquote')}>
                      <span className="material-symbols-outlined">format_quote</span>
                      Quote
                    </button>
                    <button onClick={() => handleTurnInto('codeBlock')}>
                      <span className="material-symbols-outlined">code</span>
                      Code
                    </button>
                  </div>
                )}
              </div>
              
              <button onClick={handleDuplicateBlock}>
                <span className="material-symbols-outlined">content_copy</span>
                Duplicate
              </button>
              <button onClick={handleDeleteBlock} className="delete">
                <span className="material-symbols-outlined">delete</span>
                Delete
              </button>
            </div>
          )}
        </div>
      )}

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
        <button
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          className={editor.isActive('highlight') ? 'is-active' : ''}
          title="Highlight"
        >
          <span className="material-symbols-outlined">border_color</span>
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
              <div className="slash-command-icon">
                <span className="material-symbols-outlined">{cmd.icon}</span>
              </div>
              <div className="slash-command-text">
                <div className="slash-command-name">{cmd.name}</div>
                {cmd.description && <div className="slash-command-desc">{cmd.description}</div>}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default TaskEditor;
