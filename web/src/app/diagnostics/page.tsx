'use client';

import { useState } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Clock,
  ExternalLink,
  HelpCircle,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  Search,
  TrendingDown,
  TrendingUp,
  Truck,
  XCircle,
  Zap,
} from 'lucide-react';
import { StatCard } from '@/components/StatCard';
import { Badge, HealthBadge, StatusBadge } from '@/components/Badge';
import { TrendChart, GaugeChart, ComparisonBar, Sparkline } from '@/components/Charts';
import clsx from 'clsx';

type DiagnosticStatus = 'healthy' | 'warning' | 'critical';

// Mock data for diagnostics
const diagnosticChecks: Array<{
  id: string;
  name: string;
  category: string;
  status: DiagnosticStatus;
  message: string;
  lastChecked: string;
  details: Record<string, number | string>;
}> = [
  {
    id: 'usps',
    name: 'USPS Delivery',
    category: 'Delivery',
    status: 'healthy' as const,
    message: 'Mail delivery rates normal (98.2%)',
    lastChecked: '2 min ago',
    details: {
      deliveryRate: 98.2,
      averageDeliveryDays: 3.2,
      returnRate: 1.8,
    },
  },
  {
    id: 'phone',
    name: 'Phone Numbers',
    category: 'Infrastructure',
    status: 'warning' as const,
    message: '2 numbers flagged for potential spam',
    lastChecked: '5 min ago',
    details: {
      totalNumbers: 12,
      activeNumbers: 10,
      flaggedNumbers: 2,
      avgSpamScore: 24,
    },
  },
  {
    id: 'tracking',
    name: 'Call Tracking',
    category: 'Infrastructure',
    status: 'healthy' as const,
    message: 'All tracking numbers routing correctly',
    lastChecked: '1 min ago',
    details: {
      routedCorrectly: 100,
      missedCalls: 0,
    },
  },
  {
    id: 'campaigns',
    name: 'Campaign Setup',
    category: 'Operations',
    status: 'healthy' as const,
    message: 'All active campaigns properly configured',
    lastChecked: '10 min ago',
    details: {
      activeCampaigns: 8,
      misconfigured: 0,
    },
  },
  {
    id: 'list',
    name: 'List Quality',
    category: 'Data',
    status: 'warning' as const,
    message: 'Data freshness below target (45 days)',
    lastChecked: '1 hour ago',
    details: {
      avgListAge: 45,
      targetAge: 30,
      duplicateRate: 3.2,
    },
  },
  {
    id: 'market',
    name: 'Market Conditions',
    category: 'External',
    status: 'healthy' as const,
    message: 'No significant macro events detected',
    lastChecked: '1 hour ago',
    details: {
      marketIndex: 'Normal',
      competitionLevel: 'Moderate',
    },
  },
];

const responseHistory = [
  { date: 'Week 1', expected: 2.8, actual: 2.7 },
  { date: 'Week 2', expected: 2.8, actual: 2.6 },
  { date: 'Week 3', expected: 2.8, actual: 2.5 },
  { date: 'Week 4', expected: 2.8, actual: 1.8 },
  { date: 'Week 5', expected: 2.8, actual: 1.2 },
  { date: 'Week 6', expected: 2.8, actual: 0.9 },
];

const alertTimeline = [
  { time: '2 hours ago', event: 'Response rate dropped below 1%', severity: 'critical' as const },
  { time: '1 day ago', event: '2 phone numbers flagged as spam', severity: 'warning' as const },
  { time: '3 days ago', event: 'List data age exceeded 30 days', severity: 'warning' as const },
  { time: '1 week ago', event: 'Response rate at target (2.8%)', severity: 'info' as const },
];

export default function DiagnosticsPage() {
  const [selectedCheck, setSelectedCheck] = useState<string | null>(null);
  const [isRunningDiagnostics, setIsRunningDiagnostics] = useState(false);

  const healthyCount = diagnosticChecks.filter(c => c.status === 'healthy').length;
  const warningCount = diagnosticChecks.filter(c => c.status === 'warning').length;
  const criticalCount = diagnosticChecks.filter(c => c.status === 'critical').length;

  const overallHealth = criticalCount > 0 ? 'critical' : warningCount > 0 ? 'warning' : 'healthy';

  const runDiagnostics = () => {
    setIsRunningDiagnostics(true);
    setTimeout(() => setIsRunningDiagnostics(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Response Diagnostics</h1>
          <p className="text-text-secondary mt-1">
            Systematic troubleshooting when response rates drop
          </p>
        </div>
        <button
          onClick={runDiagnostics}
          disabled={isRunningDiagnostics}
          className="btn-primary flex items-center gap-2"
        >
          <RefreshCw className={clsx('w-4 h-4', isRunningDiagnostics && 'animate-spin')} />
          {isRunningDiagnostics ? 'Running...' : 'Run Diagnostics'}
        </button>
      </div>

      {/* Overall Health Status */}
      <div className="glass-card-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="relative">
              <GaugeChart
                value={healthyCount}
                max={diagnosticChecks.length}
                label="Systems OK"
                size="lg"
              />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-xl font-semibold text-text-primary">System Health</h2>
                <HealthBadge status={overallHealth} />
              </div>
              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success" />
                  <span className="text-text-secondary">{healthyCount} Healthy</span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-warning" />
                  <span className="text-text-secondary">{warningCount} Warnings</span>
                </div>
                <div className="flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-danger" />
                  <span className="text-text-secondary">{criticalCount} Critical</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2">
            <button className="btn-secondary flex items-center gap-2">
              <Phone className="w-4 h-4" />
              Test Phone Lines
            </button>
            <button className="btn-secondary flex items-center gap-2">
              <Truck className="w-4 h-4" />
              Check USPS Status
            </button>
          </div>
        </div>
      </div>

      {/* Response Rate Alert */}
      <div className="glass-card p-6 border-l-4 border-danger">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-danger-muted">
            <TrendingDown className="w-6 h-6 text-danger" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-text-primary mb-1">
              Response Rate Drop Detected
            </h3>
            <p className="text-text-secondary mb-4">
              Response rate has dropped 67% over the past 3 weeks (from 2.7% to 0.9%).
              Run diagnostics to identify potential causes.
            </p>
            <div className="flex items-center gap-4">
              <ComparisonBar
                label="Response Rate"
                current={0.9}
                previous={2.7}
                format="percent"
              />
            </div>
          </div>
          <button className="btn-ghost text-sm">
            Dismiss
          </button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-12 gap-6">
        {/* Diagnostic Checks */}
        <div className="col-span-8 space-y-4">
          <h3 className="text-lg font-semibold text-text-primary">Diagnostic Checks</h3>

          {/* Category Groups */}
          {['Delivery', 'Infrastructure', 'Operations', 'Data', 'External'].map(category => {
            const categoryChecks = diagnosticChecks.filter(c => c.category === category);
            if (categoryChecks.length === 0) return null;

            return (
              <div key={category} className="glass-card overflow-hidden">
                <div className="px-4 py-3 bg-glass-surface border-b border-glass-border">
                  <span className="text-xs font-medium uppercase tracking-wider text-text-muted">
                    {category}
                  </span>
                </div>
                <div className="divide-y divide-glass-border/50">
                  {categoryChecks.map(check => (
                    <button
                      key={check.id}
                      onClick={() => setSelectedCheck(selectedCheck === check.id ? null : check.id)}
                      className="w-full px-4 py-4 flex items-center gap-4 hover:bg-glass-surface transition-colors text-left"
                    >
                      {/* Status Icon */}
                      <div className={clsx(
                        'p-2 rounded-lg',
                        check.status === 'healthy' && 'bg-success-muted',
                        check.status === 'warning' && 'bg-warning-muted',
                        check.status === 'critical' && 'bg-danger-muted'
                      )}>
                        {check.status === 'healthy' && <CheckCircle2 className="w-5 h-5 text-success" />}
                        {check.status === 'warning' && <AlertTriangle className="w-5 h-5 text-warning" />}
                        {check.status === 'critical' && <XCircle className="w-5 h-5 text-danger" />}
                      </div>

                      {/* Check Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-text-primary">{check.name}</span>
                          <HealthBadge status={check.status} label={check.status} />
                        </div>
                        <p className="text-sm text-text-secondary truncate">{check.message}</p>
                      </div>

                      {/* Last Checked */}
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-xs text-text-muted">
                          <Clock className="w-3 h-3" />
                          {check.lastChecked}
                        </div>
                      </div>

                      <ChevronRight className={clsx(
                        'w-5 h-5 text-text-muted transition-transform',
                        selectedCheck === check.id && 'rotate-90'
                      )} />
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Sidebar */}
        <div className="col-span-4 space-y-6">
          {/* Alert Timeline */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Recent Alerts</h3>
            <div className="space-y-4">
              {alertTimeline.map((alert, index) => (
                <div key={index} className="flex gap-3">
                  <div className={clsx(
                    'w-2 h-2 rounded-full mt-2 flex-shrink-0',
                    alert.severity === 'critical' && 'bg-danger',
                    alert.severity === 'warning' && 'bg-warning',
                    alert.severity === 'info' && 'bg-accent'
                  )} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text-primary">{alert.event}</p>
                    <p className="text-xs text-text-muted mt-0.5">{alert.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Response Rate Trend */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Response Rate Trend</h3>
            <div className="space-y-3">
              {responseHistory.map((week, index) => (
                <div key={week.date} className="flex items-center gap-3">
                  <span className="text-xs text-text-muted w-16">{week.date}</span>
                  <div className="flex-1 h-2 bg-dark-700 rounded-full overflow-hidden">
                    <div
                      className={clsx(
                        'h-full rounded-full transition-all',
                        week.actual >= week.expected * 0.8 ? 'bg-success' :
                        week.actual >= week.expected * 0.5 ? 'bg-warning' : 'bg-danger'
                      )}
                      style={{ width: `${(week.actual / 3) * 100}%` }}
                    />
                  </div>
                  <span className={clsx(
                    'text-xs font-medium w-12 text-right',
                    week.actual >= week.expected * 0.8 ? 'text-success' :
                    week.actual >= week.expected * 0.5 ? 'text-warning' : 'text-danger'
                  )}>
                    {week.actual}%
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-glass-border">
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-muted">Target Rate</span>
                <span className="text-text-primary font-medium">2.8%</span>
              </div>
            </div>
          </div>

          {/* Quick Troubleshooting Guide */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Troubleshooting Guide</h3>
            <div className="space-y-3">
              <a href="#" className="flex items-center gap-3 p-3 rounded-lg bg-glass-surface hover:bg-glass-surface-hover transition-colors">
                <HelpCircle className="w-5 h-5 text-accent" />
                <span className="text-sm text-text-secondary">Response rate dropped suddenly</span>
                <ExternalLink className="w-4 h-4 text-text-muted ml-auto" />
              </a>
              <a href="#" className="flex items-center gap-3 p-3 rounded-lg bg-glass-surface hover:bg-glass-surface-hover transition-colors">
                <HelpCircle className="w-5 h-5 text-accent" />
                <span className="text-sm text-text-secondary">Phone numbers flagged as spam</span>
                <ExternalLink className="w-4 h-4 text-text-muted ml-auto" />
              </a>
              <a href="#" className="flex items-center gap-3 p-3 rounded-lg bg-glass-surface hover:bg-glass-surface-hover transition-colors">
                <HelpCircle className="w-5 h-5 text-accent" />
                <span className="text-sm text-text-secondary">Mail delivery issues</span>
                <ExternalLink className="w-4 h-4 text-text-muted ml-auto" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Macro Factors Section */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-text-primary">External Factors</h3>
            <p className="text-sm text-text-secondary">Market conditions that may impact response rates</p>
          </div>
          <Badge variant="neutral">Last updated: Today</Badge>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-glass-surface">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-success" />
              <span className="text-xs text-text-muted uppercase tracking-wider">Economy</span>
            </div>
            <p className="text-sm text-text-primary">Stable</p>
            <p className="text-xs text-text-muted mt-1">No major layoff announcements</p>
          </div>

          <div className="p-4 rounded-xl bg-glass-surface">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-success" />
              <span className="text-xs text-text-muted uppercase tracking-wider">Government</span>
            </div>
            <p className="text-sm text-text-primary">Normal Operations</p>
            <p className="text-xs text-text-muted mt-1">No shutdowns or disruptions</p>
          </div>

          <div className="p-4 rounded-xl bg-glass-surface">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-warning" />
              <span className="text-xs text-text-muted uppercase tracking-wider">Seasonality</span>
            </div>
            <p className="text-sm text-text-primary">Holiday Period</p>
            <p className="text-xs text-text-muted mt-1">Expect 15-20% response dip</p>
          </div>

          <div className="p-4 rounded-xl bg-glass-surface">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-success" />
              <span className="text-xs text-text-muted uppercase tracking-wider">Competition</span>
            </div>
            <p className="text-sm text-text-primary">Moderate</p>
            <p className="text-xs text-text-muted mt-1">Normal mail volume in market</p>
          </div>
        </div>
      </div>
    </div>
  );
}
