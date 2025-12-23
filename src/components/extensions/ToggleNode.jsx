import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewContent } from '@tiptap/react';
import React from 'react';

// Component for the Node View
const ToggleComponent = ({ node, updateAttributes, extension }) => {
  return (
    <NodeViewWrapper className="toggle-block">
      <details open={node.attrs.open}>
        <summary onClick={(e) => {
            // Let the browser handle the open/close state toggling visually
            // but we might want to sync valid state if needed, though usually native details works fine.
            // However, TipTap might re-render, so updating attributes is safer for persistence.
            e.preventDefault();
            updateAttributes({ open: !node.attrs.open });
        }}>
           <span className="toggle-triangle">▶</span>
           <span className="toggle-summary-placeholder">{!node.attrs.summary && 'Toggle'}</span>
           {/* We can't easily have an editable summary AND content in the same node view structure 
               if we want standard TipTap behavior for the summary. 
               
               A clearer pattern for TipTap is:
               toggle
                 toggleHeader (content: text)
                 toggleContent (content: block+)
               
               But a simpler 'details' approach often treats summary as an attribute or a specific child.
               
               For simplicity/robustness, we'll try a simpler approach first:
               The 'summary' is just an attribute or we use a fixed header.
               
               Actually, a better Notion-like toggle is:
               - Horizontal flex container
               - Triangle button
               - Content area
                 - First line (header)
                 - Nested children (collapsible)
               
               But standard <details> is semantic.
               Let's stick to <details> but maybe just have the summary be the first block?
               
               Refined approach:
               Node: 'toggle'
               Content: 'paragraph block*' (First paragraph is header? No, that's messy)
               
               Let's try the Notion approach:
               Node: 'toggle'
               Content: 'block+'
               
               Visual:
               > [ Block Content ]
                 [ Nested Content ]
                 
               If we simply have a 'toggle' wrapper that contains blocks, 
               and the first block is the "summary" effectively.
               
               Let's go with a dedicated structure:
               toggle
                  toggleSummary (inline)
                  toggleContent (block)
            */
        }
           <span className="toggle-title-text">{node.attrs.summary || 'Toggle'}</span>
        </summary>
        <NodeViewContent className="toggle-content" />
      </details>
    </NodeViewWrapper>
  );
};


// Actually, to fully emulate Notion:
// The Toggle itself is a block. It has valid content.
// The "summary" is essentially the content of the toggle block itself when closed?
// No, Notion toggles are: [Arrow] [Text Block]
//                                   [Nested Blocks]
// 
// So it's like a List Item but collapsible.
// 
// Let's implement a wrapper node 'toggle' that takes a 'summary' attribute for the title?
// Or better:
// content: 'paragraph block*'
// 
// Let's try a standard Node View with:
// attrs: { summary: { default: '' }, open: { default: false } }
// But we want the summary to be rich text editable too?
// 
// Simplest robust v1:
// toggle
//   summary (text/paragraph)
//   content (block+)
// 
// Let's try wrapping the whole thing.

export const ToggleNode = Node.create({
  name: 'toggle',

  group: 'block',

  content: 'block+', // Can contain any blocks

  draggable: true,

  addAttributes() {
    return {
      open: {
        default: true,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'details',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['details', mergeAttributes(HTMLAttributes), 0];
  },

  addNodeView() {
    return ReactNodeViewRenderer(({ node, updateAttributes }) => {
      const handleToggle = (e) => {
        e.preventDefault(); // Prevent default to manage state manually
        updateAttributes({ open: !node.attrs.open });
      };

      return (
        <NodeViewWrapper className={`toggle-wrapper ${node.attrs.open ? 'is-open' : ''}`}>
          <div className="toggle-row">
            <button 
                contentEditable={false} 
                className="toggle-btn"
                onClick={handleToggle}
            >
              <span className="material-symbols-outlined">arrow_right</span>
            </button>
            <div className="toggle-content-root">
               <NodeViewContent className="toggle-inner-content" />
            </div>
          </div>
        </NodeViewWrapper>
      );
    });
  },
  
  addCommands() {
    return {
      setToggle: () => ({ commands }) => {
        return commands.wrapIn(this.name);
      },
      toggleToggle: () => ({ commands }) => {
        return commands.toggleWrap(this.name);
      },
    }
  },
  
  addKeyboardShortcuts() {
      return {
          '> ': () => this.editor.commands.setToggle(),
      }
  }
});

/* 
   Wait, if 'content' is 'block+', then ALL content is inside the NodeViewContent.
   The "button" allows hiding it?
   But Notion toggles have the "Header" always visible, and the "Children" collapsible.
   
   If I just wrap everything in a NodeViewContent, the WHOLE thing will hide/show?
   No, I can't split NodeViewContent easily.
   
   Correct structures for Toggles:
   1. The "List Item" approach (TipTap TaskList uses this).
      ToggleList
        ToggleItem
          Paragraph (Header)
          [Nested Content]
          
   2. The Wrapper approach.
   
   This simple implementation above basically wraps a set of blocks in a container.
   The button toggles the visibility of the "toggle-content-root"?
   
   If I hide "toggle-content-root", then EVERYTHING is hidden, including the "Header".
   
   We need the "Header" to be the FIRST block inside the content, and "Body" be the rest?
   CSS can handle this! 
   
   .toggle-inner-content > :first-child { display: block }
   .toggle-wrapper:not(.open) .toggle-inner-content > :not(:first-child) { display: none }
   
   Yes! That's the smartest CSS-only way to handle "Head + Body" in a single content wrapper.
   The first block is the "Summary", subsequent blocks are "Details".
*/
