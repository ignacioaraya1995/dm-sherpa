'use client';

import { useState } from 'react';
import {
  AlertCircle,
  ArrowDown,
  ArrowRight,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Copy,
  Edit3,
  GripVertical,
  Layers,
  Mail,
  MoreHorizontal,
  Pause,
  Play,
  Plus,
  RefreshCw,
  Save,
  Settings,
  Sparkles,
  Target,
  Trash2,
  TrendingUp,
  Users,
  Wand2,
  Zap,
} from 'lucide-react';
import { StatCard } from '@/components/StatCard';
import { Badge } from '@/components/Badge';
import clsx from 'clsx';

// Types
interface SequenceDrop {
  id: string;
  position: number;
  templateId: string;
  templateName: string;
  format: string;
  objective: string;
  delayDays: number;
  segment?: string;
  offerStrategy?: 'fixed' | 'dynamic';
  offerPercent?: number;
}

interface CampaignSequence {
  id: string;
  name: string;
  status: 'draft' | 'active' | 'paused' | 'completed';
  targetSegment: string;
  market: string;
  drops: SequenceDrop[];
  totalMailed: number;
  avgResponseRate: number;
  startDate?: string;
  brandId?: string;
}

// Mock Data
const activeSequences: CampaignSequence[] = [
  {
    id: '1',
    name: 'Austin Absentee Q4 Nurture',
    status: 'active',
    targetSegment: 'Absentee Owners',
    market: 'Austin Metro',
    totalMailed: 12500,
    avgResponseRate: 2.8,
    startDate: '2024-11-01',
    drops: [
      { id: 'd1', position: 1, templateId: '4', templateName: 'Handwritten Style', format: 'handwritten', objective: 'curiosity', delayDays: 0 },
      { id: 'd2', position: 2, templateId: '3', templateName: 'Landlord-to-Landlord', format: 'branded-letter', objective: 'credibility', delayDays: 14 },
      { id: 'd3', position: 3, templateId: '8', templateName: 'Authority Letter', format: 'branded-letter', objective: 'authority', delayDays: 28 },
      { id: 'd4', position: 4, templateId: '1', templateName: 'Classic Check Letter', format: 'check-letter', objective: 'urgency', delayDays: 42, offerStrategy: 'dynamic', offerPercent: 80 },
    ],
  },
  {
    id: '2',
    name: 'Houston Pre-Foreclosure Sprint',
    status: 'active',
    targetSegment: 'Pre-Foreclosure',
    market: 'Houston Metro',
    totalMailed: 8200,
    avgResponseRate: 3.4,
    startDate: '2024-11-15',
    drops: [
      { id: 'd1', position: 1, templateId: '2', templateName: 'Sorry We Missed You', format: 'sorry-missed', objective: 'curiosity', delayDays: 0 },
      { id: 'd2', position: 2, templateId: '7', templateName: 'Snap Pack Offer', format: 'snap-pack', objective: 'urgency', delayDays: 7, offerStrategy: 'fixed', offerPercent: 75 },
    ],
  },
  {
    id: '3',
    name: 'Dallas Tax Lien Sequence',
    status: 'paused',
    targetSegment: 'Tax Lien',
    market: 'Dallas Metro',
    totalMailed: 5400,
    avgResponseRate: 2.1,
    startDate: '2024-10-01',
    drops: [
      { id: 'd1', position: 1, templateId: '6', templateName: 'Simple Postcard', format: 'postcard', objective: 'value', delayDays: 0 },
      { id: 'd2', position: 2, templateId: '5', templateName: 'Tax Season Check', format: 'check-letter', objective: 'urgency', delayDays: 21, offerStrategy: 'dynamic', offerPercent: 78 },
    ],
  },
];

const sequenceTemplates = [
  {
    id: 'tmpl1',
    name: '4-Touch Nurture Flow',
    description: 'Gradual warmup from curiosity to offer',
    drops: 4,
    avgDuration: '6 weeks',
    bestFor: ['Absentee', 'High Equity'],
    performance: 2.9,
  },
  {
    id: 'tmpl2',
    name: 'Urgency Sprint',
    description: 'Fast 2-touch sequence for motivated sellers',
    drops: 2,
    avgDuration: '1 week',
    bestFor: ['Pre-Foreclosure', 'Tax Lien'],
    performance: 3.2,
  },
  {
    id: 'tmpl3',
    name: 'Owner-Occupant Welcome',
    description: 'Non-threatening intro sequence',
    drops: 3,
    avgDuration: '4 weeks',
    bestFor: ['Owner-Occupant'],
    performance: 2.4,
  },
];

const objectiveColors: Record<string, string> = {
  curiosity: 'violet',
  credibility: 'cyan',
  authority: 'accent',
  urgency: 'warning',
  value: 'success',
};

export default function CampaignBuilderPage() {
  const [selectedSequence, setSelectedSequence] = useState<CampaignSequence | null>(null);
  const [isBuilding, setIsBuilding] = useState(false);
  const [newSequence, setNewSequence] = useState<Partial<CampaignSequence>>({
    name: '',
    targetSegment: '',
    market: '',
    drops: [],
  });

  const activeCount = activeSequences.filter(s => s.status === 'active').length;
  const totalMailed = activeSequences.reduce((sum, s) => sum + s.totalMailed, 0);
  const avgResponse = (activeSequences.reduce((sum, s) => sum + s.avgResponseRate, 0) / activeSequences.length).toFixed(1);

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'paused': return 'warning';
      case 'draft': return 'neutral';
      case 'completed': return 'accent';
      default: return 'neutral';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Campaign Sequences</h1>
          <p className="text-text-secondary mt-1">
            Build multi-touch mail sequences with strategic creative rotation
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn-secondary flex items-center gap-2">
            <Wand2 className="w-4 h-4" />
            AI Build
          </button>
          <button
            onClick={() => setIsBuilding(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Sequence
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          title="Active Sequences"
          value={activeCount}
          subtitle="Currently running"
          icon={Layers}
          color="accent"
        />
        <StatCard
          title="Total Mailed"
          value={totalMailed.toLocaleString()}
          trend={18}
          trendLabel="this month"
          icon={Mail}
          color="cyan"
        />
        <StatCard
          title="Avg Response Rate"
          value={`${avgResponse}%`}
          subtitle="Across sequences"
          icon={TrendingUp}
          color="success"
        />
        <StatCard
          title="Avg Drops per Sequence"
          value="3.2"
          subtitle="Multi-touch average"
          icon={Target}
          color="violet"
        />
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Active Sequences */}
        <div className="col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-text-primary">Your Sequences</h3>
            <div className="flex items-center gap-2">
              <button className="btn-ghost text-sm">All</button>
              <button className="btn-ghost text-sm">Active</button>
              <button className="btn-ghost text-sm">Paused</button>
              <button className="btn-ghost text-sm">Draft</button>
            </div>
          </div>

          {activeSequences.map((sequence) => (
            <div key={sequence.id} className="glass-card overflow-hidden">
              {/* Sequence Header */}
              <div className="p-4 border-b border-glass-border">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h4 className="font-semibold text-text-primary">{sequence.name}</h4>
                      <Badge variant={getStatusVariant(sequence.status)}>{sequence.status}</Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-text-muted">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {sequence.targetSegment}
                      </span>
                      <span className="flex items-center gap-1">
                        <Target className="w-3 h-3" />
                        {sequence.market}
                      </span>
                      {sequence.startDate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Started {sequence.startDate}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {sequence.status === 'active' ? (
                      <button className="btn-ghost p-2">
                        <Pause className="w-4 h-4" />
                      </button>
                    ) : sequence.status === 'paused' ? (
                      <button className="btn-ghost p-2">
                        <Play className="w-4 h-4" />
                      </button>
                    ) : null}
                    <button className="btn-ghost p-2">
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button className="btn-ghost p-2">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Sequence Timeline */}
              <div className="p-4">
                <div className="flex items-start gap-4 overflow-x-auto pb-2">
                  {sequence.drops.map((drop, index) => (
                    <div key={drop.id} className="flex items-center">
                      {/* Drop Card */}
                      <div className="w-48 shrink-0">
                        <div className={clsx(
                          'p-4 rounded-xl border transition-colors',
                          'bg-glass-surface border-glass-border hover:border-accent/30'
                        )}>
                          {/* Drop Number */}
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                              Drop {drop.position}
                            </span>
                            <Badge variant={objectiveColors[drop.objective] as any} size="sm">
                              {drop.objective}
                            </Badge>
                          </div>

                          {/* Template Info */}
                          <div className="mb-3">
                            <p className="font-medium text-text-primary text-sm truncate">{drop.templateName}</p>
                            <p className="text-xs text-text-muted">{drop.format}</p>
                          </div>

                          {/* Timing */}
                          <div className="flex items-center gap-2 text-xs text-text-muted">
                            <Clock className="w-3 h-3" />
                            {drop.delayDays === 0 ? 'Day 1' : `+${drop.delayDays} days`}
                          </div>

                          {/* Offer Info */}
                          {drop.offerStrategy && (
                            <div className="mt-2 pt-2 border-t border-glass-border">
                              <div className="flex items-center gap-2 text-xs">
                                <span className="text-text-muted">Offer:</span>
                                <Badge variant="warning" size="sm">
                                  {drop.offerPercent}% {drop.offerStrategy === 'dynamic' ? 'Dynamic' : 'Fixed'}
                                </Badge>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Connector Arrow */}
                      {index < sequence.drops.length - 1 && (
                        <div className="flex flex-col items-center mx-2 shrink-0">
                          <ArrowRight className="w-5 h-5 text-text-muted" />
                          <span className="text-xs text-text-muted mt-1">
                            {sequence.drops[index + 1].delayDays - drop.delayDays}d
                          </span>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Add Drop Button */}
                  <div className="w-32 shrink-0 flex items-center justify-center">
                    <button className="p-4 rounded-xl border border-dashed border-glass-border hover:border-accent/30 transition-colors group">
                      <Plus className="w-6 h-6 text-text-muted group-hover:text-accent transition-colors" />
                    </button>
                  </div>
                </div>

                {/* Sequence Stats */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-glass-border">
                  <div className="flex items-center gap-6">
                    <div>
                      <p className="text-sm text-text-muted">Total Mailed</p>
                      <p className="text-lg font-semibold text-text-primary">{sequence.totalMailed.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-text-muted">Avg Response</p>
                      <p className="text-lg font-semibold text-success">{sequence.avgResponseRate}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-text-muted">Sequence Duration</p>
                      <p className="text-lg font-semibold text-text-primary">
                        {sequence.drops[sequence.drops.length - 1]?.delayDays || 0} days
                      </p>
                    </div>
                  </div>
                  <button className="btn-secondary flex items-center gap-2">
                    <Copy className="w-4 h-4" />
                    Duplicate
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Sidebar */}
        <div className="col-span-4 space-y-6">
          {/* Quick Start Templates */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-text-primary">Quick Start Templates</h3>
              <Sparkles className="w-4 h-4 text-accent" />
            </div>
            <div className="space-y-3">
              {sequenceTemplates.map((template) => (
                <div
                  key={template.id}
                  className="p-4 rounded-xl bg-glass-surface hover:bg-glass-surface-hover transition-colors cursor-pointer group"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-medium text-text-primary">{template.name}</h4>
                      <p className="text-xs text-text-muted">{template.description}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="flex items-center gap-3 mt-3">
                    <Badge variant="neutral" size="sm">{template.drops} drops</Badge>
                    <Badge variant="neutral" size="sm">{template.avgDuration}</Badge>
                    <Badge variant="success" size="sm">{template.performance}% avg</Badge>
                  </div>
                  <div className="flex items-center gap-1 mt-2 flex-wrap">
                    {template.bestFor.map((segment) => (
                      <span key={segment} className="text-xs text-text-muted">{segment}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sequencing Best Practices */}
          <div className="glass-card p-6">
            <h3 className="font-semibold text-text-primary mb-4">Sequencing Best Practices</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-1.5 rounded bg-violet-500/20">
                  <Sparkles className="w-3 h-3 text-data-violet" />
                </div>
                <div>
                  <p className="text-sm text-text-primary">Start with curiosity</p>
                  <p className="text-xs text-text-muted">First drop should intrigue, not sell</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-1.5 rounded bg-cyan-500/20">
                  <Layers className="w-3 h-3 text-data-cyan" />
                </div>
                <div>
                  <p className="text-sm text-text-primary">Build credibility mid-sequence</p>
                  <p className="text-xs text-text-muted">Professional pieces before hard offers</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-1.5 rounded bg-warning/20">
                  <Zap className="w-3 h-3 text-warning" />
                </div>
                <div>
                  <p className="text-sm text-text-primary">End with urgency</p>
                  <p className="text-xs text-text-muted">Check/offer pieces work best as final touch</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-1.5 rounded bg-success/20">
                  <RefreshCw className="w-3 h-3 text-success" />
                </div>
                <div>
                  <p className="text-sm text-text-primary">Vary format, keep brand</p>
                  <p className="text-xs text-text-muted">Same branding, different creative formats</p>
                </div>
              </div>
            </div>
          </div>

          {/* AI Recommendations */}
          <div className="glass-card p-6 border-accent/30 bg-accent-muted/20">
            <div className="flex items-center gap-2 mb-4">
              <Wand2 className="w-5 h-5 text-accent" />
              <h3 className="font-semibold text-text-primary">AI Suggestions</h3>
            </div>
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-glass-surface">
                <p className="text-sm text-text-secondary">
                  <strong className="text-text-primary">Austin Absentee:</strong> Based on market data,
                  consider adding a 5th touch with "Sorry We Missed You" format — response rates
                  historically spike 23% after 4+ touches in this segment.
                </p>
              </div>
              <div className="p-3 rounded-lg bg-glass-surface">
                <p className="text-sm text-text-secondary">
                  <strong className="text-text-primary">Houston Pre-Foreclosure:</strong> Current 7-day
                  gap between drops is optimal for this segment. Extending to 14 days typically
                  reduces response by 18%.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* New Sequence Builder Modal */}
      {isBuilding && (
        <div className="fixed inset-0 bg-dark-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="glass-card w-full max-w-5xl max-h-[90vh] overflow-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-glass-border">
              <div>
                <h2 className="text-xl font-bold text-text-primary">Build New Sequence</h2>
                <p className="text-text-secondary text-sm mt-1">
                  Design a multi-touch campaign with strategic creative rotation
                </p>
              </div>
              <button onClick={() => setIsBuilding(false)} className="btn-ghost p-2">×</button>
            </div>

            {/* Builder Content */}
            <div className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-text-secondary mb-2 block">Sequence Name</label>
                  <input
                    type="text"
                    placeholder="e.g., Austin Absentee Q4 Nurture"
                    className="input-field w-full"
                    value={newSequence.name}
                    onChange={(e) => setNewSequence({ ...newSequence, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-text-secondary mb-2 block">Target Segment</label>
                  <select className="input-field w-full">
                    <option>Absentee Owners</option>
                    <option>Owner-Occupants</option>
                    <option>Pre-Foreclosure</option>
                    <option>Tax Lien</option>
                    <option>Probate</option>
                    <option>High Equity</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-text-secondary mb-2 block">Market</label>
                  <select className="input-field w-full">
                    <option>Austin Metro</option>
                    <option>Houston Metro</option>
                    <option>Dallas Metro</option>
                    <option>San Antonio</option>
                    <option>Phoenix Metro</option>
                  </select>
                </div>
              </div>

              {/* Sequence Builder */}
              <div>
                <label className="text-sm font-medium text-text-secondary mb-4 block">Sequence Drops</label>
                <div className="flex items-start gap-4 overflow-x-auto pb-4">
                  {/* Sample Drops */}
                  {[1, 2, 3].map((num) => (
                    <div key={num} className="flex items-center">
                      <div className="w-56 shrink-0 p-4 rounded-xl border border-glass-border bg-glass-surface">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-semibold text-text-muted uppercase">Drop {num}</span>
                          <button className="p-1 rounded hover:bg-glass-surface-hover">
                            <Trash2 className="w-3 h-3 text-text-muted" />
                          </button>
                        </div>

                        <select className="input-field w-full mb-2 text-sm">
                          <option>Select template...</option>
                          <option>Handwritten Style</option>
                          <option>Landlord-to-Landlord</option>
                          <option>Classic Check Letter</option>
                          <option>Sorry We Missed You</option>
                        </select>

                        <div className="flex items-center gap-2">
                          <Clock className="w-3 h-3 text-text-muted" />
                          <input
                            type="number"
                            placeholder="0"
                            className="input-field w-16 text-sm"
                            defaultValue={num === 1 ? 0 : (num - 1) * 14}
                          />
                          <span className="text-xs text-text-muted">days after start</span>
                        </div>
                      </div>

                      {num < 3 && (
                        <ArrowRight className="w-5 h-5 text-text-muted mx-2 shrink-0" />
                      )}
                    </div>
                  ))}

                  {/* Add Drop */}
                  <div className="w-32 shrink-0 flex items-center justify-center h-[140px]">
                    <button className="p-4 rounded-xl border border-dashed border-glass-border hover:border-accent/30 transition-colors group flex flex-col items-center gap-2">
                      <Plus className="w-6 h-6 text-text-muted group-hover:text-accent" />
                      <span className="text-xs text-text-muted">Add Drop</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Brand Selection */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-text-secondary mb-2 block">Apply Brand</label>
                  <select className="input-field w-full">
                    <option>Default Brand</option>
                    <option>Premium Brand</option>
                    <option>Local Investor Brand</option>
                  </select>
                  <p className="text-xs text-text-muted mt-1">
                    Brand elements will be applied consistently across all drops
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-text-secondary mb-2 block">Offer Strategy</label>
                  <select className="input-field w-full">
                    <option>No offer (non-offer pieces only)</option>
                    <option>Fixed % of AVM</option>
                    <option>Dynamic by price band</option>
                    <option>Dynamic by distress level</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between p-6 border-t border-glass-border">
              <button className="btn-ghost flex items-center gap-2">
                <Wand2 className="w-4 h-4" />
                AI Auto-Build
              </button>
              <div className="flex items-center gap-3">
                <button onClick={() => setIsBuilding(false)} className="btn-secondary">Cancel</button>
                <button className="btn-primary flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  Save Sequence
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
