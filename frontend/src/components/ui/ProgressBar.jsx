import { motion } from 'framer-motion';
import clsx from 'clsx';

export default function ProgressBar({ 
  value = 0, 
  max = 100, 
  variant = 'primary',
  showLabel = false,
  className = '' 
}) {
  const percentage = Math.min((value / max) * 100, 100);

  const variants = {
    primary: 'from-futura-primary to-futura-secondary',
    accent: 'from-futura-accent to-futura-danger',
    success: 'from-futura-success to-futura-primary',
    warning: 'from-futura-warning to-futura-accent',
  };

  return (
    <div className={clsx('w-full', className)}>
      {showLabel && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-futura-gray-700">Progresso</span>
          <span className="text-sm font-medium text-futura-primary">{Math.round(percentage)}%</span>
        </div>
      )}
      <div className="w-full h-2 bg-futura-surface rounded-full overflow-hidden border border-futura-border">
        <motion.div
          className={clsx(
            'h-full rounded-full bg-gradient-to-r',
            variants[variant],
            'relative overflow-hidden'
          )}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          {/* Shimmer effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
            animate={{
              x: ['-100%', '100%'],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        </motion.div>
      </div>
    </div>
  );
}
