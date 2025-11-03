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
    success: 'bg-tv-screen/50 text-tv-phosphor border-tv-phosphor tv-text-glow',
    warning: 'bg-tv-screen/50 text-tv-yellow border-tv-yellow',
    danger: 'bg-tv-screen/50 text-tv-red border-tv-red',
    info: 'bg-tv-screen/50 text-tv-blue border-tv-blue',
    retro: 'retro-bg text-tv-black border-tv-beige-dark',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs font-mono',
    md: 'px-3 py-1 text-sm font-mono',
    lg: 'px-4 py-1.5 text-base font-mono',
  };

  const glowStyles = glow ? 'shadow-tv-glow' : '';

  return (
    <motion.span
      className={clsx(
        'inline-flex items-center justify-center font-semibold border-2',
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