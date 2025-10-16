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
      color: 'from-green-500 to-emerald-600',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/30',
      textColor: 'text-green-500',
    },
    error: {
      icon: XCircle,
      color: 'from-red-500 to-pink-600',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/30',
      textColor: 'text-red-500',
    },
    warning: {
      icon: AlertCircle,
      color: 'from-yellow-500 to-orange-600',
      bgColor: 'bg-yellow-500/10',
      borderColor: 'border-yellow-500/30',
      textColor: 'text-yellow-500',
    },
    info: {
      icon: Info,
      color: 'from-blue-500 to-cyan-600',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/30',
      textColor: 'text-blue-500',
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
              glass backdrop-blur-xl rounded-xl sm:rounded-2xl p-3 sm:p-4 border-2 shadow-2xl
              ${config.bgColor} ${config.borderColor}
            `}
          >
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Icon com gradiente */}
              <div className={`flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br ${config.color} p-1.5 sm:p-2 flex items-center justify-center shadow-lg`}>
                <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>

              {/* Mensagem */}
              <p className="flex-1 text-xs sm:text-sm md:text-base font-medium text-gray-900 dark:text-white leading-tight">
                {message}
              </p>

              {/* Botão fechar */}
              <button
                onClick={onClose}
                className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full hover:bg-white/10 dark:hover:bg-black/10 transition-colors flex items-center justify-center"
              >
                <X className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-600 dark:text-gray-400" />
              </button>
            </div>

            {/* Barra de progresso */}
            {duration > 0 && (
              <motion.div
                className={`h-0.5 sm:h-1 bg-gradient-to-r ${config.color} rounded-full mt-2 sm:mt-3`}
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
