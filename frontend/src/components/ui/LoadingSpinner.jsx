import { motion } from 'framer-motion';

export default function LoadingSpinner({ size = 'md', className = '' }) {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className={`inline-flex items-center justify-center ${className}`}>
      <motion.div
        className={`${sizes[size]} rounded-full relative`}
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      >
        {/* Spinner com gradiente */}
        <div className={`${sizes[size]} rounded-full border-4 border-transparent border-t-futura-primary border-r-futura-secondary`} />
        {/* Glow effect */}
        <div className={`absolute inset-0 ${sizes[size]} rounded-full bg-gradient-to-br from-futura-primary/30 to-futura-secondary/30 blur-sm`} />
      </motion.div>
    </div>
  );
}