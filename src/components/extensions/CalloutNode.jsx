import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { NodeViewWrapper, NodeViewContent } from '@tiptap/react';
import React, { useState } from 'react';

// Common emoji options for callouts
const CALLOUT_EMOJIS = ['💡', '⚠️', 'ℹ️', '✅', '❌', '🔥', '⭐', '📝', '🎯', '💬'];

// React component for the Callout block
const CalloutComponent = ({ node, updateAttributes }) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emoji = node.attrs.emoji || '💡';
  const type = node.attrs.type || 'info';

  const handleEmojiClick = (newEmoji) => {
    updateAttributes({ emoji: newEmoji });
    setShowEmojiPicker(false);
  };

  return (
    <NodeViewWrapper className={`callout-block callout-${type}`}>
      <div className="callout-emoji-container">
        <button 
          className="callout-emoji"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          contentEditable={false}
        >
          {emoji}
        </button>
        {showEmojiPicker && (
          <div className="callout-emoji-picker" contentEditable={false}>
            {CALLOUT_EMOJIS.map((e) => (
              <button key={e} onClick={() => handleEmojiClick(e)}>
                {e}
              </button>
            ))}
          </div>
        )}
      </div>
      <NodeViewContent className="callout-content" />
    </NodeViewWrapper>
  );
};

// TipTap Node Extension
export const CalloutNode = Node.create({
  name: 'callout',
  group: 'block',
  content: 'inline*',

  addAttributes() {
    return {
      emoji: {
        default: '💡',
      },
      type: {
        default: 'info', // info, warning, tip, error
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="callout"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'callout' }), 0];
  },

  addNodeView() {
    return ReactNodeViewRenderer(CalloutComponent);
  },

  addCommands() {
    return {
      setCallout:
        (attributes) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: attributes,
            content: [{ type: 'text', text: 'Type your callout here...' }],
          });
        },
    };
  },
});
