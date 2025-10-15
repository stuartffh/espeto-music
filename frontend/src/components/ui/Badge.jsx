import { motion } from 'framer-motion';
import clsx from 'clsx';

export default function Badge({
  children,
  variant = 'info',
  size = 'md',
  pulse = false,
  glow = false,
  className = '',
}) {
  const variants = {
    success: 'bg-neon-green/20 text-neon-green border-neon-green',
    warning: 'bg-neon-yellow/20 text-neon-yellow border-neon-yellow',
    danger: 'bg-neon-pink/20 text-neon-pink border-neon-pink',
    info: 'bg-neon-cyan/20 text-neon-cyan border-neon-cyan',
    neon: 'bg-neon-purple/20 text-neon-purple border-neon-purple',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base',
  };

  const glowStyles = glow ? 'shadow-lg' : '';

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
