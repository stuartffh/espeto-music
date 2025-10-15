import { motion } from 'framer-motion';
import clsx from 'clsx';

export default function Card({
  children,
  variant = 'glass',
  hover = true,
  glow = false,
  className = '',
  ...props
}) {
  const variants = {
    default: 'bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border',
    glass: 'glass',
    bordered: 'bg-transparent border-2 border-neon-cyan/30',
    elevated: 'bg-white dark:bg-dark-elevated shadow-2xl',
  };

  const hoverStyles = hover ? 'hover:scale-[1.02] transition-transform' : '';
  const glowStyles = glow ? 'hover:shadow-neon-cyan' : '';

  return (
    <motion.div
      className={clsx(
        'rounded-lg p-6',
        variants[variant],
        hoverStyles,
        glowStyles,
        className
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
