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
      className="glass rounded-xl overflow-hidden group cursor-pointer card-hover"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden">
        <img
          src={musica.thumbnail || musica.musicaThumbnail}
          alt={musica.titulo || musica.musicaTitulo}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
        />

        {/* Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <div className="bg-futura-primary/20 backdrop-blur-sm rounded-full p-4 border border-futura-primary/50">
            <Play className="w-12 h-12 text-futura-primary" fill="currentColor" />
          </div>
        </div>

        {/* Duração Badge */}
        {musica.duracao && (
          <div className="absolute bottom-2 right-2">
            <Badge variant="primary" size="sm" glow>
              <Clock className="w-3 h-3" />
              {formatDuration(musica.duracao)}
            </Badge>
          </div>
        )}
      </div>

      {/* Conteúdo */}
      <div className="p-4">
        <h3 className="text-lg font-semibold text-white mb-1 line-clamp-2">
          {musica.titulo || musica.musicaTitulo}
        </h3>
        <p className="text-sm text-futura-gray-700 mb-4 line-clamp-1">
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
            <ShoppingCart className="w-4 h-4" />
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