'use client';

import { useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Calculator,
  ChevronDown,
  DollarSign,
  HelpCircle,
  Home,
  MapPin,
  Percent,
  Settings,
  Sliders,
  Target,
  TrendingDown,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { StatCard } from '@/components/StatCard';
import { Badge } from '@/components/Badge';
import { TrendChart, DonutChart, GaugeChart, ComparisonBar } from '@/components/Charts';
import clsx from 'clsx';

// Mock data
const marketCalibrations = [
  {
    id: '1',
    county: 'Travis County',
    state: 'TX',
    avmAccuracy: 92,
    recommendedOffset: -3,
    avgSpread: 18500,
    dealsAnalyzed: 124,
    medianHome: 425000,
    lastUpdated: '2 days ago',
  },
  {
    id: '2',
    county: 'Harris County',
    state: 'TX',
    avmAccuracy: 88,
    recommendedOffset: -5,
    avgSpread: 22000,
    dealsAnalyzed: 89,
    medianHome: 285000,
    lastUpdated: '3 days ago',
  },
  {
    id: '3',
    county: 'Dallas County',
    state: 'TX',
    avmAccuracy: 95,
    recommendedOffset: -2,
    avgSpread: 15000,
    dealsAnalyzed: 156,
    medianHome: 365000,
    lastUpdated: '1 day ago',
  },
  {
    id: '4',
    county: 'Bexar County',
    state: 'TX',
    avmAccuracy: 85,
    recommendedOffset: -8,
    avgSpread: 28000,
    dealsAnalyzed: 67,
    medianHome: 245000,
    lastUpdated: '5 days ago',
  },
];

const offerRules = [
  {
    id: '1',
    name: 'High Value Properties',
    condition: 'AVM > $500K',
    adjustment: '+3%',
    reason: 'Avoid psychologically low numbers',
    active: true,
  },
  {
    id: '2',
    name: 'Physical Distress',
    condition: 'Distress score > 70',
    adjustment: '-5%',
    reason: 'Higher renovation costs expected',
    active: true,
  },
  {
    id: '3',
    name: 'Financial Distress',
    condition: 'Pre-foreclosure or Tax Lien',
    adjustment: '-3%',
    reason: 'Motivated seller, faster close',
    active: true,
  },
  {
    id: '4',
    name: 'Absentee Owner',
    condition: 'Owner not at property',
    adjustment: '-2%',
    reason: 'Less emotional attachment',
    active: true,
  },
  {
    id: '5',
    name: 'Owner Distance',
    condition: 'Owner > 100 miles away',
    adjustment: '-2%',
    reason: 'Harder to manage property',
    active: false,
  },
];

const responseByOffer = [
  { offer: '65%', response: 0.8, contracts: 12 },
  { offer: '70%', response: 1.4, contracts: 18 },
  { offer: '75%', response: 2.2, contracts: 28 },
  { offer: '80%', response: 3.1, contracts: 35 },
  { offer: '85%', response: 3.8, contracts: 32 },
  { offer: '90%', response: 4.2, contracts: 22 },
];

export default function OfferCalibrationPage() {
  const [selectedMarket, setSelectedMarket] = useState<string | null>(null);
  const [baseOfferPercent, setBaseOfferPercent] = useState(78);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Offer Calibration</h1>
          <p className="text-text-secondary mt-1">
            Optimize offer percentages based on market data and property characteristics
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn-secondary flex items-center gap-2">
            <Calculator className="w-4 h-4" />
            Recalibrate All
          </button>
          <button className="btn-primary flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Configure Rules
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          title="Avg Response Rate"
          value="2.8%"
          subtitle="At current offer levels"
          icon={Target}
          color="success"
        />
        <StatCard
          title="Avg Spread"
          value="$21,200"
          trend={8.5}
          trendLabel="vs last quarter"
          icon={DollarSign}
          color="cyan"
        />
        <StatCard
          title="Markets Calibrated"
          value={marketCalibrations.length}
          subtitle="Active markets"
          icon={MapPin}
          color="accent"
        />
        <StatCard
          title="Optimal Offer Range"
          value="76-82%"
          subtitle="Based on analysis"
          icon={Sliders}
          color="violet"
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left Column */}
        <div className="col-span-8 space-y-6">
          {/* Response vs Offer Chart */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-text-primary">Response Rate by Offer %</h3>
                <p className="text-sm text-text-muted">Historical performance across all markets</p>
              </div>
              <div className="flex items-center gap-2">
                <button className="btn-ghost text-sm">Last 6 Months</button>
                <button className="btn-ghost text-sm">Last Year</button>
              </div>
            </div>
            <div className="grid grid-cols-6 gap-4">
              {responseByOffer.map((data) => (
                <div key={data.offer} className="text-center">
                  <div className="relative h-32 mb-2">
                    <div className="absolute inset-x-0 bottom-0 bg-dark-700 rounded-t-lg" style={{ height: '100%' }}>
                      <div
                        className={clsx(
                          'absolute inset-x-0 bottom-0 rounded-t-lg transition-all',
                          data.response >= 3 ? 'bg-success' :
                          data.response >= 2 ? 'bg-cyan-500' : 'bg-warning'
                        )}
                        style={{ height: `${(data.response / 4.5) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-lg font-semibold text-text-primary">{data.response}%</div>
                  <div className="text-sm text-text-muted">{data.offer}</div>
                  <div className="text-xs text-text-muted mt-1">{data.contracts} contracts</div>
                </div>
              ))}
            </div>
            <div className="mt-6 p-4 rounded-xl bg-glass-surface">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-accent-muted">
                  <Zap className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <h4 className="font-medium text-text-primary">Insight</h4>
                  <p className="text-sm text-text-secondary mt-1">
                    Sweet spot is 78-82% offer. Higher than 85% reduces spread significantly without
                    proportional response increase. Below 75% kills too many potential deals.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Market Calibrations */}
          <div className="glass-card overflow-hidden">
            <div className="px-6 py-4 border-b border-glass-border">
              <h3 className="font-semibold text-text-primary">Market Calibrations</h3>
              <p className="text-sm text-text-muted mt-1">AVM accuracy and recommended adjustments by county</p>
            </div>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Market</th>
                    <th>AVM Accuracy</th>
                    <th>Recommended Offset</th>
                    <th>Avg Spread</th>
                    <th>Deals Analyzed</th>
                    <th>Median Home</th>
                  </tr>
                </thead>
                <tbody>
                  {marketCalibrations.map((market) => (
                    <tr key={market.id} className="cursor-pointer" onClick={() => setSelectedMarket(market.id)}>
                      <td>
                        <div>
                          <span className="font-medium text-text-primary">{market.county}</span>
                          <span className="text-text-muted ml-1">{market.state}</span>
                        </div>
                        <span className="text-xs text-text-muted">Updated {market.lastUpdated}</span>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-dark-700 rounded-full overflow-hidden">
                            <div
                              className={clsx(
                                'h-full rounded-full',
                                market.avmAccuracy >= 90 ? 'bg-success' :
                                market.avmAccuracy >= 85 ? 'bg-warning' : 'bg-danger'
                              )}
                              style={{ width: `${market.avmAccuracy}%` }}
                            />
                          </div>
                          <span className="text-sm text-text-primary">{market.avmAccuracy}%</span>
                        </div>
                      </td>
                      <td>
                        <Badge variant={market.recommendedOffset <= -5 ? 'warning' : 'success'}>
                          {market.recommendedOffset}%
                        </Badge>
                      </td>
                      <td>
                        <span className="text-text-primary font-medium">
                          ${market.avgSpread.toLocaleString()}
                        </span>
                      </td>
                      <td>
                        <span className="text-text-secondary">{market.dealsAnalyzed}</span>
                      </td>
                      <td>
                        <span className="text-text-secondary">
                          ${market.medianHome.toLocaleString()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="col-span-4 space-y-6">
          {/* Offer Calculator */}
          <div className="glass-card p-6">
            <h3 className="font-semibold text-text-primary mb-4">Offer Calculator</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-text-muted mb-2 block">Base Offer %</label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="60"
                    max="95"
                    value={baseOfferPercent}
                    onChange={(e) => setBaseOfferPercent(Number(e.target.value))}
                    className="flex-1 h-2 bg-dark-700 rounded-full appearance-none cursor-pointer
                      [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                      [&::-webkit-slider-thumb]:bg-accent [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-glow-accent"
                  />
                  <span className="text-xl font-bold text-text-primary w-16 text-right">
                    {baseOfferPercent}%
                  </span>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-glass-surface">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-text-muted">For $300K AVM</span>
                </div>
                <div className="text-2xl font-bold text-accent">
                  ${(300000 * baseOfferPercent / 100).toLocaleString()}
                </div>
                <p className="text-xs text-text-muted mt-1">
                  Estimated response: {(baseOfferPercent >= 80 ? 3.2 : baseOfferPercent >= 75 ? 2.4 : 1.6).toFixed(1)}%
                </p>
              </div>
            </div>
          </div>

          {/* Dynamic Adjustments */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-text-primary">Dynamic Rules</h3>
              <button className="btn-ghost text-sm">Edit</button>
            </div>
            <div className="space-y-3">
              {offerRules.map((rule) => (
                <div
                  key={rule.id}
                  className={clsx(
                    'p-3 rounded-lg border transition-colors',
                    rule.active
                      ? 'bg-glass-surface border-glass-border'
                      : 'bg-transparent border-glass-border/50 opacity-50'
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-text-primary">{rule.name}</span>
                        <Badge
                          variant={rule.adjustment.startsWith('+') ? 'success' : 'warning'}
                          size="sm"
                        >
                          {rule.adjustment}
                        </Badge>
                      </div>
                      <p className="text-xs text-text-muted mt-1">{rule.condition}</p>
                    </div>
                    <button
                      className={clsx(
                        'w-10 h-5 rounded-full transition-colors',
                        rule.active ? 'bg-accent' : 'bg-dark-600'
                      )}
                    >
                      <div className={clsx(
                        'w-4 h-4 rounded-full bg-white transition-transform',
                        rule.active ? 'translate-x-5' : 'translate-x-0.5'
                      )} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Trade-off Explainer */}
          <div className="glass-card p-6">
            <div className="flex items-start gap-3 mb-4">
              <HelpCircle className="w-5 h-5 text-accent flex-shrink-0" />
              <h3 className="font-semibold text-text-primary">Response vs Spread Trade-off</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="text-center flex-1">
                  <div className="text-2xl font-bold text-danger">65%</div>
                  <div className="text-xs text-text-muted">Low offer</div>
                  <div className="mt-2 space-y-1 text-xs">
                    <div className="text-danger">0.8% response</div>
                    <div className="text-success">$45K spread</div>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-text-muted" />
                <div className="text-center flex-1">
                  <div className="text-2xl font-bold text-success">80%</div>
                  <div className="text-xs text-text-muted">Optimal</div>
                  <div className="mt-2 space-y-1 text-xs">
                    <div className="text-success">3.1% response</div>
                    <div className="text-warning">$22K spread</div>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-text-muted" />
                <div className="text-center flex-1">
                  <div className="text-2xl font-bold text-warning">90%</div>
                  <div className="text-xs text-text-muted">High offer</div>
                  <div className="mt-2 space-y-1 text-xs">
                    <div className="text-success">4.2% response</div>
                    <div className="text-danger">$8K spread</div>
                  </div>
                </div>
              </div>
              <p className="text-xs text-text-muted">
                Higher offers increase response but compress margins. The optimal balance
                maximizes total profit (deals × spread).
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
