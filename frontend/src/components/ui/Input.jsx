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
            'absolute left-3 transition-all duration-200 pointer-events-none font-mono',
            isFocused || props.value
              ? '-top-2.5 text-xs bg-tv-black px-1 text-tv-phosphor tv-text-glow'
              : 'top-3 text-sm text-tv-gray'
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
          <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-tv-gray" />
        )}

        <motion.input
          type={inputType}
          className={clsx(
            'w-full px-4 py-3 font-mono',
            'retro-input',
            'text-tv-phosphor',
            'placeholder-tv-gray',
            'focus:border-tv-phosphor focus:shadow-tv-glow',
            'transition-all duration-200',
            Icon && 'pl-10',
            (IconRight || type === 'password') && 'pr-10',
            error && 'border-tv-red focus:border-tv-red focus:shadow-tv-glow-red'
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
            className="absolute right-3 top-1/2 -translate-y-1/2 text-tv-gray hover:text-tv-phosphor transition-colors"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        ) : IconRight ? (
          <IconRight className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-tv-gray" />
        ) : null}
      </div>

      {error && (
        <motion.p
          className="mt-1 text-sm text-tv-red font-mono tv-text-glow"
          style={{ textShadow: '0 0 10px rgba(255, 68, 68, 0.8)' }}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {error}
        </motion.p>
      )}
    </div>
  );
}