import { motion } from 'framer-motion';
import clsx from 'clsx';

export default function Card({
  children,
  variant = 'default',
  hover = true,
  glow = false,
  className = '',
  ...props
}) {
  const variants = {
    default: 'bg-futura-surface border border-futura-border',
    glass: 'glass',
    elevated: 'bg-futura-elevated border border-futura-border shadow-lg',
    gradient: 'bg-gradient-to-br from-futura-surface to-futura-elevated border border-futura-primary/30',
  };

  const hoverStyles = hover ? 'card-hover' : '';
  const glowStyles = glow ? 'hover:shadow-glow-primary' : '';

  return (
    <motion.div
      className={clsx(
        'rounded-xl p-6',
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