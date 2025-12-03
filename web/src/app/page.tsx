'use client';

import { useQuery } from '@tanstack/react-query';
import { StatCard } from '@/components/StatCard';
import { TrendChart, PipelineChart, DonutChart, Sparkline, GaugeChart } from '@/components/Charts';
import { Badge, StatusBadge, HealthBadge } from '@/components/Badge';
import { getAccounts, getHealth } from '@/lib/api';
import {
  Mail,
  Phone,
  FileCheck,
  DollarSign,
  TrendingUp,
  Target,
  Clock,
  BarChart3,
  AlertTriangle,
  ArrowRight,
  Activity,
  Zap,
  Calendar,
} from 'lucide-react';
import Link from 'next/link';
import clsx from 'clsx';

// Mock data for demo
const mockTrends = [
  { date: 'Jan', mailed: 12000, calls: 180, contracts: 12 },
  { date: 'Feb', mailed: 15000, calls: 225, contracts: 15 },
  { date: 'Mar', mailed: 18000, calls: 270, contracts: 18 },
  { date: 'Apr', mailed: 14000, calls: 210, contracts: 14 },
  { date: 'May', mailed: 20000, calls: 300, contracts: 20 },
  { date: 'Jun', mailed: 22000, calls: 330, contracts: 22 },
];

const mockPipeline = [
  { status: 'Pending', count: 45, value: 2250000 },
  { status: 'Under Contract', count: 28, value: 1400000 },
  { status: 'Due Diligence', count: 15, value: 750000 },
  { status: 'Closed', count: 89, value: 4450000 },
];

const mockCampaigns = [
  { id: '1', name: 'Q4 Absentee Owners', status: 'ACTIVE', mailed: 15000, responseRate: 2.8, contracts: 15, roas: 18.5 },
  { id: '2', name: 'Pre-Foreclosure Outreach', status: 'ACTIVE', mailed: 8000, responseRate: 3.2, contracts: 12, roas: 22.1 },
  { id: '3', name: 'High Equity Seniors', status: 'PAUSED', mailed: 12000, responseRate: 1.8, contracts: 8, roas: 12.4 },
  { id: '4', name: 'Tax Lien Follow-up', status: 'ACTIVE', mailed: 5000, responseRate: 4.1, contracts: 7, roas: 24.8 },
];

const recentAlerts = [
  { type: 'warning', message: '2 phone numbers flagged for spam', time: '2 hours ago' },
  { type: 'info', message: 'Q4 mail cohort tracking: +$45K long-tail', time: '1 day ago' },
  { type: 'success', message: 'A/B test concluded: Check Letter wins', time: '2 days ago' },
];

const attributionBreakdown = [
  { name: 'Short-tail (under 60 days)', value: 68, color: '#22d3ee' },
  { name: 'Long-tail (60+ days)', value: 32, color: '#a78bfa' },
];

export default function DashboardPage() {
  const { data: health } = useQuery({
    queryKey: ['health'],
    queryFn: getHealth,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>
          <p className="text-text-secondary mt-1">
            Direct mail performance overview
          </p>
        </div>
        <div className="flex items-center gap-4">
          <HealthBadge
            status={health?.status === 'ok' ? 'healthy' : 'warning'}
            label={health?.status === 'ok' ? 'All Systems Operational' : 'Check Status'}
          />
        </div>
      </div>

      {/* Alert Banner */}
      {recentAlerts.some(a => a.type === 'warning') && (
        <Link href="/diagnostics" className="block">
          <div className="glass-card p-4 border-l-4 border-warning hover:border-warning-light transition-colors cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-lg bg-warning-muted">
                <AlertTriangle className="w-5 h-5 text-warning" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-text-primary">
                  {recentAlerts.find(a => a.type === 'warning')?.message}
                </p>
                <p className="text-sm text-text-muted">
                  Click to run diagnostics
                </p>
              </div>
              <ArrowRight className="w-5 h-5 text-text-muted" />
            </div>
          </div>
        </Link>
      )}

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          title="Total Mailed"
          value="101,000"
          subtitle="Last 6 months"
          icon={Mail}
          trend={12.5}
          trendLabel="vs last period"
          color="cyan"
        />
        <StatCard
          title="Response Rate"
          value="2.8%"
          subtitle="1,515 total calls"
          icon={Phone}
          trend={8.2}
          trendLabel="vs last period"
          color="success"
        />
        <StatCard
          title="Contracts"
          value="101"
          subtitle="0.1% of mailed"
          icon={FileCheck}
          trend={15.3}
          trendLabel="vs last period"
          color="accent"
        />
        <StatCard
          title="Blended ROAS"
          value="18.5x"
          subtitle="Including long-tail"
          icon={TrendingUp}
          trend={22.1}
          trendLabel="vs last period"
          color="violet"
        />
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-4 gap-4">
        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-text-muted uppercase tracking-wider">Cost per Contract</p>
              <p className="text-2xl font-semibold text-text-primary mt-1">$850</p>
            </div>
            <Sparkline data={[1200, 1100, 950, 920, 880, 850]} color="#22d3ee" height={36} />
          </div>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-text-muted uppercase tracking-wider">Avg Spread</p>
              <p className="text-2xl font-semibold text-text-primary mt-1">$21,200</p>
            </div>
            <Sparkline data={[18000, 19500, 20000, 21000, 21500, 21200]} color="#34d399" height={36} />
          </div>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-text-muted uppercase tracking-wider">Days to Close</p>
              <p className="text-2xl font-semibold text-text-primary mt-1">42 days</p>
            </div>
            <Sparkline data={[55, 52, 48, 45, 43, 42]} color="#a78bfa" height={36} />
          </div>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-text-muted uppercase tracking-wider">Active Tests</p>
              <p className="text-2xl font-semibold text-text-primary mt-1">3</p>
            </div>
            <Link href="/testing" className="btn-ghost text-sm flex items-center gap-1">
              View <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-8">
          <TrendChart data={mockTrends} title="Performance Trends" />
        </div>
        <div className="col-span-4">
          <DonutChart
            data={attributionBreakdown}
            title="Revenue Attribution"
            centerValue="$2.1M"
            centerLabel="Total"
          />
        </div>
      </div>

      {/* Second Row */}
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-4">
          <PipelineChart data={mockPipeline} />
        </div>
        <div className="col-span-8">
          {/* Active Campaigns Table */}
          <div className="glass-card overflow-hidden">
            <div className="px-6 py-4 border-b border-glass-border flex items-center justify-between">
              <h3 className="font-semibold text-text-primary">Active Campaigns</h3>
              <Link href="/campaigns" className="text-sm text-accent hover:text-accent-light flex items-center gap-1">
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Campaign</th>
                    <th>Status</th>
                    <th className="text-right">Mailed</th>
                    <th className="text-right">Response</th>
                    <th className="text-right">Contracts</th>
                    <th className="text-right">ROAS</th>
                  </tr>
                </thead>
                <tbody>
                  {mockCampaigns.map((campaign) => (
                    <tr key={campaign.id}>
                      <td>
                        <span className="font-medium text-text-primary">{campaign.name}</span>
                      </td>
                      <td>
                        <StatusBadge status={campaign.status} />
                      </td>
                      <td className="text-right text-text-secondary">
                        {campaign.mailed.toLocaleString()}
                      </td>
                      <td className="text-right">
                        <span className={clsx(
                          'font-medium',
                          campaign.responseRate >= 3 ? 'text-success' :
                          campaign.responseRate >= 2 ? 'text-warning' : 'text-danger'
                        )}>
                          {campaign.responseRate}%
                        </span>
                      </td>
                      <td className="text-right text-text-secondary">
                        {campaign.contracts}
                      </td>
                      <td className="text-right">
                        <span className={clsx(
                          'font-semibold',
                          campaign.roas >= 20 ? 'text-success' :
                          campaign.roas >= 15 ? 'text-accent' : 'text-warning'
                        )}>
                          {campaign.roas}x
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions Row */}
      <div className="grid grid-cols-3 gap-4">
        <Link href="/diagnostics" className="glass-card p-5 hover:border-glass-border-hover transition-colors group">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-accent-muted group-hover:bg-accent/20 transition-colors">
              <Activity className="w-6 h-6 text-accent" />
            </div>
            <div>
              <h4 className="font-medium text-text-primary">Run Diagnostics</h4>
              <p className="text-sm text-text-muted mt-1">
                Troubleshoot response drops systematically
              </p>
            </div>
          </div>
        </Link>
        <Link href="/testing" className="glass-card p-5 hover:border-glass-border-hover transition-colors group">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-success-muted group-hover:bg-success/20 transition-colors">
              <Zap className="w-6 h-6 text-success" />
            </div>
            <div>
              <h4 className="font-medium text-text-primary">A/B Testing</h4>
              <p className="text-sm text-text-muted mt-1">
                3 active tests running
              </p>
            </div>
          </div>
        </Link>
        <Link href="/attribution" className="glass-card p-5 hover:border-glass-border-hover transition-colors group">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-data-violet/10 group-hover:bg-data-violet/20 transition-colors">
              <Calendar className="w-6 h-6 text-data-violet" />
            </div>
            <div>
              <h4 className="font-medium text-text-primary">Attribution</h4>
              <p className="text-sm text-text-muted mt-1">
                Track long-tail deal value
              </p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
