import { motion } from 'framer-motion';
import { Play, Plus, ShoppingCart } from 'lucide-react';
import Button from './ui/Button';

export default function MusicListItem({ musica, onAdd, loading = false, showCartIcon = false }) {
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div
      className="retro-card overflow-hidden hover:shadow-tv-glow transition-shadow duration-200 border-tv-beige"
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4">
        {/* Thumbnail Compacta */}
        <div className="relative flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 border-2 border-tv-beige overflow-hidden shadow-md">
          <img
            src={musica.thumbnail || musica.musicaThumbnail}
            alt={musica.titulo || musica.musicaTitulo}
            className="w-full h-full object-cover pixelated"
            loading="lazy"
          />

          {/* Play Overlay */}
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
            <Play className="w-4 h-4 sm:w-5 sm:h-5 text-tv-phosphor tv-text-glow" fill="currentColor" />
          </div>

          {/* Duração */}
          {musica.duracao && (
            <div className="absolute bottom-1 right-1 bg-tv-black border border-tv-beige px-2 py-0.5 text-[10px] sm:text-xs text-tv-phosphor font-mono font-semibold shadow-md tv-text-glow">
              {formatDuration(musica.duracao)}
            </div>
          )}
        </div>

        {/* Informações */}
        <div className="flex-1 min-w-0 py-1">
          <h3 className="text-sm sm:text-base font-mono font-bold text-tv-phosphor mb-1 line-clamp-2 leading-snug tv-text-glow">
            {musica.titulo || musica.musicaTitulo}
          </h3>
          <div className="flex items-center gap-1.5 text-xs sm:text-sm text-tv-gray font-mono">
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
            className="min-w-[44px] min-h-[44px] px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold"
          >
            {showCartIcon ? (
              <>
                <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={2.5} />
                <span className="hidden sm:inline ml-1.5">Carrinho</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={2.5} />
                <span className="hidden sm:inline ml-1.5">Adicionar</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}