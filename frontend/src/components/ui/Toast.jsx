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
      bgColor: 'bg-tv-screen',
      borderColor: 'border-tv-phosphor',
      textColor: 'text-tv-phosphor',
      shadow: 'shadow-tv-glow',
    },
    error: {
      icon: XCircle,
      bgColor: 'bg-tv-screen',
      borderColor: 'border-tv-red',
      textColor: 'text-tv-red',
      shadow: 'shadow-tv-glow-red',
    },
    warning: {
      icon: AlertCircle,
      bgColor: 'bg-tv-screen',
      borderColor: 'border-tv-yellow',
      textColor: 'text-tv-yellow',
      shadow: 'shadow-tv-glow',
    },
    info: {
      icon: Info,
      bgColor: 'bg-tv-screen',
      borderColor: 'border-tv-blue',
      textColor: 'text-tv-blue',
      shadow: 'shadow-tv-glow-blue',
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
              ${config.bgColor} border-2 ${config.borderColor} ${config.shadow}
              p-3 sm:p-4 font-mono
            `}
          >
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Icon */}
              <div className={`flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 border-2 ${config.borderColor} flex items-center justify-center ${config.textColor}`}>
                <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>

              {/* Mensagem */}
              <p className={`flex-1 text-xs sm:text-sm md:text-base font-mono leading-tight ${config.textColor}`}>
                {message}
              </p>

              {/* Botão fechar */}
              <button
                onClick={onClose}
                className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 retro-button hover:bg-tv-beige transition-colors text-tv-black flex items-center justify-center"
              >
                <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            </div>

            {/* Barra de progresso */}
            {duration > 0 && (
              <motion.div
                className={`h-1 bg-tv-phosphor mt-2 sm:mt-3`}
                style={{ boxShadow: '0 0 10px rgba(57, 255, 20, 0.5)' }}
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