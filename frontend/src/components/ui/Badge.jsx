import { motion } from 'framer-motion';
import clsx from 'clsx';

export default function Badge({
  children,
  variant = 'primary',
  size = 'md',
  pulse = false,
  glow = false,
  className = '',
}) {
  const variants = {
    primary: 'bg-futura-primary/20 text-futura-primary border border-futura-primary/30',
    secondary: 'bg-futura-secondary/20 text-futura-secondary border border-futura-secondary/30',
    accent: 'bg-futura-accent/20 text-futura-accent border border-futura-accent/30',
    success: 'bg-futura-success/20 text-futura-success border border-futura-success/30',
    warning: 'bg-futura-warning/20 text-futura-warning border border-futura-warning/30',
    danger: 'bg-futura-danger/20 text-futura-danger border border-futura-danger/30',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base',
  };

  const glowStyles = glow ? 'shadow-glow-primary' : '';

  return (
    <motion.span
      className={clsx(
        'inline-flex items-center justify-center font-semibold rounded-full border',
        variants[variant],
        sizes[size],
        glowStyles,
        className
      )}
      animate={pulse ? { scale: [1, 1.05, 1] } : {}}
      transition={pulse ? { repeat: Infinity, duration: 2 } : {}}
    >
      {children}
    </motion.span>
  );
}