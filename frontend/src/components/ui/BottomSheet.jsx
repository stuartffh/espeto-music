import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import clsx from 'clsx';

export default function BottomSheet({
  isOpen,
  onClose,
  title,
  children,
  className = '',
}) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }

    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Bottom Sheet */}
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-50 glass-strong rounded-t-2xl border-t border-futura-primary/30 max-h-[90vh] flex flex-col shadow-2xl"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-12 h-1.5 bg-futura-border rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-6 pb-4 border-b border-futura-border">
              <h2 className="text-xl font-bold gradient-text-primary">{title}</h2>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-futura-surface transition-colors text-futura-gray-700 hover:text-futura-primary"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className={clsx('flex-1 overflow-y-auto p-6', className)}>
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}