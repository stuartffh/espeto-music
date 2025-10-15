import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import Card from './ui/Card';
import clsx from 'clsx';

const colorMap = {
  cyan: 'from-neon-cyan to-neon-cyan/50',
  purple: 'from-neon-purple to-neon-purple/50',
  pink: 'from-neon-pink to-neon-pink/50',
  green: 'from-neon-green to-neon-green/50',
};

export default function StatsCard({ title, value, icon: Icon, trend, color = 'cyan' }) {
  const isPositive = trend > 0;
  const isNegative = trend < 0;

  return (
    <Card variant="glass" hover glow>
      <div className="flex items-center gap-4">
        {/* Ícone */}
        <div className={clsx(
          'w-12 h-12 rounded-full bg-gradient-to-br flex items-center justify-center',
          colorMap[color]
        )}>
          <Icon className="w-6 h-6 text-white" />
        </div>

        {/* Conteúdo */}
        <div className="flex-1">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
            {title}
          </p>
          <p className="text-3xl font-bold gradient-text">
            {value}
          </p>

          {/* Trend Indicator */}
          {trend !== undefined && trend !== 0 && (
            <div className={clsx(
              'flex items-center gap-1 text-sm mt-1',
              isPositive && 'text-neon-green',
              isNegative && 'text-neon-pink'
            )}>
              {isPositive ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              <span>{Math.abs(trend)}%</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
