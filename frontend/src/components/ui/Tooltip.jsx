import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

export default function Tooltip({ 
  children, 
  content, 
  position = 'top',
  delay = 200 
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [timeoutId, setTimeoutId] = useState(null);

  const handleMouseEnter = () => {
    const id = setTimeout(() => {
      setIsVisible(true);
    }, delay);
    setTimeoutId(id);
  };

  const handleMouseLeave = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    setIsVisible(false);
  };

  const positions = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  const arrows = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-futura-surface',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-futura-surface',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-futura-surface',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-futura-surface',
  };

  return (
    <div
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      <AnimatePresence>
        {isVisible && content && (
          <motion.div
            className={clsx(
              'absolute z-50 glass-strong rounded-lg px-3 py-2 text-sm text-white border border-futura-primary/30 shadow-glow-primary',
              positions[position]
            )}
            initial={{ opacity: 0, scale: 0.8, y: position === 'top' ? 10 : position === 'bottom' ? -10 : 0 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
          >
            {content}
            {/* Arrow */}
            <div
              className={clsx(
                'absolute w-0 h-0 border-4 border-transparent',
                arrows[position]
              )}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
