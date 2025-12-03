import { clsx } from 'clsx';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: number;
  trendLabel?: string;
  color?: 'accent' | 'success' | 'warning' | 'danger' | 'cyan' | 'violet';
  size?: 'default' | 'large';
}

const iconColorClasses = {
  accent: 'bg-accent-muted text-accent',
  success: 'bg-success-muted text-success',
  warning: 'bg-warning-muted text-warning',
  danger: 'bg-danger-muted text-danger',
  cyan: 'bg-data-cyan/10 text-data-cyan',
  violet: 'bg-data-violet/10 text-data-violet',
};

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendLabel,
  color = 'accent',
  size = 'default',
}: StatCardProps) {
  const isPositive = trend !== undefined && trend >= 0;
  const isNegative = trend !== undefined && trend < 0;
  const isNeutral = trend === 0;

  return (
    <div className="glass-card p-6 group">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {/* Label */}
          <p className="stat-card-label mb-1">{title}</p>

          {/* Value */}
          <p className={clsx(
            'font-semibold text-text-primary',
            size === 'large' ? 'text-4xl' : 'text-3xl'
          )}>
            {value}
          </p>

          {/* Subtitle */}
          {subtitle && (
            <p className="mt-1 text-sm text-text-muted">{subtitle}</p>
          )}

          {/* Trend */}
          {trend !== undefined && (
            <div className="mt-3 flex items-center gap-2">
              <div className={clsx(
                'flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
                isPositive && !isNeutral && 'bg-success-muted text-success',
                isNegative && 'bg-danger-muted text-danger',
                isNeutral && 'bg-glass-surface text-text-muted'
              )}>
                {isPositive && !isNeutral && <TrendingUp className="w-3 h-3" />}
                {isNegative && <TrendingDown className="w-3 h-3" />}
                {isNeutral && <Minus className="w-3 h-3" />}
                <span>{isPositive ? '+' : ''}{trend.toFixed(1)}%</span>
              </div>
              {trendLabel && (
                <span className="text-xs text-text-muted">{trendLabel}</span>
              )}
            </div>
          )}
        </div>

        {/* Icon */}
        {Icon && (
          <div className={clsx(
            'p-3 rounded-xl transition-transform duration-200 group-hover:scale-105',
            iconColorClasses[color]
          )}>
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>
    </div>
  );
}

// Compact stat for grids
interface MiniStatProps {
  label: string;
  value: string | number;
  trend?: number;
  icon?: LucideIcon;
}

export function MiniStat({ label, value, trend, icon: Icon }: MiniStatProps) {
  return (
    <div className="flex items-center justify-between py-3 px-4 rounded-lg bg-glass-surface hover:bg-glass-surface-hover transition-colors">
      <div className="flex items-center gap-3">
        {Icon && <Icon className="w-4 h-4 text-text-muted" />}
        <span className="text-sm text-text-secondary">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-text-primary">{value}</span>
        {trend !== undefined && (
          <span className={clsx(
            'text-xs font-medium',
            trend >= 0 ? 'text-success' : 'text-danger'
          )}>
            {trend >= 0 ? '+' : ''}{trend.toFixed(1)}%
          </span>
        )}
      </div>
    </div>
  );
}

// Large hero stat
interface HeroStatProps {
  label: string;
  value: string | number;
  description?: string;
  trend?: number;
  trendLabel?: string;
}

export function HeroStat({ label, value, description, trend, trendLabel }: HeroStatProps) {
  return (
    <div className="text-center">
      <p className="text-sm font-medium uppercase tracking-wider text-text-muted mb-2">
        {label}
      </p>
      <p className="text-5xl font-bold text-gradient mb-2">{value}</p>
      {description && (
        <p className="text-sm text-text-secondary mb-2">{description}</p>
      )}
      {trend !== undefined && (
        <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-glass-surface">
          {trend >= 0 ? (
            <TrendingUp className="w-4 h-4 text-success" />
          ) : (
            <TrendingDown className="w-4 h-4 text-danger" />
          )}
          <span className={clsx(
            'text-sm font-medium',
            trend >= 0 ? 'text-success' : 'text-danger'
          )}>
            {trend >= 0 ? '+' : ''}{trend.toFixed(1)}%
          </span>
          {trendLabel && (
            <span className="text-sm text-text-muted ml-1">{trendLabel}</span>
          )}
        </div>
      )}
    </div>
  );
}
