import { motion } from 'framer-motion';
import { User, Music2 } from 'lucide-react';
import Badge from './ui/Badge';
import EqualizerAnimation from './EqualizerAnimation';
import clsx from 'clsx';

export default function QueueItem({ musica, posicao, isPlaying = false }) {
  return (
    <motion.div
      className={clsx(
        'glass rounded-xl p-3 sm:p-4 mb-2 sm:mb-3 flex items-center gap-3 sm:gap-4 transition-all duration-200',
        isPlaying && 'border-2 border-neon-cyan shadow-lg shadow-neon-cyan/20',
        !isPlaying && 'hover:shadow-md'
      )}
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3 }}
    >
      {/* Posição Badge */}
      <Badge
        variant="neon"
        size="sm"
        pulse={isPlaying}
        className="min-w-[32px] sm:min-w-[36px] flex items-center justify-center font-bold"
      >
        {isPlaying ? '▶' : posicao}
      </Badge>

      {/* Thumbnail */}
      {musica.musicaThumbnail && (
        <div className="relative flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden shadow-md">
          <img
            src={musica.musicaThumbnail}
            alt={musica.musicaTitulo}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          {isPlaying && (
            <div className="absolute inset-0 bg-gradient-to-t from-neon-cyan/40 via-transparent to-transparent" />
          )}
        </div>
      )}

      {/* Info */}
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-start gap-2">
          {!musica.musicaThumbnail && (
            <Music2 className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
          )}
          <h4 className={clsx(
            "text-sm sm:text-base font-bold line-clamp-2 leading-snug",
            isPlaying ? "text-neon-cyan" : "text-white"
          )}>
            {musica.musicaTitulo}
          </h4>
        </div>
        <div className="flex items-center gap-1.5 text-xs sm:text-sm text-gray-400">
          <User className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
          <p className="truncate">
            {musica.nomeCliente || 'Anônimo'}
          </p>
        </div>
      </div>

      {/* Equalizer Animation se tocando */}
      {isPlaying && (
        <div className="flex-shrink-0 ml-2">
          <EqualizerAnimation />
        </div>
      )}
    </motion.div>
  );
}
