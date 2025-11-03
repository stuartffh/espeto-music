import { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';
import clsx from 'clsx';

export default function Input({
  label,
  type = 'text',
  icon: Icon,
  iconRight: IconRight,
  error,
  className = '',
  ...props
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const inputType = type === 'password' && showPassword ? 'text' : type;

  return (
    <div className={clsx('relative', className)}>
      {label && (
        <motion.label
          className={clsx(
            'absolute left-3 transition-all duration-200 pointer-events-none text-sm font-medium',
            isFocused || props.value
              ? '-top-2.5 text-xs bg-futura-bg px-1 text-futura-primary'
              : 'top-3 text-sm text-futura-gray-700'
          )}
          animate={{
            y: isFocused || props.value ? 0 : 0,
            scale: isFocused || props.value ? 0.85 : 1,
          }}
        >
          {label}
        </motion.label>
      )}

      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-futura-gray-700" />
        )}

        <motion.input
          type={inputType}
          className={clsx(
            'w-full px-4 py-3 rounded-lg',
            'bg-futura-surface border border-futura-border',
            'text-white placeholder-futura-gray-700',
            'focus:border-futura-primary focus:ring-2 focus:ring-futura-primary/50',
            'transition-all duration-200',
            Icon && 'pl-10',
            (IconRight || type === 'password') && 'pr-10',
            error && 'border-futura-danger focus:border-futura-danger focus:ring-futura-danger/50'
          )}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          animate={error ? { x: [-10, 10, -10, 10, 0] } : {}}
          transition={{ duration: 0.4 }}
          {...props}
        />

        {type === 'password' ? (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-futura-gray-700 hover:text-futura-primary transition-colors"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        ) : IconRight ? (
          <IconRight className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-futura-gray-700" />
        ) : null}
      </div>

      {error && (
        <motion.p
          className="mt-1 text-sm text-futura-danger font-medium"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {error}
        </motion.p>
      )}
    </div>
  );
}