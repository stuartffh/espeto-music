import { motion, AnimatePresence } from 'framer-motion';
import { Music, User, Clock } from 'lucide-react';
import EqualizerAnimation from './EqualizerAnimation';

/**
 * FullscreenOverlay - Overlay para modo fullscreen da TV
 *
 * Exibe SOBRE o player do YouTube:
 * - Música atual com equalizer (top-right)
 * - QR Code (bottom-left)
 * - Próxima música (apenas 10s antes do fim, bottom-right)
 * - Fila count (top-left)
 */
export default function FullscreenOverlay({
  qrCodeData,
  musicaAtual,
  proximaMusica,
  showProxima,
  fila,
  configs
}) {
  return (
    <div className="absolute inset-0 pointer-events-none z-50">
      {/* Fila Count - Canto superior esquerdo */}
      {fila && fila.length > 0 && (
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="absolute top-6 left-6"
        >
          <div className="glass-heavy border-2 border-neon-cyan/40 rounded-xl p-4 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <Clock className="w-6 h-6 text-neon-cyan" />
              <div>
                <p className="text-2xl font-bold text-white">{fila.length}</p>
                <p className="text-xs text-gray-300 uppercase tracking-wide">Na Fila</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Música Atual - Canto superior direito */}
      {musicaAtual && (
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="absolute top-6 right-6 max-w-md"
        >
          <div className="glass-heavy border-2 border-neon-purple/40 rounded-xl p-5 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center gap-2 mb-3">
              <Music className="w-5 h-5 text-neon-purple" />
              <span className="text-sm font-bold text-neon-purple uppercase tracking-wide">
                Tocando Agora
              </span>
              <EqualizerAnimation />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold text-white leading-tight line-clamp-2">
                {musicaAtual.musicaTitulo}
              </h3>

              <div className="flex items-center gap-2 text-sm text-gray-300">
                <User className="w-4 h-4" />
                <span className="truncate">
                  {musicaAtual.nomeCliente || 'Anônimo'}
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* QR Code - Sempre visível no canto inferior esquerdo */}
      {qrCodeData && (
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="absolute bottom-6 left-6 pointer-events-auto"
        >
          <div className="glass-heavy border-2 border-neon-cyan/40 rounded-2xl p-4 shadow-2xl backdrop-blur-xl">
            <div className="text-center mb-3">
              <p className="text-sm font-bold text-white mb-1">
                📱 Peça sua música!
              </p>
              <p className="text-xs text-gray-300">
                Escaneie o QR Code
              </p>
            </div>

            {qrCodeData.qrCodeDataUrl ? (
              <img
                src={qrCodeData.qrCodeDataUrl}
                alt="QR Code"
                className="w-32 h-32 rounded-lg"
              />
            ) : (
              <div className="w-32 h-32 bg-white rounded-lg flex items-center justify-center">
                <span className="text-gray-400 text-xs">QR Code</span>
              </div>
            )}

            {qrCodeData.url && (
              <p className="text-xs text-gray-400 mt-2 text-center truncate max-w-[128px]">
                {qrCodeData.url.replace(/^https?:\/\//, '')}
              </p>
            )}
          </div>
        </motion.div>
      )}

      {/* Próxima Música - Apenas 10s antes do fim, canto inferior direito */}
      <AnimatePresence>
        {showProxima && proximaMusica && (
          <motion.div
            initial={{ opacity: 0, x: 50, y: 20 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, x: 50, y: 20 }}
            transition={{ duration: 0.4, type: 'spring', damping: 20 }}
            className="absolute bottom-6 right-6 pointer-events-auto"
          >
            <div className="glass-heavy border-2 border-neon-purple/40 rounded-2xl p-5 shadow-2xl backdrop-blur-xl max-w-sm">
              <div className="flex items-center gap-2 mb-3">
                <Music className="w-5 h-5 text-neon-purple" />
                <span className="text-sm font-bold text-neon-purple uppercase tracking-wide">
                  Próxima Música
                </span>
              </div>

              <div className="space-y-2">
                <h3 className="text-base font-bold text-white leading-tight line-clamp-2">
                  {proximaMusica.musicaTitulo}
                </h3>

                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <User className="w-4 h-4" />
                  <span className="truncate">
                    {proximaMusica.nomeCliente || 'Anônimo'}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
