import { motion } from 'framer-motion';
import { Play, Clock, ShoppingCart } from 'lucide-react';
import Button from './ui/Button';
import Badge from './ui/Badge';
import clsx from 'clsx';

export default function MusicCard({ musica, onAdd, loading = false, showCartButton = false }) {
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div
      className="retro-card overflow-hidden group cursor-pointer"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden border-b-2 border-tv-beige">
        <img
          src={musica.thumbnail || musica.musicaThumbnail}
          alt={musica.titulo || musica.musicaTitulo}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110 pixelated"
        />

        {/* Overlay */}
        <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <Play className="w-16 h-16 text-tv-phosphor tv-text-glow" />
        </div>

        {/* Duração Badge */}
        {musica.duracao && (
          <div className="absolute bottom-2 right-2">
            <Badge variant="info" size="sm" glow>
              <Clock className="w-3 h-3" />
              {formatDuration(musica.duracao)}
            </Badge>
          </div>
        )}
      </div>

      {/* Conteúdo */}
      <div className="p-4">
        <h3 className="text-lg font-mono font-semibold text-tv-phosphor mb-1 line-clamp-2 tv-text-glow">
          {musica.titulo || musica.musicaTitulo}
        </h3>
        <p className="text-sm text-tv-gray mb-4 line-clamp-1 font-mono">
          {musica.canal || musica.artista || 'Artista Desconhecido'}
        </p>

        {showCartButton ? (
          <Button
            variant="primary"
            size="sm"
            className="w-full"
            onClick={onAdd}
            loading={loading}
            disabled={loading}
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            Adicionar ao Carrinho
          </Button>
        ) : (
          <Button
            variant="primary"
            size="sm"
            className="w-full"
            onClick={onAdd}
            loading={loading}
            disabled={loading}
          >
            Adicionar à Fila
          </Button>
        )}
      </div>
    </motion.div>
  );
}