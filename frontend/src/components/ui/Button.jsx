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
  const baseStyles = 'inline-flex items-center justify-center gap-2 font-mono font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed border-2';

  const variants = {
    primary: 'retro-button text-tv-black hover:shadow-tv-glow focus:ring-tv-phosphor border-tv-beige',
    secondary: 'bg-tv-screen border-tv-phosphor text-tv-phosphor hover:bg-tv-screen hover:shadow-tv-glow focus:ring-tv-phosphor tv-text-glow',
    ghost: 'bg-transparent border-tv-phosphor text-tv-phosphor hover:bg-tv-phosphor/10 hover:shadow-tv-glow focus:ring-tv-phosphor tv-text-glow',
    danger: 'retro-button bg-tv-red border-tv-red-dark text-white hover:shadow-tv-glow-red focus:ring-tv-red',
    tv: 'tv-screen border-tv-phosphor text-tv-phosphor hover:shadow-tv-glow focus:ring-tv-phosphor tv-text-glow',
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