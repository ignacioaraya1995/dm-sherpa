import { clsx } from 'clsx';
import { LucideIcon } from 'lucide-react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'neutral' | 'success' | 'warning' | 'danger' | 'accent' | 'cyan' | 'violet';
  size?: 'sm' | 'md' | 'lg';
  icon?: LucideIcon;
  glow?: boolean;
}

const variantClasses = {
  neutral: 'bg-glass-surface text-text-secondary border-glass-border',
  success: 'bg-success-muted text-success border-success/30',
  warning: 'bg-warning-muted text-warning border-warning/30',
  danger: 'bg-danger-muted text-danger border-danger/30',
  accent: 'bg-accent-muted text-accent border-accent/30',
  cyan: 'bg-data-cyan/10 text-data-cyan border-data-cyan/30',
  violet: 'bg-data-violet/10 text-data-violet border-data-violet/30',
};

const glowClasses = {
  neutral: '',
  success: 'shadow-glow-success',
  warning: 'shadow-glow-warning',
  danger: 'shadow-glow-danger',
  accent: 'shadow-glow-accent',
  cyan: 'shadow-[0_0_20px_rgba(34,211,238,0.3)]',
  violet: 'shadow-[0_0_20px_rgba(167,139,250,0.3)]',
};

const sizeClasses = {
  sm: 'px-2 py-0.5 text-[10px]',
  md: 'px-2.5 py-1 text-xs',
  lg: 'px-3 py-1.5 text-sm',
};

export function Badge({
  children,
  variant = 'neutral',
  size = 'md',
  icon: Icon,
  glow = false,
}: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 font-medium rounded-sm border uppercase tracking-wider',
        variantClasses[variant],
        sizeClasses[size],
        glow && glowClasses[variant]
      )}
    >
      {Icon && <Icon className="w-3 h-3" />}
      {children}
    </span>
  );
}

// Status badge with automatic variant mapping
export function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, BadgeProps['variant']> = {
    // Campaign statuses
    ACTIVE: 'success',
    COMPLETED: 'accent',
    PAUSED: 'warning',
    DRAFT: 'neutral',
    CANCELLED: 'danger',
    SCHEDULED: 'cyan',

    // Deal statuses
    CLOSED: 'success',
    PENDING: 'warning',
    UNDER_CONTRACT: 'accent',
    DUE_DILIGENCE: 'cyan',
    FELL_THROUGH: 'danger',
    NEGOTIATING: 'warning',

    // Property statuses
    NEW: 'accent',
    CONTACTED: 'cyan',
    QUALIFIED: 'violet',
    NOT_INTERESTED: 'neutral',
    DO_NOT_CONTACT: 'danger',

    // Health statuses
    HEALTHY: 'success',
    WARNING: 'warning',
    CRITICAL: 'danger',
    UNKNOWN: 'neutral',
  };

  const displayStatus = status.replace(/_/g, ' ');

  return <Badge variant={variants[status] || 'neutral'}>{displayStatus}</Badge>;
}

// Health indicator badge with animated glow
interface HealthBadgeProps {
  status: 'healthy' | 'warning' | 'critical';
  label?: string;
}

export function HealthBadge({ status, label }: HealthBadgeProps) {
  const statusConfig = {
    healthy: { variant: 'success' as const, text: label || 'Healthy' },
    warning: { variant: 'warning' as const, text: label || 'Warning' },
    critical: { variant: 'danger' as const, text: label || 'Critical' },
  };

  const config = statusConfig[status];

  return (
    <span className={clsx(
      'inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border',
      variantClasses[config.variant]
    )}>
      <span className={clsx(
        'w-2 h-2 rounded-full animate-glow-pulse',
        status === 'healthy' && 'bg-success shadow-glow-success',
        status === 'warning' && 'bg-warning shadow-glow-warning',
        status === 'critical' && 'bg-danger shadow-glow-danger'
      )} />
      {config.text}
    </span>
  );
}

// Score badge (0-100)
interface ScoreBadgeProps {
  score: number;
  label?: string;
  showValue?: boolean;
}

export function ScoreBadge({ score, label, showValue = true }: ScoreBadgeProps) {
  const getVariant = (): BadgeProps['variant'] => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'cyan';
    if (score >= 40) return 'warning';
    return 'danger';
  };

  return (
    <div className="flex items-center gap-2">
      {label && <span className="text-xs text-text-muted">{label}</span>}
      <Badge variant={getVariant()} size="sm">
        {showValue ? score : ''}
      </Badge>
    </div>
  );
}

// Trend badge
interface TrendBadgeProps {
  value: number;
  suffix?: string;
}

export function TrendBadge({ value, suffix = '%' }: TrendBadgeProps) {
  const isPositive = value >= 0;

  return (
    <Badge variant={isPositive ? 'success' : 'danger'} size="sm">
      {isPositive ? '+' : ''}{value.toFixed(1)}{suffix}
    </Badge>
  );
}
