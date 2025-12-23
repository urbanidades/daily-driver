import React, { useRef, useState, useEffect } from 'react';
import { NodeViewWrapper } from '@tiptap/react';

const ResizableImageComponent = ({ node, updateAttributes, selected }) => {
  const [width, setWidth] = useState(node.attrs.width || '100%');
  const imgRef = useRef(null);
  const containerRef = useRef(null);
  
  // Sync internal state with node attributes if they change externally
  useEffect(() => {
    setWidth(node.attrs.width || '100%');
  }, [node.attrs.width]);

  const handleResizeStart = (direction, e) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = imgRef.current ? imgRef.current.offsetWidth : 0;
    
    // We only support pixel width for resizing interaction usually, or convert to %?
    // Let's stick to pixels when resizing, but default is 100%.
    
    const onMouseMove = (moveEvent) => {
      if (!imgRef.current) return;
      
      const currentWidth = startWidth;
      const dx = moveEvent.clientX - startX;
      
      let newWidth;
      if (direction === 'right') {
        newWidth = currentWidth + dx;
      } else {
        newWidth = currentWidth - dx;
      }
      
      // Clamp
      if (newWidth < 100) newWidth = 100;
      // Max ? container width?
      if (containerRef.current && newWidth > containerRef.current.parentElement.offsetWidth) {
          newWidth = containerRef.current.parentElement.offsetWidth;
      }
      
      setWidth(`${newWidth}px`);
    };
    
    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      // Update attributes finally
      updateAttributes({ width: imgRef.current.style.width });
    };
    
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  return (
    <NodeViewWrapper ref={containerRef} className="resizable-image-container" style={{ textAlign: 'left' }}>
      <div 
        className={`resizable-image-wrapper ${selected ? 'is-selected' : ''}`}
        style={{ width: width, maxWidth: '100%', position: 'relative', display: 'inline-block' }}
      >
        <img
          ref={imgRef}
          src={node.attrs.src}
          alt={node.attrs.alt}
          title={node.attrs.title}
          style={{ width: '100%', display: 'block', borderRadius: '8px' }}
        />
        
        {selected && (
           <>
             {/* Right Resize Handle */}
             <div 
               className="image-resize-handle handle-right"
               onMouseDown={(e) => handleResizeStart('right', e)}
             />
             {/* Left Resize Handle */}
             <div 
               className="image-resize-handle handle-left"
               onMouseDown={(e) => handleResizeStart('left', e)}
             />
           </>
        )}
      </div>
    </NodeViewWrapper>
  );
};

export default ResizableImageComponent;
