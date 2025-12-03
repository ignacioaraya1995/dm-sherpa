'use client';

import { useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Award,
  BarChart3,
  BookOpen,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  Copy,
  Eye,
  FileText,
  Filter,
  Flame,
  FolderOpen,
  Grid3X3,
  Heart,
  Image,
  Layers,
  Layout,
  LayoutGrid,
  Lightbulb,
  List,
  Mail,
  MoreHorizontal,
  Palette,
  Percent,
  Plus,
  RefreshCw,
  Search,
  Snowflake,
  Sparkles,
  Star,
  Sun,
  Tag,
  Target,
  TrendingUp,
  Users,
  Wand2,
  Zap,
} from 'lucide-react';
import { StatCard } from '@/components/StatCard';
import { Badge } from '@/components/Badge';
import clsx from 'clsx';

// Types
type TemplateFormat = 'check-letter' | 'snap-pack' | 'postcard' | 'handwritten' | 'branded-letter' | 'yellow-letter' | 'sorry-missed';
type TemplateStage = 'intro' | 'reminder' | 'nurture' | 'final';
type TemplateObjective = 'curiosity' | 'authority' | 'credibility' | 'urgency' | 'value';
type TemplateSegment = 'absentee' | 'owner-occupant' | 'probate' | 'pre-foreclosure' | 'tax-lien' | 'high-equity' | 'all';
type TemplateSeason = 'q1-tax' | 'q4-holiday' | 'summer' | 'general';
type FatigueRisk = 'low' | 'medium' | 'high' | 'critical';

interface Template {
  id: string;
  name: string;
  format: TemplateFormat;
  thumbnail: string;
  stage: TemplateStage;
  objective: TemplateObjective;
  segments: TemplateSegment[];
  season: TemplateSeason;
  performance: {
    avgResponseRate: number;
    testsRun: number;
    winRate: number;
  };
  fatigueRisk: FatigueRisk;
  dropsUsed: number;
  isNew?: boolean;
  isTrending?: boolean;
  tags: string[];
}

interface FatigueWarning {
  templateId: string;
  templateName: string;
  market: string;
  dropsToSameList: number;
  lastUsed: string;
  recommendation: string;
  severity: 'warning' | 'critical';
}

// Mock Data
const templates: Template[] = [
  {
    id: '1',
    name: 'Classic Check Letter',
    format: 'check-letter',
    thumbnail: '/templates/check-letter.png',
    stage: 'final',
    objective: 'urgency',
    segments: ['absentee', 'tax-lien'],
    season: 'q1-tax',
    performance: { avgResponseRate: 2.8, testsRun: 145, winRate: 68 },
    fatigueRisk: 'high',
    dropsUsed: 12450,
    tags: ['high-performer', 'offer-display'],
  },
  {
    id: '2',
    name: 'Sorry We Missed You',
    format: 'sorry-missed',
    thumbnail: '/templates/sorry-missed.png',
    stage: 'intro',
    objective: 'curiosity',
    segments: ['owner-occupant'],
    season: 'q4-holiday',
    performance: { avgResponseRate: 3.2, testsRun: 89, winRate: 72 },
    fatigueRisk: 'low',
    dropsUsed: 3200,
    isNew: true,
    isTrending: true,
    tags: ['package-season', 'non-threatening'],
  },
  {
    id: '3',
    name: 'Landlord-to-Landlord',
    format: 'branded-letter',
    thumbnail: '/templates/landlord.png',
    stage: 'nurture',
    objective: 'credibility',
    segments: ['absentee'],
    season: 'general',
    performance: { avgResponseRate: 2.4, testsRun: 67, winRate: 61 },
    fatigueRisk: 'low',
    dropsUsed: 5600,
    tags: ['peer-style', 'professional'],
  },
  {
    id: '4',
    name: 'Handwritten Style',
    format: 'handwritten',
    thumbnail: '/templates/handwritten.png',
    stage: 'intro',
    objective: 'curiosity',
    segments: ['owner-occupant', 'probate'],
    season: 'general',
    performance: { avgResponseRate: 2.9, testsRun: 112, winRate: 65 },
    fatigueRisk: 'medium',
    dropsUsed: 8900,
    tags: ['personal', 'high-open-rate'],
  },
  {
    id: '5',
    name: 'Tax Season Check',
    format: 'check-letter',
    thumbnail: '/templates/tax-check.png',
    stage: 'final',
    objective: 'urgency',
    segments: ['owner-occupant', 'tax-lien'],
    season: 'q1-tax',
    performance: { avgResponseRate: 3.5, testsRun: 78, winRate: 74 },
    fatigueRisk: 'medium',
    dropsUsed: 4100,
    isTrending: true,
    tags: ['seasonal', 'tax-themed', 'offer-display'],
  },
  {
    id: '6',
    name: 'Simple Postcard',
    format: 'postcard',
    thumbnail: '/templates/postcard.png',
    stage: 'reminder',
    objective: 'value',
    segments: ['all'],
    season: 'general',
    performance: { avgResponseRate: 1.8, testsRun: 203, winRate: 45 },
    fatigueRisk: 'low',
    dropsUsed: 15600,
    tags: ['budget-friendly', 'high-volume'],
  },
  {
    id: '7',
    name: 'Snap Pack Offer',
    format: 'snap-pack',
    thumbnail: '/templates/snap-pack.png',
    stage: 'final',
    objective: 'urgency',
    segments: ['absentee', 'pre-foreclosure'],
    season: 'general',
    performance: { avgResponseRate: 2.6, testsRun: 94, winRate: 58 },
    fatigueRisk: 'high',
    dropsUsed: 7800,
    tags: ['official-looking', 'offer-display'],
  },
  {
    id: '8',
    name: 'Authority Letter',
    format: 'branded-letter',
    thumbnail: '/templates/authority.png',
    stage: 'nurture',
    objective: 'authority',
    segments: ['high-equity', 'owner-occupant'],
    season: 'general',
    performance: { avgResponseRate: 2.1, testsRun: 56, winRate: 52 },
    fatigueRisk: 'low',
    dropsUsed: 2400,
    isNew: true,
    tags: ['premium', 'professional'],
  },
];

const fatigueWarnings: FatigueWarning[] = [
  {
    templateId: '1',
    templateName: 'Classic Check Letter',
    market: 'Baltimore Metro',
    dropsToSameList: 8,
    lastUsed: '2 weeks ago',
    recommendation: 'Switch to "Sorry We Missed You" or Handwritten style for next 2-3 drops',
    severity: 'critical',
  },
  {
    templateId: '7',
    templateName: 'Snap Pack Offer',
    market: 'Phoenix Metro',
    dropsToSameList: 5,
    lastUsed: '3 weeks ago',
    recommendation: 'Consider rotating to Authority Letter to maintain response rates',
    severity: 'warning',
  },
];

const seasonalSuggestions = [
  {
    season: 'Q1 Tax Season',
    icon: FileText,
    active: true,
    suggestions: [
      'Tax Season Check performing +42% above baseline for owner-occupants',
      'Income-tax-style checks resonate with W-2 earners',
      'Pair with tax deadline urgency messaging',
    ],
  },
  {
    season: 'Q4 Holidays',
    icon: Snowflake,
    active: false,
    suggestions: [
      '"Sorry We Missed You" performs well during package season',
      'Avoid overly salesy messaging during holidays',
      'Warm, personal tone outperforms aggressive offers',
    ],
  },
];

const formatLabels: Record<TemplateFormat, string> = {
  'check-letter': 'Check Letter',
  'snap-pack': 'Snap Pack',
  'postcard': 'Postcard',
  'handwritten': 'Handwritten',
  'branded-letter': 'Branded Letter',
  'yellow-letter': 'Yellow Letter',
  'sorry-missed': 'Sorry We Missed You',
};

const stageLabels: Record<TemplateStage, string> = {
  intro: 'Intro',
  reminder: 'Reminder',
  nurture: 'Nurture',
  final: 'Final Offer',
};

const objectiveLabels: Record<TemplateObjective, string> = {
  curiosity: 'Curiosity',
  authority: 'Authority',
  credibility: 'Credibility',
  urgency: 'Urgency',
  value: 'Value',
};

const segmentLabels: Record<TemplateSegment, string> = {
  absentee: 'Absentee',
  'owner-occupant': 'Owner-Occupant',
  probate: 'Probate',
  'pre-foreclosure': 'Pre-Foreclosure',
  'tax-lien': 'Tax Lien',
  'high-equity': 'High Equity',
  all: 'All Segments',
};

const seasonLabels: Record<TemplateSeason, string> = {
  'q1-tax': 'Q1 Tax Season',
  'q4-holiday': 'Q4 Holidays',
  summer: 'Summer',
  general: 'Year-Round',
};

export default function CreativeLibraryPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFormat, setSelectedFormat] = useState<TemplateFormat | 'all'>('all');
  const [selectedSegment, setSelectedSegment] = useState<TemplateSegment | 'all'>('all');
  const [selectedSeason, setSelectedSeason] = useState<TemplateSeason | 'all'>('all');
  const [selectedStage, setSelectedStage] = useState<TemplateStage | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);

  // Filter templates
  const filteredTemplates = templates.filter((template) => {
    if (searchQuery && !template.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (selectedFormat !== 'all' && template.format !== selectedFormat) {
      return false;
    }
    if (selectedSegment !== 'all' && !template.segments.includes(selectedSegment)) {
      return false;
    }
    if (selectedSeason !== 'all' && template.season !== selectedSeason) {
      return false;
    }
    if (selectedStage !== 'all' && template.stage !== selectedStage) {
      return false;
    }
    return true;
  });

  const getFatigueColor = (risk: FatigueRisk) => {
    switch (risk) {
      case 'low': return 'success';
      case 'medium': return 'warning';
      case 'high': return 'danger';
      case 'critical': return 'danger';
    }
  };

  const getObjectiveIcon = (objective: TemplateObjective) => {
    switch (objective) {
      case 'curiosity': return Lightbulb;
      case 'authority': return Award;
      case 'credibility': return CheckCircle2;
      case 'urgency': return Zap;
      case 'value': return Heart;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Creative Library</h1>
          <p className="text-text-secondary mt-1">
            Browse, test, and sequence proven mail templates
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn-secondary flex items-center gap-2">
            <Wand2 className="w-4 h-4" />
            AI Suggest
          </button>
          <button className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Upload Template
          </button>
        </div>
      </div>

      {/* Fatigue Warnings Banner */}
      {fatigueWarnings.length > 0 && (
        <div className="glass-card border-warning/30 bg-warning-muted/30 p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-warning/20">
              <AlertTriangle className="w-5 h-5 text-warning" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-warning mb-2">Creative Fatigue Detected</h3>
              <div className="space-y-2">
                {fatigueWarnings.map((warning) => (
                  <div key={warning.templateId} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={clsx(
                        'w-2 h-2 rounded-full',
                        warning.severity === 'critical' ? 'bg-danger animate-pulse' : 'bg-warning'
                      )} />
                      <span className="text-sm text-text-primary">
                        <strong>{warning.templateName}</strong> in {warning.market} — {warning.dropsToSameList} drops to same list
                      </span>
                    </div>
                    <span className="text-xs text-text-muted">{warning.recommendation}</span>
                  </div>
                ))}
              </div>
            </div>
            <button className="btn-ghost text-sm">View All</button>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4">
        <StatCard
          title="Total Templates"
          value={templates.length}
          subtitle="In library"
          icon={Layout}
          color="accent"
        />
        <StatCard
          title="A/B Tests Run"
          value="847"
          trend={12}
          trendLabel="this month"
          icon={BarChart3}
          color="cyan"
        />
        <StatCard
          title="Avg Win Rate"
          value="62%"
          subtitle="Across all tests"
          icon={TrendingUp}
          color="success"
        />
        <StatCard
          title="Active Campaigns"
          value="24"
          subtitle="Using sequences"
          icon={Layers}
          color="violet"
        />
        <StatCard
          title="Fatigue Alerts"
          value={fatigueWarnings.length}
          subtitle="Need rotation"
          icon={RefreshCw}
          color={fatigueWarnings.length > 0 ? 'warning' : 'success'}
        />
      </div>

      {/* Seasonal Intelligence */}
      <div className="grid grid-cols-2 gap-4">
        {seasonalSuggestions.map((season) => (
          <div
            key={season.season}
            className={clsx(
              'glass-card p-5',
              season.active && 'border-accent/30 bg-accent-muted/20'
            )}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className={clsx(
                'p-2 rounded-lg',
                season.active ? 'bg-accent-muted' : 'bg-glass-surface'
              )}>
                <season.icon className={clsx(
                  'w-5 h-5',
                  season.active ? 'text-accent' : 'text-text-muted'
                )} />
              </div>
              <div>
                <h3 className="font-semibold text-text-primary">{season.season}</h3>
                {season.active && (
                  <Badge variant="accent" size="sm">Active Now</Badge>
                )}
              </div>
            </div>
            <ul className="space-y-2">
              {season.suggestions.map((suggestion, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-text-secondary">
                  <Sparkles className="w-4 h-4 text-accent mt-0.5 shrink-0" />
                  {suggestion}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Search and Filters */}
      <div className="glass-card p-4">
        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field pl-10 w-full"
            />
          </div>

          {/* Quick Filters */}
          <div className="flex items-center gap-2">
            <select
              value={selectedFormat}
              onChange={(e) => setSelectedFormat(e.target.value as TemplateFormat | 'all')}
              className="input-field"
            >
              <option value="all">All Formats</option>
              {Object.entries(formatLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>

            <select
              value={selectedSegment}
              onChange={(e) => setSelectedSegment(e.target.value as TemplateSegment | 'all')}
              className="input-field"
            >
              <option value="all">All Segments</option>
              {Object.entries(segmentLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>

            <select
              value={selectedSeason}
              onChange={(e) => setSelectedSeason(e.target.value as TemplateSeason | 'all')}
              className="input-field"
            >
              <option value="all">All Seasons</option>
              {Object.entries(seasonLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>

            <select
              value={selectedStage}
              onChange={(e) => setSelectedStage(e.target.value as TemplateStage | 'all')}
              className="input-field"
            >
              <option value="all">All Stages</option>
              {Object.entries(stageLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          {/* View Toggle */}
          <div className="flex items-center gap-1 p-1 rounded-lg bg-glass-surface">
            <button
              onClick={() => setViewMode('grid')}
              className={clsx(
                'p-2 rounded transition-colors',
                viewMode === 'grid' ? 'bg-accent text-white' : 'text-text-muted hover:text-text-primary'
              )}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={clsx(
                'p-2 rounded transition-colors',
                viewMode === 'list' ? 'bg-accent text-white' : 'text-text-muted hover:text-text-primary'
              )}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Active Filters */}
        {(selectedFormat !== 'all' || selectedSegment !== 'all' || selectedSeason !== 'all' || selectedStage !== 'all') && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-glass-border">
            <span className="text-xs text-text-muted">Active filters:</span>
            {selectedFormat !== 'all' && (
              <Badge variant="accent" size="sm">
                {formatLabels[selectedFormat]}
                <button onClick={() => setSelectedFormat('all')} className="ml-1 hover:text-white">×</button>
              </Badge>
            )}
            {selectedSegment !== 'all' && (
              <Badge variant="cyan" size="sm">
                {segmentLabels[selectedSegment]}
                <button onClick={() => setSelectedSegment('all')} className="ml-1 hover:text-white">×</button>
              </Badge>
            )}
            {selectedSeason !== 'all' && (
              <Badge variant="violet" size="sm">
                {seasonLabels[selectedSeason]}
                <button onClick={() => setSelectedSeason('all')} className="ml-1 hover:text-white">×</button>
              </Badge>
            )}
            {selectedStage !== 'all' && (
              <Badge variant="neutral" size="sm">
                {stageLabels[selectedStage]}
                <button onClick={() => setSelectedStage('all')} className="ml-1 hover:text-white">×</button>
              </Badge>
            )}
            <button
              onClick={() => {
                setSelectedFormat('all');
                setSelectedSegment('all');
                setSelectedSeason('all');
                setSelectedStage('all');
              }}
              className="text-xs text-text-muted hover:text-text-primary ml-2"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Template Grid */}
      <div className="grid grid-cols-4 gap-4">
        {filteredTemplates.map((template) => {
          const ObjectiveIcon = getObjectiveIcon(template.objective);
          const fatigueWarning = fatigueWarnings.find(w => w.templateId === template.id);

          return (
            <div
              key={template.id}
              onClick={() => setSelectedTemplate(template)}
              className={clsx(
                'glass-card overflow-hidden cursor-pointer group transition-all hover:scale-[1.02]',
                fatigueWarning && 'border-warning/40'
              )}
            >
              {/* Template Preview */}
              <div className="relative h-40 bg-gradient-to-br from-dark-700 to-dark-800 flex items-center justify-center">
                <Mail className="w-16 h-16 text-text-muted/30" />

                {/* Badges */}
                <div className="absolute top-2 left-2 flex items-center gap-1">
                  {template.isNew && (
                    <Badge variant="accent" size="sm" glow>New</Badge>
                  )}
                  {template.isTrending && (
                    <Badge variant="success" size="sm">
                      <Flame className="w-3 h-3 mr-1" />
                      Trending
                    </Badge>
                  )}
                </div>

                {/* Fatigue Indicator */}
                {fatigueWarning && (
                  <div className="absolute top-2 right-2">
                    <div className="p-1.5 rounded-full bg-warning/20 animate-pulse">
                      <AlertTriangle className="w-4 h-4 text-warning" />
                    </div>
                  </div>
                )}

                {/* Quick Actions */}
                <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                  <button className="p-2 rounded-lg bg-dark-900/80 hover:bg-dark-800 transition-colors">
                    <Eye className="w-4 h-4 text-text-secondary" />
                  </button>
                  <button className="p-2 rounded-lg bg-dark-900/80 hover:bg-dark-800 transition-colors">
                    <Copy className="w-4 h-4 text-text-secondary" />
                  </button>
                </div>
              </div>

              {/* Template Info */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-text-primary truncate">{template.name}</h4>
                  <Badge variant={getFatigueColor(template.fatigueRisk)} size="sm">
                    {template.fatigueRisk}
                  </Badge>
                </div>

                {/* Tags Row */}
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <Badge variant="neutral" size="sm">{formatLabels[template.format]}</Badge>
                  <Badge variant="neutral" size="sm">{stageLabels[template.stage]}</Badge>
                </div>

                {/* Segments */}
                <div className="flex items-center gap-1 mb-3 flex-wrap">
                  {template.segments.slice(0, 2).map((segment) => (
                    <span
                      key={segment}
                      className="text-xs px-2 py-0.5 rounded-full bg-glass-surface text-text-muted"
                    >
                      {segmentLabels[segment]}
                    </span>
                  ))}
                  {template.segments.length > 2 && (
                    <span className="text-xs text-text-muted">+{template.segments.length - 2}</span>
                  )}
                </div>

                {/* Performance */}
                <div className="grid grid-cols-3 gap-2 pt-3 border-t border-glass-border">
                  <div className="text-center">
                    <p className="text-lg font-semibold text-text-primary">{template.performance.avgResponseRate}%</p>
                    <p className="text-xs text-text-muted">Avg Response</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-semibold text-text-primary">{template.performance.testsRun}</p>
                    <p className="text-xs text-text-muted">Tests</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-semibold text-success">{template.performance.winRate}%</p>
                    <p className="text-xs text-text-muted">Win Rate</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Template Detail Modal */}
      {selectedTemplate && (
        <div className="fixed inset-0 bg-dark-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="glass-card w-full max-w-4xl max-h-[90vh] overflow-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between p-6 border-b border-glass-border">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-xl font-bold text-text-primary">{selectedTemplate.name}</h2>
                  {selectedTemplate.isNew && <Badge variant="accent" glow>New</Badge>}
                  {selectedTemplate.isTrending && <Badge variant="success"><Flame className="w-3 h-3 mr-1" />Trending</Badge>}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="neutral">{formatLabels[selectedTemplate.format]}</Badge>
                  <Badge variant="neutral">{stageLabels[selectedTemplate.stage]}</Badge>
                  <Badge variant="neutral">{objectiveLabels[selectedTemplate.objective]}</Badge>
                  <Badge variant="neutral">{seasonLabels[selectedTemplate.season]}</Badge>
                </div>
              </div>
              <button
                onClick={() => setSelectedTemplate(null)}
                className="btn-ghost p-2"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-2 gap-6 p-6">
              {/* Left: Preview */}
              <div>
                <div className="aspect-[8.5/11] bg-gradient-to-br from-dark-700 to-dark-800 rounded-xl flex items-center justify-center mb-4">
                  <Mail className="w-24 h-24 text-text-muted/30" />
                </div>
                <div className="flex items-center gap-2">
                  <button className="btn-secondary flex-1 flex items-center justify-center gap-2">
                    <Eye className="w-4 h-4" />
                    Preview
                  </button>
                  <button className="btn-secondary flex-1 flex items-center justify-center gap-2">
                    <Copy className="w-4 h-4" />
                    Duplicate
                  </button>
                </div>
              </div>

              {/* Right: Details */}
              <div className="space-y-6">
                {/* Performance Stats */}
                <div>
                  <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3">Performance</h3>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-4 rounded-xl bg-glass-surface text-center">
                      <p className="text-2xl font-bold text-text-primary">{selectedTemplate.performance.avgResponseRate}%</p>
                      <p className="text-xs text-text-muted">Avg Response Rate</p>
                    </div>
                    <div className="p-4 rounded-xl bg-glass-surface text-center">
                      <p className="text-2xl font-bold text-text-primary">{selectedTemplate.performance.testsRun}</p>
                      <p className="text-xs text-text-muted">Tests Run</p>
                    </div>
                    <div className="p-4 rounded-xl bg-glass-surface text-center">
                      <p className="text-2xl font-bold text-success">{selectedTemplate.performance.winRate}%</p>
                      <p className="text-xs text-text-muted">Win Rate</p>
                    </div>
                  </div>
                </div>

                {/* Segments */}
                <div>
                  <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3">Best For</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedTemplate.segments.map((segment) => (
                      <Badge key={segment} variant="cyan" size="lg">
                        <Users className="w-3 h-3 mr-1" />
                        {segmentLabels[segment]}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Fatigue Status */}
                <div>
                  <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3">Fatigue Risk</h3>
                  <div className={clsx(
                    'p-4 rounded-xl',
                    selectedTemplate.fatigueRisk === 'low' && 'bg-success-muted border border-success/30',
                    selectedTemplate.fatigueRisk === 'medium' && 'bg-warning-muted border border-warning/30',
                    (selectedTemplate.fatigueRisk === 'high' || selectedTemplate.fatigueRisk === 'critical') && 'bg-danger-muted border border-danger/30'
                  )}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <RefreshCw className={clsx(
                          'w-5 h-5',
                          selectedTemplate.fatigueRisk === 'low' && 'text-success',
                          selectedTemplate.fatigueRisk === 'medium' && 'text-warning',
                          (selectedTemplate.fatigueRisk === 'high' || selectedTemplate.fatigueRisk === 'critical') && 'text-danger'
                        )} />
                        <span className="font-medium text-text-primary capitalize">{selectedTemplate.fatigueRisk} Risk</span>
                      </div>
                      <span className="text-sm text-text-muted">{selectedTemplate.dropsUsed.toLocaleString()} total drops</span>
                    </div>
                    {selectedTemplate.fatigueRisk !== 'low' && (
                      <p className="text-sm text-text-secondary mt-2">
                        Consider rotating this template in high-saturation markets
                      </p>
                    )}
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedTemplate.tags.map((tag) => (
                      <span key={tag} className="px-3 py-1 rounded-full bg-glass-surface text-sm text-text-secondary">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 pt-4 border-t border-glass-border">
                  <button className="btn-primary flex-1 flex items-center justify-center gap-2">
                    <Target className="w-4 h-4" />
                    Start A/B Test
                  </button>
                  <button className="btn-secondary flex-1 flex items-center justify-center gap-2">
                    <Layers className="w-4 h-4" />
                    Add to Sequence
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredTemplates.length === 0 && (
        <div className="glass-card p-12 text-center">
          <FolderOpen className="w-16 h-16 text-text-muted mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-text-primary mb-2">No templates found</h3>
          <p className="text-text-secondary mb-4">Try adjusting your filters or search query</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedFormat('all');
              setSelectedSegment('all');
              setSelectedSeason('all');
              setSelectedStage('all');
            }}
            className="btn-secondary"
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
}
