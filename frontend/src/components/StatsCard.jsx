import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import Card from './ui/Card';
import clsx from 'clsx';

const colorMap = {
  primary: 'text-futura-primary border-futura-primary',
  secondary: 'text-futura-secondary border-futura-secondary',
  accent: 'text-futura-accent border-futura-accent',
  success: 'text-futura-success border-futura-success',
};

export default function StatsCard({ title, value, icon: Icon, trend, color = 'primary' }) {
  const isPositive = trend > 0;
  const isNegative = trend < 0;

  return (
    <Card variant="glass" hover glow className={colorMap[color]}>
      <div className="flex items-center gap-4">
        {/* Ícone */}
        <div className={clsx(
          'w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center border',
          color === 'primary' && 'from-futura-primary/20 to-futura-secondary/20 border-futura-primary/30',
          color === 'secondary' && 'from-futura-secondary/20 to-futura-accent/20 border-futura-secondary/30',
          color === 'accent' && 'from-futura-accent/20 to-futura-danger/20 border-futura-accent/30',
          color === 'success' && 'from-futura-success/20 to-futura-primary/20 border-futura-success/30'
        )}>
          <Icon className={clsx(
            'w-6 h-6',
            color === 'primary' && 'text-futura-primary',
            color === 'secondary' && 'text-futura-secondary',
            color === 'accent' && 'text-futura-accent',
            color === 'success' && 'text-futura-success'
          )} />
        </div>

        {/* Conteúdo */}
        <div className="flex-1">
          <p className="text-sm text-futura-gray-700 mb-1">
            {title}
          </p>
          <p className="text-3xl font-bold gradient-text-primary">
            {value}
          </p>

          {/* Trend Indicator */}
          {trend !== undefined && trend !== 0 && (
            <div className={clsx(
              'flex items-center gap-1 text-sm mt-1',
              isPositive && 'text-futura-success',
              isNegative && 'text-futura-danger'
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