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
        'retro-card p-6 min-w-[140px] flex flex-col items-center gap-3 transition-all snap-center border-tv-beige',
        active && 'border-tv-phosphor shadow-tv-glow'
      )}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
    >
      <Icon
        className="w-8 h-8"
        style={{ 
          color: active ? '#39FF14' : categoria.cor || '#D4A574',
          filter: active ? 'drop-shadow(0 0 10px rgba(57, 255, 20, 0.8))' : 'none'
        }}
      />
      <span className="text-sm font-mono font-semibold text-tv-phosphor tv-text-glow">
        {categoria.nome}
      </span>
    </motion.button>
  );
}