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
    default: 'retro-card',
    glass: 'tv-screen border-tv-beige',
    bordered: 'bg-tv-screen border-2 border-tv-phosphor',
    elevated: 'retro-card shadow-tv-glow',
    retro: 'retro-card',
  };

  const hoverStyles = hover ? 'hover:scale-[1.01] transition-transform' : '';
  const glowStyles = glow ? 'hover:shadow-tv-glow' : '';

  return (
    <motion.div
      className={clsx(
        'p-6',
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