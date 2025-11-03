import { motion } from 'framer-motion';
import { Guitar, Music, Radio, Mic2, Zap, PartyPopper, Drum, Heart } from 'lucide-react';
import AnimatedIcon from './AnimatedIcon';
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
        'glass rounded-xl p-6 min-w-[140px] flex flex-col items-center gap-3 transition-all snap-center relative overflow-hidden',
        active && 'border-2 border-futura-primary shadow-glow-primary neon-border'
      )}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
    >
      {/* Background glow quando ativo */}
      {active && (
        <div className="absolute inset-0 bg-gradient-to-br from-futura-primary/10 via-transparent to-futura-secondary/10 blur-sm" />
      )}
      
      <AnimatedIcon
        icon={Icon}
        animation={active ? 'pulse' : 'bounce'}
        className="relative z-10"
        style={{ 
          color: active ? '#00F5FF' : categoria.cor || '#FFFFFF',
        }}
        size="lg"
      />
      <span className="text-sm font-semibold text-white relative z-10">
        {categoria.nome}
      </span>
    </motion.button>
  );
}