'use client';

import { useState } from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  CloudSun,
  Gift,
  Leaf,
  Mail,
  Snowflake,
  Sun,
  TrendingDown,
  TrendingUp,
  Umbrella,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  DollarSign,
} from 'lucide-react';
import { StatCard } from '@/components/StatCard';
import { Badge } from '@/components/Badge';
import clsx from 'clsx';

// Types
type Season = 'Q1' | 'Q2' | 'Q3' | 'Q4';
type Month = 'Jan' | 'Feb' | 'Mar' | 'Apr' | 'May' | 'Jun' | 'Jul' | 'Aug' | 'Sep' | 'Oct' | 'Nov' | 'Dec';

interface SeasonalPattern {
  month: Month;
  responseMultiplier: number;
  mailVolume: number;
  competition: 'low' | 'medium' | 'high';
  events: string[];
  recommendations: string[];
}

interface SegmentSeasonality {
  segment: string;
  bestMonths: Month[];
  worstMonths: Month[];
  bestCreatives: string[];
  seasonalTips: string[];
}

// Mock Data
const seasonalPatterns: SeasonalPattern[] = [
  {
    month: 'Jan',
    responseMultiplier: 1.15,
    mailVolume: 85000,
    competition: 'medium',
    events: ['New Year resolutions', 'Tax prep begins'],
    recommendations: ['Income-tax themed check letters', 'Fresh start messaging'],
  },
  {
    month: 'Feb',
    responseMultiplier: 1.05,
    mailVolume: 78000,
    competition: 'medium',
    events: ['Tax season ramps up'],
    recommendations: ['Tax refund offers', 'Valentine awareness (skip aggressive)'],
  },
  {
    month: 'Mar',
    responseMultiplier: 1.20,
    mailVolume: 92000,
    competition: 'high',
    events: ['Tax deadline approaching', 'Spring selling season starts'],
    recommendations: ['Tax deadline urgency', 'Spring refresh messaging'],
  },
  {
    month: 'Apr',
    responseMultiplier: 1.25,
    mailVolume: 98000,
    competition: 'high',
    events: ['Tax deadline (15th)', 'Peak spring market'],
    recommendations: ['Post-tax relief offers', 'Spring market opportunity'],
  },
  {
    month: 'May',
    responseMultiplier: 1.10,
    mailVolume: 88000,
    competition: 'medium',
    events: ['Memorial Day', 'School ending'],
    recommendations: ['Summer move planning', 'Life transition messaging'],
  },
  {
    month: 'Jun',
    responseMultiplier: 0.95,
    mailVolume: 72000,
    competition: 'low',
    events: ['Summer begins', 'Vacation season'],
    recommendations: ['Lower volume, higher quality', 'Vacation-away timing'],
  },
  {
    month: 'Jul',
    responseMultiplier: 0.85,
    mailVolume: 65000,
    competition: 'low',
    events: ['Peak summer', 'July 4th holiday'],
    recommendations: ['Reduce spend', 'Focus on nurture sequences'],
  },
  {
    month: 'Aug',
    responseMultiplier: 0.90,
    mailVolume: 70000,
    competition: 'low',
    events: ['Back to school', 'Summer winding down'],
    recommendations: ['Back-to-school transitions', 'Fall prep messaging'],
  },
  {
    month: 'Sep',
    responseMultiplier: 1.05,
    mailVolume: 82000,
    competition: 'medium',
    events: ['Fall market begins', 'Labor Day'],
    recommendations: ['Fall selling motivation', 'Year-end planning'],
  },
  {
    month: 'Oct',
    responseMultiplier: 1.10,
    mailVolume: 86000,
    competition: 'medium',
    events: ['Fall season', 'Pre-holiday decisions'],
    recommendations: ['Before-holiday urgency', 'Year-end tax planning'],
  },
  {
    month: 'Nov',
    responseMultiplier: 0.75,
    mailVolume: 58000,
    competition: 'low',
    events: ['Thanksgiving', 'Holiday prep begins'],
    recommendations: ['Pause around Thanksgiving', 'Early month only'],
  },
  {
    month: 'Dec',
    responseMultiplier: 0.65,
    mailVolume: 45000,
    competition: 'low',
    events: ['Holiday season', 'Year-end'],
    recommendations: ['Minimal mailing', '"Sorry We Missed You" for package season'],
  },
];

const segmentSeasonality: SegmentSeasonality[] = [
  {
    segment: 'Absentee Owners',
    bestMonths: ['Mar', 'Apr', 'Oct'],
    worstMonths: ['Nov', 'Dec', 'Jul'],
    bestCreatives: ['Tax-themed check letters', 'Landlord-to-landlord', 'Year-end tax savings'],
    seasonalTips: [
      'Q1 tax season is gold - landlords thinking about capital gains',
      'Q4 year-end tax planning before Dec 31 deadlines',
      'Summer is slow - use for nurture, not acquisition',
    ],
  },
  {
    segment: 'Owner-Occupants',
    bestMonths: ['Apr', 'May', 'Sep'],
    worstMonths: ['Dec', 'Jul', 'Aug'],
    bestCreatives: ['Sorry We Missed You', 'Handwritten style', 'Local community messaging'],
    seasonalTips: [
      'Spring move season aligns with school year planning',
      'Package delivery season (Q4) makes "Sorry We Missed You" effective',
      'Avoid aggressive offers during holidays - use warm, personal tone',
    ],
  },
  {
    segment: 'Pre-Foreclosure',
    bestMonths: ['Jan', 'Feb', 'Sep'],
    worstMonths: ['Nov', 'Dec'],
    bestCreatives: ['Urgency letters', 'Snap pack official-looking', 'Direct help messaging'],
    seasonalTips: [
      'Post-holiday financial stress creates motivation in Q1',
      'Avoid holiday period - people are distracted and emotional',
      'Fall is strong as people face year-end financial reality',
    ],
  },
  {
    segment: 'Probate',
    bestMonths: ['Feb', 'Mar', 'Oct'],
    worstMonths: ['Nov', 'Dec', 'Jul'],
    bestCreatives: ['Gentle handwritten', 'Professional condolence', 'Estate assistance'],
    seasonalTips: [
      'Post-holiday grief processing leads to action in Feb-Mar',
      'Absolutely avoid aggressive messaging around holidays',
      'Summer slower as families are distracted',
    ],
  },
];

const currentMonth = 'Dec' as Month;
const currentSeason: Season = 'Q4';

export default function SeasonalityPage() {
  const [selectedMonth, setSelectedMonth] = useState<Month>(currentMonth);
  const [selectedSegment, setSelectedSegment] = useState<string>('all');

  const selectedPattern = seasonalPatterns.find((p) => p.month === selectedMonth);
  const avgMultiplier = seasonalPatterns.reduce((sum, p) => sum + p.responseMultiplier, 0) / 12;

  const getSeasonIcon = (month: Month) => {
    const idx = seasonalPatterns.findIndex((p) => p.month === month);
    if (idx < 3) return Snowflake; // Q1
    if (idx < 6) return Sun; // Q2
    if (idx < 9) return Leaf; // Q3
    return Gift; // Q4
  };

  const getMultiplierColor = (multiplier: number) => {
    if (multiplier >= 1.15) return 'text-success';
    if (multiplier >= 1.0) return 'text-data-cyan';
    if (multiplier >= 0.85) return 'text-warning';
    return 'text-danger';
  };

  const getCompetitionBadge = (competition: string) => {
    switch (competition) {
      case 'high':
        return <Badge variant="danger" size="sm">High Competition</Badge>;
      case 'medium':
        return <Badge variant="warning" size="sm">Medium Competition</Badge>;
      case 'low':
        return <Badge variant="success" size="sm">Low Competition</Badge>;
    }
  };

  const SeasonIcon = getSeasonIcon(selectedMonth);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Seasonality Intelligence</h1>
          <p className="text-text-secondary mt-1">
            Optimize campaigns with seasonal timing and creative recommendations
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="accent" size="lg">
            <Calendar className="w-4 h-4 mr-1" />
            Currently: {currentMonth} ({currentSeason})
          </Badge>
        </div>
      </div>

      {/* Current Season Alert */}
      <div className="glass-card p-6 border-l-4 border-warning">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-warning-muted">
            <Gift className="w-6 h-6 text-warning" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-text-primary mb-1">
              Q4 Holiday Season Active
            </h3>
            <p className="text-text-secondary mb-3">
              December is historically the lowest response month (0.65x baseline).
              Focus on nurture sequences and minimal new acquisition mailing.
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="success" size="sm">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Use "Sorry We Missed You" for package season
              </Badge>
              <Badge variant="warning" size="sm">
                <AlertTriangle className="w-3 h-3 mr-1" />
                Avoid aggressive offers
              </Badge>
              <Badge variant="cyan" size="sm">
                <Sparkles className="w-3 h-3 mr-1" />
                Warm, personal messaging only
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          title="Current Month Multiplier"
          value={`${(selectedPattern?.responseMultiplier || 1).toFixed(2)}x`}
          subtitle={`vs ${avgMultiplier.toFixed(2)}x average`}
          icon={TrendingUp}
          color={selectedPattern && selectedPattern.responseMultiplier >= 1 ? 'success' : 'warning'}
        />
        <StatCard
          title="Recommended Volume"
          value={selectedPattern?.mailVolume.toLocaleString() || '0'}
          subtitle="Pieces this month"
          icon={Mail}
          color="cyan"
        />
        <StatCard
          title="Best Upcoming Month"
          value="Apr"
          subtitle="1.25x multiplier"
          icon={Calendar}
          color="accent"
        />
        <StatCard
          title="Competition Level"
          value={selectedPattern?.competition || 'N/A'}
          subtitle="Market saturation"
          icon={DollarSign}
          color={selectedPattern?.competition === 'low' ? 'success' : selectedPattern?.competition === 'high' ? 'danger' : 'warning'}
        />
      </div>

      {/* Monthly Calendar View */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold text-text-primary mb-4">Annual Response Pattern</h3>
        <div className="grid grid-cols-12 gap-2">
          {seasonalPatterns.map((pattern) => {
            const MonthIcon = getSeasonIcon(pattern.month);
            const isSelected = pattern.month === selectedMonth;
            const isCurrent = pattern.month === currentMonth;

            return (
              <button
                key={pattern.month}
                onClick={() => setSelectedMonth(pattern.month)}
                className={clsx(
                  'p-4 rounded-xl transition-all text-center',
                  isSelected
                    ? 'bg-accent text-white shadow-glow-accent'
                    : 'bg-glass-surface hover:bg-glass-surface-hover',
                  isCurrent && !isSelected && 'ring-2 ring-warning'
                )}
              >
                <MonthIcon className={clsx(
                  'w-5 h-5 mx-auto mb-2',
                  isSelected ? 'text-white' : 'text-text-muted'
                )} />
                <p className={clsx(
                  'text-xs font-semibold mb-1',
                  isSelected ? 'text-white' : 'text-text-primary'
                )}>
                  {pattern.month}
                </p>
                <p className={clsx(
                  'text-lg font-bold',
                  isSelected ? 'text-white' : getMultiplierColor(pattern.responseMultiplier)
                )}>
                  {pattern.responseMultiplier.toFixed(2)}x
                </p>
                <div className={clsx(
                  'h-1 rounded-full mt-2',
                  isSelected ? 'bg-white/30' : 'bg-dark-700'
                )}>
                  <div
                    className={clsx(
                      'h-full rounded-full',
                      isSelected ? 'bg-white' : pattern.responseMultiplier >= 1 ? 'bg-success' : 'bg-warning'
                    )}
                    style={{ width: `${(pattern.responseMultiplier / 1.25) * 100}%` }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Month Details */}
      {selectedPattern && (
        <div className="grid grid-cols-2 gap-6">
          <div className="glass-card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className={clsx(
                'p-3 rounded-xl',
                selectedPattern.responseMultiplier >= 1 ? 'bg-success-muted' : 'bg-warning-muted'
              )}>
                <SeasonIcon className={clsx(
                  'w-6 h-6',
                  selectedPattern.responseMultiplier >= 1 ? 'text-success' : 'text-warning'
                )} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-text-primary">{selectedPattern.month} Details</h3>
                {getCompetitionBadge(selectedPattern.competition)}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-text-muted mb-2">Key Events</p>
                <div className="flex flex-wrap gap-2">
                  {selectedPattern.events.map((event) => (
                    <Badge key={event} variant="neutral">{event}</Badge>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm text-text-muted mb-2">Recommendations</p>
                <ul className="space-y-2">
                  {selectedPattern.recommendations.map((rec) => (
                    <li key={rec} className="flex items-start gap-2 text-sm text-text-secondary">
                      <Sparkles className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Volume & Competition Trend</h3>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-text-muted">Recommended Mail Volume</span>
                  <span className="text-sm font-semibold text-text-primary">
                    {selectedPattern.mailVolume.toLocaleString()} pieces
                  </span>
                </div>
                <div className="h-3 bg-dark-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent rounded-full"
                    style={{ width: `${(selectedPattern.mailVolume / 100000) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-text-muted">Response Multiplier</span>
                  <span className={clsx('text-sm font-semibold', getMultiplierColor(selectedPattern.responseMultiplier))}>
                    {selectedPattern.responseMultiplier.toFixed(2)}x baseline
                  </span>
                </div>
                <div className="h-3 bg-dark-700 rounded-full overflow-hidden">
                  <div
                    className={clsx(
                      'h-full rounded-full',
                      selectedPattern.responseMultiplier >= 1 ? 'bg-success' : 'bg-warning'
                    )}
                    style={{ width: `${(selectedPattern.responseMultiplier / 1.25) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Segment-Specific Seasonality */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold text-text-primary mb-4">Segment Seasonality Insights</h3>
        <div className="grid grid-cols-2 gap-4">
          {segmentSeasonality.map((segment) => (
            <div key={segment.segment} className="p-4 rounded-xl bg-glass-surface">
              <h4 className="font-semibold text-text-primary mb-3">{segment.segment}</h4>

              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-success" />
                    <span className="text-xs text-text-muted">Best:</span>
                    <div className="flex gap-1">
                      {segment.bestMonths.map((m) => (
                        <Badge key={m} variant="success" size="sm">{m}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="w-4 h-4 text-danger" />
                    <span className="text-xs text-text-muted">Avoid:</span>
                    <div className="flex gap-1">
                      {segment.worstMonths.map((m) => (
                        <Badge key={m} variant="danger" size="sm">{m}</Badge>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-glass-border">
                  <p className="text-xs text-text-muted mb-1">Best Creatives</p>
                  <div className="flex flex-wrap gap-1">
                    {segment.bestCreatives.map((c) => (
                      <Badge key={c} variant="neutral" size="sm">{c}</Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs text-text-muted mb-1">Tips</p>
                  <ul className="space-y-1">
                    {segment.seasonalTips.slice(0, 2).map((tip) => (
                      <li key={tip} className="text-xs text-text-secondary flex items-start gap-1">
                        <Sparkles className="w-3 h-3 text-accent shrink-0 mt-0.5" />
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
