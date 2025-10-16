import { Music } from 'lucide-react';
import { motion } from 'framer-motion';

const CATEGORIES = [
  { id: 'pagode', name: 'Pagode', icon: '🎸', color: 'from-orange-500 to-red-500' },
  { id: 'funk', name: 'Funk', icon: '🔊', color: 'from-purple-500 to-pink-500' },
  { id: 'sertanejo', name: 'Sertanejo', icon: '🤠', color: 'from-green-500 to-emerald-500' },
  { id: 'rock', name: 'Rock', icon: '🎸', color: 'from-red-500 to-orange-500' },
  { id: 'pop', name: 'Pop', icon: '🎤', color: 'from-blue-500 to-cyan-500' },
  { id: 'rap', name: 'Rap', icon: '🎧', color: 'from-yellow-500 to-orange-500' },
];

export default function CategoryGrid({ onCategoryClick }) {
  return (
    <div className="px-4 py-3">
      <h3 className="text-sm font-semibold text-gray-400 mb-3 flex items-center gap-2">
        <Music className="w-4 h-4" />
        CATEGORIAS
      </h3>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory">
        {CATEGORIES.map((category, index) => (
          <motion.button
            key={category.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => onCategoryClick?.(category.id)}
            className="flex-shrink-0 snap-start"
          >
            <div className={`w-24 h-24 rounded-xl bg-gradient-to-br ${category.color} flex flex-col items-center justify-center gap-2 hover:scale-105 transition-transform active:scale-95`}>
              <span className="text-3xl">{category.icon}</span>
              <span className="text-white text-xs font-bold">{category.name}</span>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
