import React, { useState } from 'react';
import { useSwipeable } from 'react-swipeable';
import { Check, Trash2 } from 'lucide-react';
import haptic from '../utils/haptics';
import './SwipeableTaskItem.css';

/**
 * SwipeableTaskItem - Wraps task items with swipe gestures
 * - Swipe Left: Delete task (reveals red background)
 * - Swipe Right: Complete task (reveals green background)
 */
export function SwipeableTaskItem({ 
  task, 
  onComplete, 
  onDelete, 
  onClick, 
  children,
  isSelected 
}) {
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  
  const THRESHOLD = 80; // Minimum swipe distance to trigger action
  const MAX_OFFSET = 120; // Maximum swipe distance

  const handlers = useSwipeable({
    onSwiping: (e) => {
      setIsSwiping(true);
      // Clamp the offset
      const offset = Math.max(-MAX_OFFSET, Math.min(MAX_OFFSET, e.deltaX));
      setSwipeOffset(offset);
      
      // Haptic when threshold is crossed
      if (Math.abs(offset) >= THRESHOLD && Math.abs(swipeOffset) < THRESHOLD) {
        haptic.selection();
      }
    },
    onSwipedLeft: (e) => {
      if (Math.abs(swipeOffset) >= THRESHOLD) {
        haptic.warning();
        onDelete?.(task);
      }
      setSwipeOffset(0);
      setIsSwiping(false);
    },
    onSwipedRight: (e) => {
      if (swipeOffset >= THRESHOLD) {
        haptic.success();
        onComplete?.(task);
      }
      setSwipeOffset(0);
      setIsSwiping(false);
    },
    onTouchEndOrOnMouseUp: () => {
      if (Math.abs(swipeOffset) < THRESHOLD) {
        setSwipeOffset(0);
      }
      setIsSwiping(false);
    },
    trackMouse: false,
    trackTouch: true,
    preventScrollOnSwipe: true,
    delta: 10,
  });

  const handleClick = (e) => {
    // Only trigger click if not swiping
    if (!isSwiping && Math.abs(swipeOffset) < 10) {
      onClick?.(task);
    }
  };

  // Calculate background reveal based on swipe direction
  const isSwipingRight = swipeOffset > 0;
  const isSwipingLeft = swipeOffset < 0;
  const progress = Math.min(Math.abs(swipeOffset) / THRESHOLD, 1);

  return (
    <div className="swipeable-task-wrapper">
      {/* Background actions */}
      <div className={`swipe-background ${isSwipingRight ? 'complete' : ''} ${isSwipingLeft ? 'delete' : ''}`}>
        {isSwipingRight && (
          <div className="swipe-action complete-action" style={{ opacity: progress }}>
            <Check size={24} />
            <span>Complete</span>
          </div>
        )}
        {isSwipingLeft && (
          <div className="swipe-action delete-action" style={{ opacity: progress }}>
            <span>Delete</span>
            <Trash2 size={24} />
          </div>
        )}
      </div>
      
      {/* Task content */}
      <div 
        {...handlers}
        className={`swipeable-task-content ${isSelected ? 'selected' : ''}`}
        style={{ 
          transform: `translateX(${swipeOffset}px)`,
          transition: isSwiping ? 'none' : 'transform 0.2s ease-out'
        }}
        onClick={handleClick}
      >
        {children}
      </div>
    </div>
  );
}

export default SwipeableTaskItem;
