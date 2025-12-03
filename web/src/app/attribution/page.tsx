'use client';

import { useState } from 'react';
import {
  ArrowRight,
  Calendar,
  Clock,
  DollarSign,
  Download,
  HelpCircle,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { StatCard } from '@/components/StatCard';
import { Badge } from '@/components/Badge';
import { TrendChart, DonutChart } from '@/components/Charts';

// Mock data
const attributionSummary = {
  totalRevenue: 2450000,
  shortTail: { revenue: 1680000, deals: 42, percentage: 68.6 },
  longTail: { revenue: 770000, deals: 18, percentage: 31.4 },
  avgDaysToClose: {
    shortTail: 28,
    longTail: 95,
  },
};

const cohortData = [
  {
    period: 'Q4 2024 Mail',
    mailedDate: 'Oct-Dec 2024',
    totalMailed: 45000,
    shortTailDeals: 28,
    shortTailRevenue: 980000,
    longTailDeals: 12,
    longTailRevenue: 420000,
    stillTracking: true,
  },
  {
    period: 'Q3 2024 Mail',
    mailedDate: 'Jul-Sep 2024',
    totalMailed: 52000,
    shortTailDeals: 35,
    shortTailRevenue: 1225000,
    longTailDeals: 18,
    longTailRevenue: 630000,
    stillTracking: false,
  },
  {
    period: 'Q2 2024 Mail',
    mailedDate: 'Apr-Jun 2024',
    totalMailed: 48000,
    shortTailDeals: 32,
    shortTailRevenue: 1120000,
    longTailDeals: 15,
    longTailRevenue: 525000,
    stillTracking: false,
  },
];

const monthlyAttribution = [
  { date: 'Jan', shortTail: 280000, longTail: 95000 },
  { date: 'Feb', shortTail: 320000, longTail: 120000 },
  { date: 'Mar', shortTail: 295000, longTail: 145000 },
  { date: 'Apr', shortTail: 340000, longTail: 110000 },
  { date: 'May', shortTail: 380000, longTail: 85000 },
  { date: 'Jun', shortTail: 365000, longTail: 125000 },
];

const campaignAttribution = [
  { campaign: 'Austin Q4 Absentee', spend: 12500, shortTail: 185000, longTail: 65000, roas: 20.0 },
  { campaign: 'Houston Pre-Foreclosure', spend: 8200, shortTail: 120000, longTail: 45000, roas: 20.1 },
  { campaign: 'Dallas Tax Liens', spend: 9800, shortTail: 95000, longTail: 82000, roas: 18.1 },
  { campaign: 'San Antonio Probate', spend: 6500, shortTail: 78000, longTail: 38000, roas: 17.8 },
];

export default function AttributionPage() {
  const [attributionWindow, setAttributionWindow] = useState('180');

  const totalROAS = (
    (attributionSummary.shortTail.revenue + attributionSummary.longTail.revenue) /
    (campaignAttribution.reduce((sum, c) => sum + c.spend, 0))
  ).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Revenue Attribution</h1>
          <p className="text-text-secondary mt-1">
            Track short-tail and long-tail deal value back to mail campaigns
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={attributionWindow}
            onChange={(e) => setAttributionWindow(e.target.value)}
            className="glass-select text-sm"
          >
            <option value="90">90-day window</option>
            <option value="180">180-day window</option>
            <option value="365">365-day window</option>
          </select>
          <button className="btn-secondary flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Key Insight Banner */}
      <div className="glass-card p-4 border-l-4 border-accent">
        <div className="flex items-start gap-4">
          <div className="p-2 rounded-lg bg-accent-muted">
            <Zap className="w-5 h-5 text-accent" />
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-text-primary">Long-Tail Revenue Insight</h3>
            <p className="text-sm text-text-secondary mt-1">
              <span className="text-accent font-semibold">31.4%</span> of your revenue comes from
              deals that close 60+ days after initial mail contact. Q4 mail is still generating
              deals - don't cut it prematurely based on short-term metrics alone.
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          title="Total Attributed Revenue"
          value={`$${(attributionSummary.totalRevenue / 1000000).toFixed(2)}M`}
          trend={12.4}
          trendLabel="vs last period"
          icon={DollarSign}
          color="success"
        />
        <StatCard
          title="Short-Tail Revenue"
          value={`$${(attributionSummary.shortTail.revenue / 1000).toFixed(0)}K`}
          subtitle={`${attributionSummary.shortTail.deals} deals (under 60 days)`}
          icon={Clock}
          color="cyan"
        />
        <StatCard
          title="Long-Tail Revenue"
          value={`$${(attributionSummary.longTail.revenue / 1000).toFixed(0)}K`}
          subtitle={`${attributionSummary.longTail.deals} deals (60+ days)`}
          icon={Calendar}
          color="violet"
        />
        <StatCard
          title="Blended ROAS"
          value={`${totalROAS}x`}
          subtitle="Including long-tail"
          icon={TrendingUp}
          color="success"
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left Column */}
        <div className="col-span-8 space-y-6">
          {/* Attribution Over Time */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-text-primary">Revenue by Attribution Window</h3>
                <p className="text-sm text-text-muted">Short-tail vs long-tail deal revenue</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-data-cyan" />
                  <span className="text-sm text-text-secondary">Short-tail (under 60 days)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-data-violet" />
                  <span className="text-sm text-text-secondary">Long-tail (60+ days)</span>
                </div>
              </div>
            </div>
            <TrendChart
              data={monthlyAttribution}
              title=""
              lines={[
                { key: 'shortTail', name: 'Short-tail', color: '#22d3ee' },
                { key: 'longTail', name: 'Long-tail', color: '#a78bfa' },
              ]}
            />
          </div>

          {/* Cohort Analysis */}
          <div className="glass-card overflow-hidden">
            <div className="px-6 py-4 border-b border-glass-border">
              <h3 className="font-semibold text-text-primary">Mail Cohort Analysis</h3>
              <p className="text-sm text-text-muted mt-1">
                Track revenue attribution by mail period
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Mail Period</th>
                    <th>Total Mailed</th>
                    <th>Short-tail</th>
                    <th>Long-tail</th>
                    <th>Total Revenue</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {cohortData.map((cohort) => (
                    <tr key={cohort.period}>
                      <td>
                        <div>
                          <span className="font-medium text-text-primary">{cohort.period}</span>
                          <p className="text-xs text-text-muted">{cohort.mailedDate}</p>
                        </div>
                      </td>
                      <td>
                        <span className="text-text-secondary">{cohort.totalMailed.toLocaleString()}</span>
                      </td>
                      <td>
                        <div>
                          <span className="text-text-primary font-medium">
                            ${(cohort.shortTailRevenue / 1000).toFixed(0)}K
                          </span>
                          <p className="text-xs text-text-muted">{cohort.shortTailDeals} deals</p>
                        </div>
                      </td>
                      <td>
                        <div>
                          <span className="text-data-violet font-medium">
                            ${(cohort.longTailRevenue / 1000).toFixed(0)}K
                          </span>
                          <p className="text-xs text-text-muted">{cohort.longTailDeals} deals</p>
                        </div>
                      </td>
                      <td>
                        <span className="text-text-primary font-semibold">
                          ${((cohort.shortTailRevenue + cohort.longTailRevenue) / 1000).toFixed(0)}K
                        </span>
                      </td>
                      <td>
                        {cohort.stillTracking ? (
                          <Badge variant="accent">Tracking</Badge>
                        ) : (
                          <Badge variant="success">Complete</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Campaign Attribution */}
          <div className="glass-card overflow-hidden">
            <div className="px-6 py-4 border-b border-glass-border">
              <h3 className="font-semibold text-text-primary">Campaign Attribution</h3>
              <p className="text-sm text-text-muted mt-1">
                ROAS including long-tail revenue
              </p>
            </div>
            <div className="p-6 space-y-4">
              {campaignAttribution.map((campaign) => {
                const totalRevenue = campaign.shortTail + campaign.longTail;
                const longTailPercent = (campaign.longTail / totalRevenue) * 100;

                return (
                  <div key={campaign.campaign} className="p-4 rounded-xl bg-glass-surface">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <span className="font-medium text-text-primary">{campaign.campaign}</span>
                        <p className="text-xs text-text-muted">
                          ${campaign.spend.toLocaleString()} spend
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-bold text-success">{campaign.roas}x ROAS</span>
                        <p className="text-xs text-text-muted">
                          ${totalRevenue.toLocaleString()} total
                        </p>
                      </div>
                    </div>
                    <div className="h-3 bg-dark-700 rounded-full overflow-hidden flex">
                      <div
                        className="h-full bg-data-cyan"
                        style={{ width: `${100 - longTailPercent}%` }}
                      />
                      <div
                        className="h-full bg-data-violet"
                        style={{ width: `${longTailPercent}%` }}
                      />
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-text-muted">
                      <span>Short-tail: ${(campaign.shortTail / 1000).toFixed(0)}K</span>
                      <span>Long-tail: ${(campaign.longTail / 1000).toFixed(0)}K ({longTailPercent.toFixed(0)}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="col-span-4 space-y-6">
          {/* Attribution Breakdown */}
          <DonutChart
            data={[
              { name: 'Short-tail (under 60 days)', value: attributionSummary.shortTail.percentage, color: '#22d3ee' },
              { name: 'Long-tail (60+ days)', value: attributionSummary.longTail.percentage, color: '#a78bfa' },
            ]}
            title="Revenue Split"
            centerValue={`$${(attributionSummary.totalRevenue / 1000000).toFixed(1)}M`}
            centerLabel="Total"
          />

          {/* Days to Close */}
          <div className="glass-card p-6">
            <h3 className="font-semibold text-text-primary mb-4">Average Days to Close</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-glass-surface">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-data-cyan/10">
                    <Clock className="w-5 h-5 text-data-cyan" />
                  </div>
                  <div>
                    <span className="text-sm font-medium text-text-primary">Short-tail Deals</span>
                    <p className="text-xs text-text-muted">Quick conversions</p>
                  </div>
                </div>
                <span className="text-xl font-bold text-data-cyan">
                  {attributionSummary.avgDaysToClose.shortTail} days
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-glass-surface">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-data-violet/10">
                    <Calendar className="w-5 h-5 text-data-violet" />
                  </div>
                  <div>
                    <span className="text-sm font-medium text-text-primary">Long-tail Deals</span>
                    <p className="text-xs text-text-muted">Extended nurture</p>
                  </div>
                </div>
                <span className="text-xl font-bold text-data-violet">
                  {attributionSummary.avgDaysToClose.longTail} days
                </span>
              </div>
            </div>
          </div>

          {/* Q4 Attribution Warning */}
          <div className="glass-card p-6 border border-warning/30">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-warning-muted">
                <HelpCircle className="w-5 h-5 text-warning" />
              </div>
              <div>
                <h3 className="font-medium text-text-primary">Q4 Mail Still Working</h3>
                <p className="text-sm text-text-secondary mt-1">
                  Your Q4 2024 mail has generated $980K in short-tail revenue so far.
                  Based on historical patterns, expect an additional{' '}
                  <span className="text-warning font-medium">$350-450K</span> in
                  long-tail revenue through Q1-Q2 2025.
                </p>
                <div className="mt-3 p-3 rounded-lg bg-glass-surface">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-text-muted">Projected Q4 Total</span>
                    <span className="font-medium text-text-primary">$1.35-1.43M</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-1">
                    <span className="text-text-muted">Projected ROAS</span>
                    <span className="font-medium text-success">18-19x</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Decision Framework */}
          <div className="glass-card p-6">
            <h3 className="font-semibold text-text-primary mb-4">Cut or Continue?</h3>
            <p className="text-sm text-text-secondary mb-4">
              Use blended ROAS (including projected long-tail) to evaluate campaigns:
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-2 rounded-lg bg-success-muted">
                <div className="w-2 h-2 rounded-full bg-success" />
                <span className="text-sm text-success">≥ 15x: Scale up</span>
              </div>
              <div className="flex items-center gap-3 p-2 rounded-lg bg-accent-muted">
                <div className="w-2 h-2 rounded-full bg-accent" />
                <span className="text-sm text-accent">10-15x: Maintain</span>
              </div>
              <div className="flex items-center gap-3 p-2 rounded-lg bg-warning-muted">
                <div className="w-2 h-2 rounded-full bg-warning" />
                <span className="text-sm text-warning">5-10x: Optimize</span>
              </div>
              <div className="flex items-center gap-3 p-2 rounded-lg bg-danger-muted">
                <div className="w-2 h-2 rounded-full bg-danger" />
                <span className="text-sm text-danger">&lt; 5x: Review/pause</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
