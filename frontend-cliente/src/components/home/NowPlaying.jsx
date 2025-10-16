import { Play, Music2 } from 'lucide-react';
import { motion } from 'framer-motion';
import Card from '../ui/Card';

export default function NowPlaying({ currentSong, queue }) {
  if (!currentSong && queue.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="px-4 pt-4"
    >
      <Card variant="glass" className="p-4">
        {currentSong && (
          <div className="flex items-center gap-3 mb-4 pb-4 border-b border-dark-border">
            <div className="relative">
              <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-neon-cyan to-neon-purple flex items-center justify-center">
                <Play className="w-8 h-8 text-white" fill="white" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-dark-card animate-pulse" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-neon-cyan font-semibold mb-1">TOCANDO AGORA</p>
              <p className="text-white font-bold text-sm truncate">{currentSong.titulo}</p>
              <p className="text-gray-400 text-xs truncate">{currentSong.nomeCliente}</p>
            </div>
          </div>
        )}

        {queue.length > 0 && (
          <div>
            <p className="text-xs text-gray-400 mb-2 flex items-center gap-2">
              <Music2 className="w-4 h-4" />
              PRÓXIMAS ({queue.length})
            </p>
            <div className="space-y-2">
              {queue.slice(0, 3).map((song, index) => (
                <div key={song.id} className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-dark-lighter flex items-center justify-center text-xs text-gray-400">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-xs font-medium truncate">{song.titulo}</p>
                    <p className="text-gray-500 text-xs truncate">{song.nomeCliente}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    </motion.div>
  );
}
