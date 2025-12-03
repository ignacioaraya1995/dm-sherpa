'use client';

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
  ReferenceLine,
} from 'recharts';

// Data visualization color palette
const COLORS = {
  cyan: '#22d3ee',
  violet: '#a78bfa',
  emerald: '#34d399',
  amber: '#fbbf24',
  pink: '#f472b6',
  accent: '#6366f1',
};

const CHART_COLORS = [
  COLORS.cyan,
  COLORS.violet,
  COLORS.emerald,
  COLORS.amber,
  COLORS.pink,
  COLORS.accent,
];

// Shared tooltip style
const tooltipStyle = {
  backgroundColor: 'rgba(26, 26, 46, 0.95)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '12px',
  boxShadow: '0 8px 40px rgba(0,0,0,0.3)',
  padding: '12px 16px',
};

const tooltipLabelStyle = {
  color: '#a1a1aa',
  fontSize: '12px',
  fontWeight: '500',
  marginBottom: '8px',
};

const tooltipItemStyle = {
  color: '#f4f4f5',
  fontSize: '13px',
  padding: '2px 0',
};

// Custom tooltip component
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;

  return (
    <div style={tooltipStyle}>
      <p style={tooltipLabelStyle}>{label}</p>
      {payload.map((entry: any, index: number) => (
        <p key={index} style={{ ...tooltipItemStyle, color: entry.color }}>
          {entry.name}: {typeof entry.value === 'number'
            ? entry.value.toLocaleString()
            : entry.value}
        </p>
      ))}
    </div>
  );
}

// Performance Trend Chart
interface TrendChartProps {
  data: Array<{
    date: string;
    mailed?: number;
    calls?: number;
    contracts?: number;
    profit?: number;
    [key: string]: any;
  }>;
  title?: string;
  lines?: Array<{ key: string; name: string; color?: string }>;
}

export function TrendChart({
  data,
  title = 'Performance Trends',
  lines = [
    { key: 'mailed', name: 'Mailed', color: COLORS.cyan },
    { key: 'calls', name: 'Calls', color: COLORS.emerald },
    { key: 'contracts', name: 'Contracts', color: COLORS.violet },
  ]
}: TrendChartProps) {
  return (
    <div className="glass-card p-6">
      <h3 className="text-lg font-semibold text-text-primary mb-6">{title}</h3>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              {lines.map((line, index) => (
                <linearGradient
                  key={line.key}
                  id={`gradient-${line.key}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="5%"
                    stopColor={line.color || CHART_COLORS[index]}
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor={line.color || CHART_COLORS[index]}
                    stopOpacity={0}
                  />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.04)"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              stroke="#71717a"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#71717a"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => value.toLocaleString()}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ paddingTop: '20px' }}
              formatter={(value) => (
                <span className="text-text-secondary text-sm">{value}</span>
              )}
            />
            {lines.map((line, index) => (
              <Area
                key={line.key}
                type="monotone"
                dataKey={line.key}
                name={line.name}
                stroke={line.color || CHART_COLORS[index]}
                strokeWidth={2}
                fill={`url(#gradient-${line.key})`}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// Pipeline Bar Chart
interface PipelineChartProps {
  data: Array<{ status: string; count: number; value: number }>;
  title?: string;
}

export function PipelineChart({ data, title = 'Deal Pipeline' }: PipelineChartProps) {
  return (
    <div className="glass-card p-6">
      <h3 className="text-lg font-semibold text-text-primary mb-6">{title}</h3>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" barCategoryGap="20%">
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.04)"
              horizontal={false}
            />
            <XAxis
              type="number"
              stroke="#71717a"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              type="category"
              dataKey="status"
              stroke="#a1a1aa"
              fontSize={12}
              width={120}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              content={<CustomTooltip />}
              formatter={(value: number, name: string) => [
                name === 'count' ? value : `$${value.toLocaleString()}`,
                name === 'count' ? 'Deals' : 'Value',
              ]}
            />
            <Bar
              dataKey="count"
              fill={COLORS.accent}
              radius={[0, 6, 6, 0]}
              background={{ fill: 'rgba(255,255,255,0.02)', radius: 6 }}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// Donut/Pie Chart
interface DonutChartProps {
  data: Array<{ name: string; value: number; color?: string }>;
  title: string;
  centerLabel?: string;
  centerValue?: string | number;
}

export function DonutChart({ data, title, centerLabel, centerValue }: DonutChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="glass-card p-6">
      <h3 className="text-lg font-semibold text-text-primary mb-6">{title}</h3>
      <div className="h-64 relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={3}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color || CHART_COLORS[index % CHART_COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>

        {/* Center text */}
        {(centerLabel || centerValue) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            {centerValue && (
              <span className="text-2xl font-bold text-text-primary">{centerValue}</span>
            )}
            {centerLabel && (
              <span className="text-xs text-text-muted uppercase tracking-wider">{centerLabel}</span>
            )}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        {data.map((entry, index) => (
          <div key={entry.name} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color || CHART_COLORS[index % CHART_COLORS.length] }}
            />
            <span className="text-xs text-text-secondary truncate">{entry.name}</span>
            <span className="text-xs text-text-muted ml-auto">
              {((entry.value / total) * 100).toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Sparkline (small inline chart)
interface SparklineProps {
  data: number[];
  color?: string;
  height?: number;
  showArea?: boolean;
}

export function Sparkline({
  data,
  color = COLORS.accent,
  height = 40,
  showArea = true
}: SparklineProps) {
  const chartData = data.map((value, index) => ({ index, value }));

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="sparkline-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={showArea ? 0.3 : 0} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={1.5}
            fill="url(#sparkline-gradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// Gauge Chart (for scores/percentages)
interface GaugeChartProps {
  value: number;
  max?: number;
  label?: string;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function GaugeChart({
  value,
  max = 100,
  label,
  color,
  size = 'md'
}: GaugeChartProps) {
  const percentage = (value / max) * 100;
  const getColor = () => {
    if (color) return color;
    if (percentage >= 80) return COLORS.emerald;
    if (percentage >= 60) return COLORS.cyan;
    if (percentage >= 40) return COLORS.amber;
    return '#ef4444';
  };

  const sizeConfig = {
    sm: { width: 80, stroke: 6, fontSize: 'text-lg' },
    md: { width: 120, stroke: 8, fontSize: 'text-2xl' },
    lg: { width: 160, stroke: 10, fontSize: 'text-3xl' },
  };

  const config = sizeConfig[size];
  const radius = (config.width - config.stroke) / 2;
  const circumference = radius * Math.PI; // Half circle
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <svg width={config.width} height={config.width / 2 + 10} className="transform -rotate-90">
        {/* Background arc */}
        <circle
          cx={config.width / 2}
          cy={config.width / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth={config.stroke}
          strokeDasharray={circumference}
          strokeDashoffset={0}
          strokeLinecap="round"
          transform={`rotate(180 ${config.width / 2} ${config.width / 2})`}
        />
        {/* Value arc */}
        <circle
          cx={config.width / 2}
          cy={config.width / 2}
          r={radius}
          fill="none"
          stroke={getColor()}
          strokeWidth={config.stroke}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(180 ${config.width / 2} ${config.width / 2})`}
          style={{ filter: `drop-shadow(0 0 8px ${getColor()}40)` }}
        />
      </svg>
      <div className="text-center -mt-4">
        <span className={`font-bold text-text-primary ${config.fontSize}`}>
          {value}
        </span>
        {label && (
          <p className="text-xs text-text-muted uppercase tracking-wider mt-1">{label}</p>
        )}
      </div>
    </div>
  );
}

// Comparison Bar
interface ComparisonBarProps {
  label: string;
  current: number;
  previous: number;
  format?: 'number' | 'currency' | 'percent';
}

export function ComparisonBar({ label, current, previous, format = 'number' }: ComparisonBarProps) {
  const max = Math.max(current, previous);
  const change = previous !== 0 ? ((current - previous) / previous) * 100 : 0;
  const isPositive = change >= 0;

  const formatValue = (val: number) => {
    switch (format) {
      case 'currency':
        return `$${val.toLocaleString()}`;
      case 'percent':
        return `${val}%`;
      default:
        return val.toLocaleString();
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-text-secondary">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-text-primary font-medium">{formatValue(current)}</span>
          <span className={`text-xs ${isPositive ? 'text-success' : 'text-danger'}`}>
            {isPositive ? '+' : ''}{change.toFixed(1)}%
          </span>
        </div>
      </div>
      <div className="relative h-2 bg-dark-700 rounded-full overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 rounded-full opacity-30"
          style={{
            width: `${(previous / max) * 100}%`,
            backgroundColor: COLORS.violet,
          }}
        />
        <div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{
            width: `${(current / max) * 100}%`,
            backgroundColor: COLORS.cyan,
          }}
        />
      </div>
      <div className="flex justify-between text-xs text-text-muted">
        <span>Previous: {formatValue(previous)}</span>
        <span>Current: {formatValue(current)}</span>
      </div>
    </div>
  );
}
