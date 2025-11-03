import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

const Toast = ({ message, type = 'info', isOpen, onClose, duration = 3000 }) => {
  useEffect(() => {
    if (isOpen && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isOpen, duration, onClose]);

  const variants = {
    success: {
      icon: CheckCircle,
      bgColor: 'bg-futura-success/20',
      borderColor: 'border-futura-success',
      textColor: 'text-futura-success',
      iconBg: 'bg-futura-success',
    },
    error: {
      icon: XCircle,
      bgColor: 'bg-futura-danger/20',
      borderColor: 'border-futura-danger',
      textColor: 'text-futura-danger',
      iconBg: 'bg-futura-danger',
    },
    warning: {
      icon: AlertCircle,
      bgColor: 'bg-futura-warning/20',
      borderColor: 'border-futura-warning',
      textColor: 'text-futura-warning',
      iconBg: 'bg-futura-warning',
    },
    info: {
      icon: Info,
      bgColor: 'bg-futura-primary/20',
      borderColor: 'border-futura-primary',
      textColor: 'text-futura-primary',
      iconBg: 'bg-futura-primary',
    },
  };

  const config = variants[type] || variants.info;
  const Icon = config.icon;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -100, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -100, scale: 0.8 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed top-3 left-3 right-3 sm:left-1/2 sm:right-auto sm:top-4 sm:transform sm:-translate-x-1/2 z-[9999] sm:w-[calc(100%-2rem)] sm:max-w-md"
        >
          <div
            className={`
              glass-strong backdrop-blur-xl rounded-xl sm:rounded-2xl p-3 sm:p-4 border-2 shadow-2xl
              ${config.bgColor} ${config.borderColor}
            `}
          >
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Icon */}
              <div className={`flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full ${config.iconBg} p-1.5 sm:p-2 flex items-center justify-center shadow-lg`}>
                <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>

              {/* Message */}
              <p className={`flex-1 text-xs sm:text-sm md:text-base font-medium leading-tight ${config.textColor}`}>
                {message}
              </p>

              {/* Close Button */}
              <button
                onClick={onClose}
                className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full hover:bg-white/10 transition-colors flex items-center justify-center"
              >
                <X className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-futura-gray-700" />
              </button>
            </div>

            {/* Progress Bar */}
            {duration > 0 && (
              <motion.div
                className={`h-1 ${config.iconBg} rounded-full mt-2 sm:mt-3`}
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: duration / 1000, ease: 'linear' }}
              />
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Toast;