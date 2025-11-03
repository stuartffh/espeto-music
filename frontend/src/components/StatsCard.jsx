import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import Card from './ui/Card';
import clsx from 'clsx';

const colorMap = {
  cyan: 'bg-tv-screen border-tv-phosphor',
  purple: 'bg-tv-screen border-tv-blue',
  pink: 'bg-tv-screen border-tv-red',
  green: 'bg-tv-screen border-tv-phosphor',
};

export default function StatsCard({ title, value, icon: Icon, trend, color = 'cyan' }) {
  const isPositive = trend > 0;
  const isNegative = trend < 0;

  return (
    <Card variant="retro" hover glow className={colorMap[color]}>
      <div className="flex items-center gap-4">
        {/* Ícone */}
        <div className={clsx(
          'w-12 h-12 border-2 border-tv-beige flex items-center justify-center retro-bg',
          color === 'cyan' && 'border-tv-phosphor',
          color === 'purple' && 'border-tv-blue',
          color === 'pink' && 'border-tv-red'
        )}>
          <Icon className={clsx(
            'w-6 h-6',
            color === 'cyan' && 'text-tv-phosphor',
            color === 'purple' && 'text-tv-blue',
            color === 'pink' && 'text-tv-red',
            'default' && 'text-tv-black'
          )} />
        </div>

        {/* Conteúdo */}
        <div className="flex-1">
          <p className="text-sm text-tv-gray mb-1 font-mono">
            {title}
          </p>
          <p className="text-3xl font-mono font-bold text-tv-phosphor tv-text-glow">
            {value}
          </p>

          {/* Trend Indicator */}
          {trend !== undefined && trend !== 0 && (
            <div className={clsx(
              'flex items-center gap-1 text-sm mt-1 font-mono',
              isPositive && 'text-tv-phosphor',
              isNegative && 'text-tv-red'
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