import { motion } from 'framer-motion';
import { Play, Plus } from 'lucide-react';
import Button from './ui/Button';

export default function MusicListItem({ musica, onAdd, loading = false }) {
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div
      className="glass rounded-xl overflow-hidden hover:shadow-lg transition-shadow duration-200"
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4">
        {/* Thumbnail Compacta */}
        <div className="relative flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-lg overflow-hidden shadow-md">
          <img
            src={musica.thumbnail || musica.musicaThumbnail}
            alt={musica.titulo || musica.musicaTitulo}
            className="w-full h-full object-cover"
            loading="lazy"
          />

          {/* Play Overlay com hover effect */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent flex items-center justify-center opacity-80 hover:opacity-100 transition-opacity">
            <div className="bg-white/20 backdrop-blur-sm rounded-full p-1.5 sm:p-2">
              <Play className="w-4 h-4 sm:w-5 sm:h-5 text-white drop-shadow-lg" fill="white" />
            </div>
          </div>

          {/* Duração */}
          {musica.duracao && (
            <div className="absolute bottom-1 right-1 bg-black/90 backdrop-blur-sm px-2 py-0.5 rounded-md text-[10px] sm:text-xs text-white font-semibold shadow-lg">
              {formatDuration(musica.duracao)}
            </div>
          )}
        </div>

        {/* Informações */}
        <div className="flex-1 min-w-0 py-1">
          <h3 className="text-sm sm:text-base font-bold text-white mb-1 line-clamp-2 leading-snug">
            {musica.titulo || musica.musicaTitulo}
          </h3>
          <div className="flex items-center gap-1.5 text-xs sm:text-sm text-gray-400">
            <p className="line-clamp-1">
              {musica.canal || musica.artista || 'Artista Desconhecido'}
            </p>
          </div>
        </div>

        {/* Botão Adicionar */}
        <div className="flex-shrink-0">
          <Button
            variant="primary"
            size="sm"
            onClick={onAdd}
            loading={loading}
            disabled={loading}
            className="min-w-[44px] min-h-[44px] px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold shadow-lg hover:shadow-xl transition-all"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={2.5} />
            <span className="hidden sm:inline ml-1.5">Adicionar</span>
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
