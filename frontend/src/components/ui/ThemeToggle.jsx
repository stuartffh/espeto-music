import { motion } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

export default function ThemeToggle() {
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <motion.button
      onClick={toggleTheme}
      className="p-3 rounded-lg glass border-2 border-neon-cyan/30 hover:border-neon-cyan/60 hover:bg-neon-cyan/10 transition-all duration-300 shadow-lg"
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.92 }}
      aria-label="Toggle theme"
    >
      <motion.div
        initial={false}
        animate={{ rotate: isDark ? 0 : 180 }}
        transition={{ duration: 0.3, type: 'spring', stiffness: 200 }}
      >
        {isDark ? (
          <Moon className="w-5 h-5 md:w-6 md:h-6 text-neon-cyan drop-shadow-neon" />
        ) : (
          <Sun className="w-5 h-5 md:w-6 md:h-6 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]" />
        )}
      </motion.div>
    </motion.button>
  );
}
