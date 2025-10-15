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
            'absolute left-3 transition-all duration-200 pointer-events-none',
            isFocused || props.value
              ? '-top-2.5 text-xs bg-white dark:bg-dark-surface px-1 text-neon-cyan'
              : 'top-3 text-sm text-gray-500 dark:text-gray-400'
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
          <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
        )}

        <motion.input
          type={inputType}
          className={clsx(
            'w-full px-4 py-3 rounded-lg',
            'bg-white dark:bg-dark-surface',
            'border-2 border-gray-300 dark:border-dark-border',
            'text-gray-900 dark:text-white',
            'placeholder-gray-400 dark:placeholder-gray-500',
            'focus:border-neon-cyan focus:ring-2 focus:ring-neon-cyan/50',
            'transition-all duration-200',
            Icon && 'pl-10',
            (IconRight || type === 'password') && 'pr-10',
            error && 'border-red-500 focus:border-red-500 focus:ring-red-500/50'
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
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        ) : IconRight ? (
          <IconRight className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
        ) : null}
      </div>

      {error && (
        <motion.p
          className="mt-1 text-sm text-red-500"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {error}
        </motion.p>
      )}
    </div>
  );
}
