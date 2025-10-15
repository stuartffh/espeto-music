import { motion } from 'framer-motion';
import { User } from 'lucide-react';
import Badge from './ui/Badge';
import EqualizerAnimation from './EqualizerAnimation';
import clsx from 'clsx';

export default function QueueItem({ musica, posicao, isPlaying = false }) {
  return (
    <motion.div
      className={clsx(
        'glass rounded-lg p-3 mb-2 flex items-center gap-3',
        isPlaying && 'border-2 border-neon-cyan'
      )}
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
    >
      {/* Posição Badge */}
      <Badge variant="neon" size="sm" pulse={isPlaying}>
        {isPlaying ? '▶' : posicao}
      </Badge>

      {/* Thumbnail */}
      {musica.musicaThumbnail && (
        <img
          src={musica.musicaThumbnail}
          alt={musica.musicaTitulo}
          className="w-16 h-12 object-cover rounded"
        />
      )}

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-semibold text-white truncate">
          {musica.musicaTitulo}
        </h4>
        <p className="text-xs text-gray-400 flex items-center gap-1">
          <User className="w-3 h-3" />
          {musica.nomeCliente || 'Anônimo'}
        </p>
      </div>

      {/* Equalizer Animation se tocando */}
      {isPlaying && (
        <div className="ml-auto">
          <EqualizerAnimation />
        </div>
      )}
    </motion.div>
  );
}
