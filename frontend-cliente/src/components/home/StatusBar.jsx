import { Music, Clock, DollarSign, Info } from 'lucide-react';
import { motion } from 'framer-motion';

export default function StatusBar({ queueCount, maxWaitTime, price, mode, onRulesClick }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="sticky top-0 z-50 bg-dark-card/95 backdrop-blur-lg border-b border-dark-border px-4 py-3"
    >
      <div className="flex items-center justify-between gap-3 max-w-7xl mx-auto">
        {/* Fila */}
        <div className="flex items-center gap-2 flex-1">
          <div className="w-10 h-10 rounded-lg bg-neon-cyan/10 flex items-center justify-center">
            <Music className="w-5 h-5 text-neon-cyan" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-gray-400">Na fila</p>
            <p className="text-sm font-bold text-white">{queueCount}</p>
          </div>
        </div>

        {/* Tempo */}
        <div className="flex items-center gap-2 flex-1">
          <div className="w-10 h-10 rounded-lg bg-neon-purple/10 flex items-center justify-center">
            <Clock className="w-5 h-5 text-neon-purple" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-gray-400">Máximo</p>
            <p className="text-sm font-bold text-white">{maxWaitTime}min</p>
          </div>
        </div>

        {/* Preço/Modo */}
        <div className="flex items-center gap-2 flex-1">
          <div className={`w-10 h-10 rounded-lg ${mode === 'gratuito' ? 'bg-green-500/10' : 'bg-yellow-500/10'} flex items-center justify-center`}>
            <DollarSign className={`w-5 h-5 ${mode === 'gratuito' ? 'text-green-500' : 'text-yellow-500'}`} />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-gray-400">Modo</p>
            <p className="text-sm font-bold text-white">{mode === 'gratuito' ? 'Grátis' : `R$ ${price}`}</p>
          </div>
        </div>

        {/* Botão Info */}
        <button
          onClick={onRulesClick}
          className="w-10 h-10 rounded-lg bg-dark-lighter flex items-center justify-center hover:bg-neon-cyan/10 transition-colors"
          aria-label="Ver regras"
        >
          <Info className="w-5 h-5 text-neon-cyan" />
        </button>
      </div>
    </motion.div>
  );
}
