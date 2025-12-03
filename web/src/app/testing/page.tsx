'use client';

import { useState } from 'react';
import {
  ArrowRight,
  BarChart3,
  BeakerIcon,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Clock,
  Copy,
  Edit3,
  FlaskConical,
  Layers,
  MoreHorizontal,
  Pause,
  Play,
  Plus,
  Sparkles,
  Target,
  TrendingUp,
  Trophy,
  Users,
  Zap,
} from 'lucide-react';
import { StatCard } from '@/components/StatCard';
import { Badge, StatusBadge } from '@/components/Badge';
import { DonutChart, ComparisonBar, GaugeChart } from '@/components/Charts';
import clsx from 'clsx';

// Mock data
const activeTests = [
  {
    id: '1',
    name: 'Check Letter vs Postcard - Austin Absentee',
    status: 'running',
    startDate: '2024-11-15',
    variants: [
      { name: 'Control: Check Letter', mailed: 5000, responses: 142, responseRate: 2.84, contracts: 8 },
      { name: 'Variant A: Postcard', mailed: 5000, responses: 98, responseRate: 1.96, contracts: 5 },
    ],
    confidence: 94,
    winner: 'Control',
    daysRemaining: 12,
  },
  {
    id: '2',
    name: 'Headline Test - Houston Pre-Foreclosure',
    status: 'running',
    startDate: '2024-11-20',
    variants: [
      { name: 'Headline A: "We Buy Houses Fast"', mailed: 3000, responses: 72, responseRate: 2.40, contracts: 4 },
      { name: 'Headline B: "Cash Offer in 24 Hours"', mailed: 3000, responses: 84, responseRate: 2.80, contracts: 5 },
      { name: 'Headline C: "Sell Your House As-Is"', mailed: 3000, responses: 69, responseRate: 2.30, contracts: 3 },
    ],
    confidence: 78,
    winner: null,
    daysRemaining: 18,
  },
  {
    id: '3',
    name: 'Offer Percentage Test - Dallas Tax Liens',
    status: 'completed',
    startDate: '2024-10-01',
    variants: [
      { name: '75% of AVM', mailed: 4000, responses: 88, responseRate: 2.20, contracts: 4 },
      { name: '80% of AVM', mailed: 4000, responses: 124, responseRate: 3.10, contracts: 7 },
      { name: '85% of AVM', mailed: 4000, responses: 156, responseRate: 3.90, contracts: 6 },
    ],
    confidence: 99,
    winner: '80% of AVM',
    daysRemaining: 0,
  },
];

const testIdeas = [
  { id: '1', type: 'format', title: 'Snap Pack vs Check Letter', impact: 'high', effort: 'medium' },
  { id: '2', type: 'copy', title: '"Sorry We Missed You" Card', impact: 'high', effort: 'low' },
  { id: '3', type: 'offer', title: 'Dynamic vs Fixed Offer %', impact: 'high', effort: 'high' },
  { id: '4', type: 'timing', title: 'Tuesday vs Thursday Drop', impact: 'medium', effort: 'low' },
  { id: '5', type: 'segment', title: 'Absentee-specific Messaging', impact: 'medium', effort: 'medium' },
];

export default function TestingPage() {
  const [selectedTest, setSelectedTest] = useState<string | null>(null);
  const [showNewTestModal, setShowNewTestModal] = useState(false);

  const runningTests = activeTests.filter(t => t.status === 'running').length;
  const completedTests = activeTests.filter(t => t.status === 'completed').length;
  const avgConfidence = Math.round(
    activeTests.filter(t => t.status === 'running').reduce((sum, t) => sum + t.confidence, 0) / runningTests
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">A/B Testing</h1>
          <p className="text-text-secondary mt-1">
            Design, run, and analyze multi-variant tests for campaigns
          </p>
        </div>
        <button
          onClick={() => setShowNewTestModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Test
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          title="Active Tests"
          value={runningTests}
          subtitle="Currently running"
          icon={FlaskConical}
          color="accent"
        />
        <StatCard
          title="Avg Confidence"
          value={`${avgConfidence}%`}
          subtitle="Statistical significance"
          icon={Target}
          color="cyan"
        />
        <StatCard
          title="Completed This Month"
          value={completedTests}
          trend={25}
          trendLabel="vs last month"
          icon={CheckCircle2}
          color="success"
        />
        <StatCard
          title="Avg Lift Found"
          value="+18.5%"
          subtitle="From winning variants"
          icon={TrendingUp}
          color="violet"
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-12 gap-6">
        {/* Active Tests */}
        <div className="col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-text-primary">Active Tests</h3>
            <div className="flex items-center gap-2">
              <button className="btn-ghost text-sm">All</button>
              <button className="btn-ghost text-sm">Running</button>
              <button className="btn-ghost text-sm">Completed</button>
            </div>
          </div>

          {activeTests.map((test) => (
            <div key={test.id} className="glass-card overflow-hidden">
              {/* Test Header */}
              <div className="p-4 border-b border-glass-border">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={clsx(
                      'p-2 rounded-lg',
                      test.status === 'running' ? 'bg-accent-muted' : 'bg-success-muted'
                    )}>
                      {test.status === 'running' ? (
                        <FlaskConical className="w-5 h-5 text-accent" />
                      ) : (
                        <Trophy className="w-5 h-5 text-success" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-medium text-text-primary">{test.name}</h4>
                      <div className="flex items-center gap-3 mt-1 text-sm text-text-muted">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Started {test.startDate}
                        </span>
                        <span className="flex items-center gap-1">
                          <Layers className="w-3 h-3" />
                          {test.variants.length} variants
                        </span>
                        {test.status === 'running' && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {test.daysRemaining} days remaining
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {test.status === 'running' ? (
                      <Badge variant="accent">Running</Badge>
                    ) : (
                      <Badge variant="success">Completed</Badge>
                    )}
                    <button className="btn-ghost p-2">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Variants */}
              <div className="p-4 space-y-3">
                {test.variants.map((variant, index) => {
                  const isWinner = test.winner === variant.name ||
                    (test.winner === 'Control' && index === 0);
                  const maxResponse = Math.max(...test.variants.map(v => v.responseRate));

                  return (
                    <div
                      key={variant.name}
                      className={clsx(
                        'p-4 rounded-xl transition-colors',
                        isWinner && test.status === 'completed'
                          ? 'bg-success-muted border border-success/30'
                          : 'bg-glass-surface'
                      )}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {isWinner && test.status === 'completed' && (
                            <Trophy className="w-4 h-4 text-success" />
                          )}
                          <span className={clsx(
                            'font-medium',
                            isWinner && test.status === 'completed'
                              ? 'text-success'
                              : 'text-text-primary'
                          )}>
                            {variant.name}
                          </span>
                          {isWinner && test.status === 'completed' && (
                            <Badge variant="success" size="sm">Winner</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-text-muted">
                            {variant.mailed.toLocaleString()} mailed
                          </span>
                          <span className="text-text-muted">
                            {variant.responses} responses
                          </span>
                          <span className="text-text-muted">
                            {variant.contracts} contracts
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-text-muted">Response Rate</span>
                            <span className={clsx(
                              'text-sm font-semibold',
                              isWinner ? 'text-success' : 'text-text-primary'
                            )}>
                              {variant.responseRate}%
                            </span>
                          </div>
                          <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
                            <div
                              className={clsx(
                                'h-full rounded-full transition-all',
                                isWinner ? 'bg-success' : 'bg-accent'
                              )}
                              style={{ width: `${(variant.responseRate / maxResponse) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Confidence Indicator */}
              <div className="px-4 pb-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-glass-surface">
                  <div className="flex items-center gap-3">
                    <GaugeChart value={test.confidence} size="sm" />
                    <div>
                      <span className="text-sm font-medium text-text-primary">
                        {test.confidence}% Statistical Confidence
                      </span>
                      <p className="text-xs text-text-muted">
                        {test.confidence >= 95
                          ? 'Results are statistically significant'
                          : test.confidence >= 80
                          ? 'Approaching significance, continue test'
                          : 'More data needed for conclusive results'}
                      </p>
                    </div>
                  </div>
                  {test.status === 'running' && (
                    <div className="flex items-center gap-2">
                      <button className="btn-ghost text-sm flex items-center gap-1">
                        <Pause className="w-3 h-3" />
                        Pause
                      </button>
                      <button className="btn-secondary text-sm">
                        End Test
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Sidebar */}
        <div className="col-span-4 space-y-6">
          {/* Test Ideas Backlog */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-text-primary">Test Ideas</h3>
              <button className="btn-ghost text-sm flex items-center gap-1">
                <Plus className="w-3 h-3" />
                Add
              </button>
            </div>
            <div className="space-y-2">
              {testIdeas.map((idea) => (
                <div
                  key={idea.id}
                  className="p-3 rounded-lg bg-glass-surface hover:bg-glass-surface-hover transition-colors cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <span className="text-sm font-medium text-text-primary">{idea.title}</span>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="neutral" size="sm">{idea.type}</Badge>
                        <span className={clsx(
                          'text-xs',
                          idea.impact === 'high' ? 'text-success' : 'text-warning'
                        )}>
                          {idea.impact} impact
                        </span>
                      </div>
                    </div>
                    <button className="btn-ghost p-1">
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Testing Best Practices */}
          <div className="glass-card p-6">
            <h3 className="font-semibold text-text-primary mb-4">Best Practices</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="p-1.5 rounded bg-accent-muted">
                  <Target className="w-3 h-3 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-text-primary">Test one variable at a time</p>
                  <p className="text-xs text-text-muted">Isolate changes for clear results</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-1.5 rounded bg-accent-muted">
                  <Users className="w-3 h-3 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-text-primary">Sample size matters</p>
                  <p className="text-xs text-text-muted">Aim for 1,000+ per variant</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-1.5 rounded bg-accent-muted">
                  <Clock className="w-3 h-3 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-text-primary">Allow enough time</p>
                  <p className="text-xs text-text-muted">4-6 weeks for meaningful data</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-1.5 rounded bg-accent-muted">
                  <BarChart3 className="w-3 h-3 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-text-primary">Wait for 95% confidence</p>
                  <p className="text-xs text-text-muted">Avoid calling winners early</p>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Learnings */}
          <div className="glass-card p-6">
            <h3 className="font-semibold text-text-primary mb-4">Recent Learnings</h3>
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-glass-surface">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-success" />
                  <span className="text-sm font-medium text-success">+45% Response</span>
                </div>
                <p className="text-sm text-text-secondary">
                  "Cash Offer" headline outperformed "We Buy Houses" in Houston market
                </p>
              </div>
              <div className="p-3 rounded-lg bg-glass-surface">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-success" />
                  <span className="text-sm font-medium text-success">+28% Contracts</span>
                </div>
                <p className="text-sm text-text-secondary">
                  80% offer percentage optimal for tax lien leads (vs 75% or 85%)
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
