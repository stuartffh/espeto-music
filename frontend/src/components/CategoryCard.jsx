import { motion } from 'framer-motion';
import { Guitar, Music, Radio, Mic2, Zap, PartyPopper, Drum, Heart } from 'lucide-react';
import clsx from 'clsx';

const categoryIcons = {
  'Sertanejo': Guitar,
  'Pagode': Music,
  'Funk': Radio,
  'MPB': Mic2,
  'Rock BR': Zap,
  'Forró': PartyPopper,
  'Samba': Drum,
  'Gospel': Heart,
};

export default function CategoryCard({ categoria, active = false, onClick }) {
  const Icon = categoryIcons[categoria.nome] || Music;

  return (
    <motion.button
      className={clsx(
        'glass rounded-lg p-6 min-w-[140px] flex flex-col items-center gap-3 transition-all snap-center',
        active && 'neon-border bg-neon-cyan/10'
      )}
      whileHover={{ scale: 1.05, boxShadow: `0 0 30px ${categoria.cor}50` }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
    >
      <Icon
        className="w-8 h-8"
        style={{ color: categoria.cor }}
      />
      <span className="text-sm font-semibold text-white">
        {categoria.nome}
      </span>
    </motion.button>
  );
}
