import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import clsx from 'clsx';

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon: Icon,
  className = '',
  ...props
}) {
  const baseStyles = 'inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-futura-bg disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary: 'bg-gradient-to-r from-futura-primary to-futura-secondary text-white hover:shadow-glow-primary focus:ring-futura-primary',
    secondary: 'bg-futura-surface border border-futura-border text-white hover:bg-futura-surface-hover hover:border-futura-primary focus:ring-futura-primary',
    accent: 'bg-gradient-to-r from-futura-accent to-futura-secondary text-white hover:shadow-glow-accent focus:ring-futura-accent',
    success: 'bg-gradient-to-r from-futura-success to-futura-primary text-black font-bold hover:shadow-glow-success focus:ring-futura-success',
    danger: 'bg-gradient-to-r from-futura-danger to-futura-accent text-white hover:shadow-lg focus:ring-futura-danger',
    ghost: 'bg-transparent border border-futura-border text-futura-primary hover:bg-futura-surface hover:border-futura-primary focus:ring-futura-primary',
    outline: 'bg-transparent border-2 border-futura-primary text-futura-primary hover:bg-futura-primary hover:text-white focus:ring-futura-primary',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2.5 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <motion.button
      className={clsx(baseStyles, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : Icon ? (
        <Icon className="w-5 h-5" />
      ) : null}
      {children}
    </motion.button>
  );
}