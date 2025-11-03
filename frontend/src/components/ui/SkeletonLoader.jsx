import clsx from 'clsx';
import { motion } from 'framer-motion';

export default function SkeletonLoader({ variant = 'rect', count = 1, className = '' }) {
  const variants = {
    text: 'h-4 w-full',
    card: 'h-48 w-full',
    circle: 'h-12 w-12 rounded-full',
    rect: 'h-24 w-full',
  };

  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <motion.div
          key={index}
          className={clsx(
            'rounded-lg bg-gradient-to-r from-futura-surface via-futura-gray-300 to-futura-surface bg-[length:200%_100%] animate-shimmer',
            variants[variant],
            className
          )}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: index * 0.1 }}
        />
      ))}
    </>
  );
}