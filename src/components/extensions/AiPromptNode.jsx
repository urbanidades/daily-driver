import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { NodeViewWrapper } from '@tiptap/react';
import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2 } from 'lucide-react';

// React component for the AI prompt input
const AiPromptComponent = ({ node, editor, deleteNode, getPos }) => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    // Focus the input when mounted
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleSubmit = async () => {
    if (!prompt.trim() || loading) return;
    
    setLoading(true);
    setError(null);

    try {
      // Call the onSubmit callback passed through node attributes
      const onSubmit = node.attrs.onSubmit;
      if (onSubmit && typeof window[onSubmit] === 'function') {
        const response = await window[onSubmit](prompt);
        
        // Get current position
        const pos = getPos();
        
        // Delete this node and insert the AI response
        editor.chain()
          .focus()
          .deleteRange({ from: pos, to: pos + node.nodeSize })
          .insertContentAt(pos, response)
          .run();
      }
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === 'Escape') {
      deleteNode();
    }
  };

  const handleCancel = () => {
    deleteNode();
  };

  return (
    <NodeViewWrapper className="ai-prompt-inline-wrapper">
      <div className="ai-prompt-inline">
        <div className="ai-prompt-inline-input-container">
          <input
            ref={inputRef}
            type="text"
            className="ai-prompt-inline-input"
            placeholder="Ask AI anything... (Enter to submit, Esc to cancel)"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
          />
          <button
            className="ai-prompt-inline-send"
            onClick={handleSubmit}
            disabled={loading || !prompt.trim()}
          >
            {loading ? (
              <Loader2 size={18} className="spinning" />
            ) : (
              <Send size={18} />
            )}
          </button>
        </div>
        {error && <p className="ai-prompt-inline-error">{error}</p>}
      </div>
    </NodeViewWrapper>
  );
};

// TipTap Node Extension
export const AiPromptNode = Node.create({
  name: 'aiPrompt',
  group: 'block',
  atom: true,
  
  addAttributes() {
    return {
      onSubmit: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-ai-prompt]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-ai-prompt': '' })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(AiPromptComponent);
  },
});

export default AiPromptNode;
