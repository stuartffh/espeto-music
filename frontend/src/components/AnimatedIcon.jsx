import { motion } from 'framer-motion';
import clsx from 'clsx';

export default function AnimatedIcon({ 
  icon: Icon, 
  animation = 'pulse',
  className = '',
  size = 'default',
  ...props 
}) {
  const animations = {
    pulse: {
      animate: { scale: [1, 1.2, 1] },
      transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
    },
    bounce: {
      animate: { y: [0, -8, 0] },
      transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
    },
    rotate: {
      animate: { rotate: 360 },
      transition: { duration: 3, repeat: Infinity, ease: 'linear' },
    },
    float: {
      animate: { y: [0, -10, 0] },
      transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
    },
  };

  const sizes = {
    sm: 'w-4 h-4',
    default: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <motion.div
      className={clsx('inline-flex items-center justify-center', sizes[size], className)}
      {...animations[animation]}
      {...props}
    >
      <Icon className={clsx(sizes[size])} style={props.style} />
    </motion.div>
  );
}
