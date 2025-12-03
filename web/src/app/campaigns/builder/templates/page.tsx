'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  MapPin,
  Target,
  DollarSign,
  Palette,
  Calendar,
  Phone,
  Rocket,
  Search,
  Filter,
  Star,
  TrendingUp,
  Users,
  Building,
  Home,
  Zap,
  Clock,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  ChevronRight,
  Sparkles,
  BarChart3,
} from 'lucide-react';

const STEPS = [
  { id: 'playbooks', label: 'Select Playbook', icon: Target },
  { id: 'targeting', label: 'Targeting', icon: MapPin },
  { id: 'creative', label: 'Creatives', icon: Palette },
  { id: 'offers', label: 'Offers', icon: DollarSign },
  { id: 'schedule', label: 'Schedule', icon: Calendar },
  { id: 'telephony', label: 'Telephony', icon: Phone },
  { id: 'summary', label: 'Summary', icon: Rocket },
];

const PLAYBOOKS = [
  {
    id: 'q4-absentee',
    name: 'Q4 Absentee Landlords',
    description: 'Tax-angle messaging for year-end decisions. Optimized for absentee owners seeking to offload before tax season.',
    bestFor: ['Wholesale', 'Flip'],
    season: 'Q4',
    marketType: 'All',
    avgResponse: '2.1%',
    avgRoi: '2.8x',
    drops: 4,
    popular: true,
  },
  {
    id: 'probate-nurture',
    name: 'Probate / Inheritance Nurture',
    description: 'Sensitive, long-form approach for inherited properties. Focuses on education and timeline flexibility.',
    bestFor: ['Wholesale', 'Buy & Hold'],
    season: 'All Year',
    marketType: 'All',
    avgResponse: '1.8%',
    avgRoi: '3.2x',
    drops: 5,
    popular: true,
  },
  {
    id: 'median-wholesale',
    name: 'Median Price Wholesale',
    description: 'Fast dispo focus for median-priced properties. Aggressive offer strategy with quick close messaging.',
    bestFor: ['Wholesale'],
    season: 'All Year',
    marketType: 'Mid-Competition',
    avgResponse: '2.4%',
    avgRoi: '2.5x',
    drops: 3,
    popular: false,
  },
  {
    id: 'high-volatility',
    name: 'High-Volatility Market',
    description: 'Rapid refresh cadence with aggressive testing. Designed for competitive markets with fast-changing conditions.',
    bestFor: ['Wholesale', 'Flip'],
    season: 'All Year',
    marketType: 'High Competition',
    avgResponse: '1.5%',
    avgRoi: '2.2x',
    drops: 4,
    popular: false,
  },
  {
    id: 'preforeclosure-urgent',
    name: 'Pre-Foreclosure Urgent',
    description: 'Time-sensitive messaging for distressed owners. Weekly list updates with urgency-driven creative.',
    bestFor: ['Wholesale', 'Novation'],
    season: 'All Year',
    marketType: 'All',
    avgResponse: '2.8%',
    avgRoi: '2.1x',
    drops: 3,
    popular: true,
  },
  {
    id: 'senior-equity',
    name: 'High Equity Seniors',
    description: 'Respectful approach for senior homeowners with significant equity. Focuses on downsizing and estate planning.',
    bestFor: ['Buy & Hold', 'Wholesale'],
    season: 'Q1-Q2',
    marketType: 'Suburban',
    avgResponse: '1.4%',
    avgRoi: '3.5x',
    drops: 4,
    popular: false,
  },
];

const MARKETS = [
  { id: 'phoenix', name: 'Phoenix, AZ', counties: ['Maricopa'] },
  { id: 'dallas', name: 'Dallas, TX', counties: ['Dallas', 'Tarrant', 'Collin'] },
  { id: 'atlanta', name: 'Atlanta, GA', counties: ['Fulton', 'DeKalb', 'Gwinnett'] },
  { id: 'houston', name: 'Houston, TX', counties: ['Harris', 'Fort Bend'] },
  { id: 'tampa', name: 'Tampa, FL', counties: ['Hillsborough', 'Pinellas'] },
];

const CREATIVE_OPTIONS = [
  {
    id: 'postcard-yellow',
    type: 'Postcard',
    name: 'Yellow Letter Style Postcard',
    preview: 'Handwritten look, curiosity-driven',
    bestFor: ['Drop 1', 'All Segments'],
  },
  {
    id: 'postcard-professional',
    type: 'Postcard',
    name: 'Professional Investor Postcard',
    preview: 'Clean, branded design',
    bestFor: ['Drop 2', 'Higher Value'],
  },
  {
    id: 'letter-branded',
    type: 'Letter',
    name: 'Branded Letter with Testimonial',
    preview: 'Builds credibility and trust',
    bestFor: ['Drop 2-3', 'All Segments'],
  },
  {
    id: 'letter-personal',
    type: 'Letter',
    name: 'Personal Letter',
    preview: 'Conversational tone, relationship-focused',
    bestFor: ['Probate', 'Seniors'],
  },
  {
    id: 'check-standard',
    type: 'Check Mailer',
    name: 'Standard Check Mailer',
    preview: 'Specific offer amount',
    bestFor: ['Drop 3-4', 'High Equity'],
  },
  {
    id: 'snap-pack',
    type: 'Snap Pack',
    name: 'Official-Look Snap Pack',
    preview: 'High open rates, attention-grabbing',
    bestFor: ['Drop 1-2', 'Tax Liens'],
  },
  {
    id: 'sorry-missed',
    type: 'Postcard',
    name: 'Sorry We Missed You',
    preview: 'Follow-up for non-responders',
    bestFor: ['Drop 4+', 'Non-Responders'],
  },
];

export default function TemplateModePage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStrategy, setFilterStrategy] = useState('all');
  const [formData, setFormData] = useState({
    selectedPlaybook: null as typeof PLAYBOOKS[0] | null,
    // Targeting
    markets: ['phoenix'],
    filters: {
      minEquity: 30,
      maxPrice: 400000,
      ownershipYears: 5,
    },
    refreshCadence: '30',
    // Creative
    creatives: [
      { drop: 1, creativeId: 'postcard-yellow' },
      { drop: 2, creativeId: 'letter-branded' },
      { drop: 3, creativeId: 'check-standard' },
      { drop: 4, creativeId: 'sorry-missed' },
    ],
    // Offers
    offerType: 'dynamic',
    flatPercentage: 75,
    // Schedule
    drops: 4,
    interval: 30,
    startDate: '2024-12-15',
    skipHolidays: true,
    monthlyBudget: 12000,
    volumePerDrop: 3000,
    // Telephony
    trackingNumbers: 'auto',
    healthChecks: true,
    // Campaign
    campaignName: '',
  });

  const updateFormData = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const selectPlaybook = (playbook: typeof PLAYBOOKS[0]) => {
    setFormData((prev) => ({
      ...prev,
      selectedPlaybook: playbook,
      campaignName: `${playbook.name} - ${new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`,
      drops: playbook.drops,
    }));
  };

  const toggleMarket = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      markets: prev.markets.includes(id)
        ? prev.markets.filter((m) => m !== id)
        : [...prev.markets, id],
    }));
  };

  const updateCreative = (drop: number, creativeId: string) => {
    setFormData((prev) => ({
      ...prev,
      creatives: prev.creatives.map((c) =>
        c.drop === drop ? { ...c, creativeId } : c
      ),
    }));
  };

  const nextStep = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const filteredPlaybooks = PLAYBOOKS.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStrategy = filterStrategy === 'all' || p.bestFor.some((s) =>
      s.toLowerCase().includes(filterStrategy.toLowerCase())
    );
    return matchesSearch && matchesStrategy;
  });

  const renderStepContent = () => {
    switch (STEPS[currentStep].id) {
      case 'playbooks':
        return (
          <div className="space-y-6">
            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                <input
                  type="text"
                  placeholder="Search playbooks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-field w-full pl-10"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-text-muted" />
                <select
                  value={filterStrategy}
                  onChange={(e) => setFilterStrategy(e.target.value)}
                  className="input-field"
                >
                  <option value="all">All Strategies</option>
                  <option value="wholesale">Wholesale</option>
                  <option value="flip">Fix & Flip</option>
                  <option value="novation">Novation</option>
                  <option value="buy">Buy & Hold</option>
                </select>
              </div>
            </div>

            {/* Playbook Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredPlaybooks.map((playbook) => (
                <button
                  key={playbook.id}
                  onClick={() => selectPlaybook(playbook)}
                  className={`glass-card p-4 text-left transition-all ${
                    formData.selectedPlaybook?.id === playbook.id
                      ? 'border-accent bg-accent/5'
                      : 'hover:border-glass-border-hover'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-text-primary">{playbook.name}</h3>
                    {playbook.popular && (
                      <span className="flex items-center gap-1 text-xs text-warning">
                        <Star className="w-3 h-3 fill-current" />
                        Popular
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-text-secondary mb-3">{playbook.description}</p>

                  <div className="flex flex-wrap gap-2 mb-3">
                    {playbook.bestFor.map((strategy) => (
                      <span key={strategy} className="text-xs px-2 py-0.5 rounded bg-glass-surface text-text-muted">
                        {strategy}
                      </span>
                    ))}
                    <span className="text-xs px-2 py-0.5 rounded bg-accent/20 text-accent">
                      {playbook.season}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-text-muted pt-3 border-t border-glass-border/50">
                    <span className="flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      {playbook.avgResponse} response
                    </span>
                    <span className="flex items-center gap-1">
                      <BarChart3 className="w-3 h-3" />
                      {playbook.avgRoi} ROI
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {playbook.drops} drops
                    </span>
                  </div>
                </button>
              ))}
            </div>

            {formData.selectedPlaybook && (
              <div className="glass-card p-4 bg-success/5 border-success/30">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-success" />
                  <div>
                    <p className="font-medium text-text-primary">
                      Selected: {formData.selectedPlaybook.name}
                    </p>
                    <p className="text-sm text-text-muted">
                      Click Next to customize targeting for this playbook
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 'targeting':
        return (
          <div className="space-y-6">
            {/* Playbook Defaults */}
            <div className="glass-card p-4 border-accent/30 bg-accent/5">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-accent flex-shrink-0" />
                <div>
                  <p className="font-medium text-text-primary">
                    Defaults from {formData.selectedPlaybook?.name}
                  </p>
                  <p className="text-sm text-text-secondary mt-1">
                    Targeting settings have been pre-configured based on playbook best practices.
                    Adjust as needed for your specific markets.
                  </p>
                </div>
              </div>
            </div>

            {/* Markets */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-3">
                Target Markets
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {MARKETS.map((market) => (
                  <button
                    key={market.id}
                    onClick={() => toggleMarket(market.id)}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      formData.markets.includes(market.id)
                        ? 'border-accent bg-accent/10 text-text-primary'
                        : 'border-glass-border bg-glass-surface text-text-secondary hover:border-glass-border-hover'
                    }`}
                  >
                    <p className="font-medium">{market.name}</p>
                    <p className="text-xs text-text-muted">{market.counties.join(', ')}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Min Equity %
                </label>
                <input
                  type="number"
                  value={formData.filters.minEquity}
                  onChange={(e) => updateFormData('filters', {
                    ...formData.filters,
                    minEquity: parseInt(e.target.value)
                  })}
                  className="input-field w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Max Price
                </label>
                <input
                  type="number"
                  value={formData.filters.maxPrice}
                  onChange={(e) => updateFormData('filters', {
                    ...formData.filters,
                    maxPrice: parseInt(e.target.value)
                  })}
                  className="input-field w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Min Ownership (Years)
                </label>
                <input
                  type="number"
                  value={formData.filters.ownershipYears}
                  onChange={(e) => updateFormData('filters', {
                    ...formData.filters,
                    ownershipYears: parseInt(e.target.value)
                  })}
                  className="input-field w-full"
                />
              </div>
            </div>

            {/* Refresh Cadence */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                List Refresh Cadence
              </label>
              <select
                value={formData.refreshCadence}
                onChange={(e) => updateFormData('refreshCadence', e.target.value)}
                className="input-field w-full"
              >
                <option value="7">Weekly (7 days)</option>
                <option value="14">Bi-Weekly (14 days)</option>
                <option value="30">Monthly (30 days)</option>
                <option value="45">45 Days</option>
                <option value="90">Quarterly (90 days)</option>
              </select>
              <p className="text-xs text-text-muted mt-1">
                {formData.selectedPlaybook?.id === 'preforeclosure-urgent'
                  ? 'Recommended: Weekly refresh for time-sensitive pre-foreclosure leads'
                  : 'Standard 30-day refresh balances cost and data freshness'}
              </p>
            </div>
          </div>
        );

      case 'creative':
        return (
          <div className="space-y-6">
            {/* Creative Sequence */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-3">
                Creative Selection by Drop
              </label>
              <div className="space-y-4">
                {formData.creatives.slice(0, formData.drops).map((creative) => {
                  const selectedCreative = CREATIVE_OPTIONS.find((c) => c.id === creative.creativeId);
                  return (
                    <div key={creative.drop} className="glass-card p-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold">
                          {creative.drop}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-text-primary mb-2">Drop {creative.drop}</p>
                          <select
                            value={creative.creativeId}
                            onChange={(e) => updateCreative(creative.drop, e.target.value)}
                            className="input-field w-full"
                          >
                            {CREATIVE_OPTIONS.map((option) => (
                              <option key={option.id} value={option.id}>
                                {option.type}: {option.name}
                              </option>
                            ))}
                          </select>
                          {selectedCreative && (
                            <p className="text-xs text-text-muted mt-1">
                              {selectedCreative.preview} • Best for: {selectedCreative.bestFor.join(', ')}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Creative Library Link */}
            <div className="glass-card p-4 bg-glass-surface">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-text-primary">Need more options?</p>
                  <p className="text-sm text-text-muted">Browse the full Creative Library</p>
                </div>
                <Link href="/creative" className="btn-secondary text-sm flex items-center gap-1">
                  View Library
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        );

      case 'offers':
        return (
          <div className="space-y-6">
            {/* Offer Type */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-3">
                Offer Strategy
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => updateFormData('offerType', 'dynamic')}
                  className={`p-4 rounded-lg border text-left transition-all ${
                    formData.offerType === 'dynamic'
                      ? 'border-accent bg-accent/10'
                      : 'border-glass-border bg-glass-surface hover:border-glass-border-hover'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-5 h-5 text-accent" />
                    <span className="font-medium text-text-primary">Smart (Dynamic)</span>
                  </div>
                  <p className="text-sm text-text-secondary">
                    AI calculates optimal offers based on property data and market conditions
                  </p>
                </button>
                <button
                  onClick={() => updateFormData('offerType', 'flat')}
                  className={`p-4 rounded-lg border text-left transition-all ${
                    formData.offerType === 'flat'
                      ? 'border-accent bg-accent/10'
                      : 'border-glass-border bg-glass-surface hover:border-glass-border-hover'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-5 h-5 text-text-muted" />
                    <span className="font-medium text-text-primary">Flat Percentage</span>
                  </div>
                  <p className="text-sm text-text-secondary">
                    Use a consistent percentage of AVM across all properties
                  </p>
                </button>
              </div>
            </div>

            {formData.offerType === 'flat' && (
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Offer Percentage of AVM
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="60"
                    max="90"
                    value={formData.flatPercentage}
                    onChange={(e) => updateFormData('flatPercentage', parseInt(e.target.value))}
                    className="flex-1 accent-accent"
                  />
                  <span className="text-xl font-bold text-text-primary w-16 text-right">
                    {formData.flatPercentage}%
                  </span>
                </div>
                <p className="text-xs text-text-muted mt-2">
                  Example: $300,000 AVM → ${(300000 * formData.flatPercentage / 100).toLocaleString()} mailed offer
                </p>
              </div>
            )}

            {formData.offerType === 'dynamic' && (
              <div className="glass-card p-4 bg-accent/5 border-accent/30">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-accent flex-shrink-0" />
                  <div>
                    <p className="font-medium text-text-primary">Dynamic Offer Engine</p>
                    <p className="text-sm text-text-secondary mt-1">
                      Offers will be calculated using:
                    </p>
                    <ul className="text-sm text-text-secondary mt-2 space-y-1">
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-success" />
                        Property AVM/ARV data
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-success" />
                        Distress level indicators
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-success" />
                        County-level dispo constraints
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-success" />
                        Historical buy behavior
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 'schedule':
        return (
          <div className="space-y-6">
            {/* Drops */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Number of Drops
                </label>
                <select
                  value={formData.drops}
                  onChange={(e) => updateFormData('drops', parseInt(e.target.value))}
                  className="input-field w-full"
                >
                  <option value={2}>2 Drops</option>
                  <option value={3}>3 Drops</option>
                  <option value={4}>4 Drops</option>
                  <option value={5}>5 Drops</option>
                  <option value={6}>6 Drops</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Interval Between Drops
                </label>
                <select
                  value={formData.interval}
                  onChange={(e) => updateFormData('interval', parseInt(e.target.value))}
                  className="input-field w-full"
                >
                  <option value={21}>21 Days</option>
                  <option value={30}>30 Days</option>
                  <option value={45}>45 Days</option>
                  <option value={60}>60 Days</option>
                </select>
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  First Drop Date
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => updateFormData('startDate', e.target.value)}
                  className="input-field w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Holiday Handling
                </label>
                <button
                  onClick={() => updateFormData('skipHolidays', !formData.skipHolidays)}
                  className={`w-full p-3 rounded-lg border text-left transition-all ${
                    formData.skipHolidays
                      ? 'border-accent bg-accent/10 text-text-primary'
                      : 'border-glass-border bg-glass-surface text-text-secondary'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">Skip holiday weeks</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Budget */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Monthly Budget
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input
                    type="number"
                    value={formData.monthlyBudget}
                    onChange={(e) => updateFormData('monthlyBudget', parseInt(e.target.value))}
                    className="input-field w-full pl-9"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Volume per Drop
                </label>
                <input
                  type="number"
                  value={formData.volumePerDrop}
                  onChange={(e) => updateFormData('volumePerDrop', parseInt(e.target.value))}
                  className="input-field w-full"
                  placeholder="e.g., 3000"
                />
              </div>
            </div>

            {/* Timeline Preview */}
            <div className="glass-card p-4">
              <p className="text-sm font-medium text-text-primary mb-3">Drop Schedule Preview</p>
              <div className="space-y-2">
                {Array.from({ length: formData.drops }, (_, i) => {
                  const date = new Date(formData.startDate);
                  date.setDate(date.getDate() + (i * formData.interval));
                  return (
                    <div key={i} className="flex items-center gap-3 text-sm">
                      <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center text-accent text-xs font-medium">
                        {i + 1}
                      </div>
                      <span className="text-text-secondary">
                        {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      <span className="text-text-muted">•</span>
                      <span className="text-text-muted">{formData.volumePerDrop.toLocaleString()} pieces</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Cash Cycle Warning */}
            <div className="glass-card p-4 bg-warning/5 border-warning/30">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0" />
                <div>
                  <p className="font-medium text-text-primary">Cash Cycle Note</p>
                  <p className="text-sm text-text-secondary mt-1">
                    Expected cash-in from this campaign: 60-90 days after first drop.
                    Ensure your runway can support the campaign duration.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'telephony':
        return (
          <div className="space-y-6">
            {/* Tracking Numbers */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-3">
                Tracking Number Setup
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => updateFormData('trackingNumbers', 'auto')}
                  className={`p-4 rounded-lg border text-left transition-all ${
                    formData.trackingNumbers === 'auto'
                      ? 'border-accent bg-accent/10'
                      : 'border-glass-border bg-glass-surface hover:border-glass-border-hover'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-5 h-5 text-accent" />
                    <span className="font-medium text-text-primary">Auto-Provision</span>
                  </div>
                  <p className="text-sm text-text-secondary">
                    Automatically create tracking numbers
                  </p>
                </button>
                <button
                  onClick={() => updateFormData('trackingNumbers', 'existing')}
                  className={`p-4 rounded-lg border text-left transition-all ${
                    formData.trackingNumbers === 'existing'
                      ? 'border-accent bg-accent/10'
                      : 'border-glass-border bg-glass-surface hover:border-glass-border-hover'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Phone className="w-5 h-5 text-text-muted" />
                    <span className="font-medium text-text-primary">Use Existing</span>
                  </div>
                  <p className="text-sm text-text-secondary">
                    Map to your existing numbers
                  </p>
                </button>
              </div>
            </div>

            {/* Health Checks */}
            <div className="glass-card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-text-primary">Phone Health Monitoring</p>
                  <p className="text-sm text-text-muted">Periodic test calls to verify numbers</p>
                </div>
                <button
                  onClick={() => updateFormData('healthChecks', !formData.healthChecks)}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    formData.healthChecks ? 'bg-accent' : 'bg-dark-700'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                    formData.healthChecks ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>
            </div>
          </div>
        );

      case 'summary':
        return (
          <div className="space-y-6">
            {/* Campaign Name */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Campaign Name
              </label>
              <input
                type="text"
                value={formData.campaignName}
                onChange={(e) => updateFormData('campaignName', e.target.value)}
                className="input-field w-full text-lg"
              />
            </div>

            {/* Playbook Badge */}
            <div className="glass-card p-4 bg-accent/5 border-accent/30">
              <div className="flex items-center gap-3">
                <Target className="w-6 h-6 text-accent" />
                <div>
                  <p className="text-sm text-text-muted">Based on Playbook</p>
                  <p className="font-semibold text-text-primary">{formData.selectedPlaybook?.name}</p>
                </div>
              </div>
            </div>

            {/* Summary Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="glass-card p-4">
                <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Markets</p>
                <p className="font-semibold text-text-primary">
                  {formData.markets.length} selected
                </p>
              </div>
              <div className="glass-card p-4">
                <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Drops</p>
                <p className="font-semibold text-text-primary">{formData.drops}</p>
              </div>
              <div className="glass-card p-4">
                <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Monthly Budget</p>
                <p className="font-semibold text-text-primary">
                  ${formData.monthlyBudget.toLocaleString()}
                </p>
              </div>
              <div className="glass-card p-4">
                <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Total Volume</p>
                <p className="font-semibold text-text-primary">
                  {(formData.volumePerDrop * formData.drops).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Expected Performance */}
            <div className="glass-card p-4">
              <p className="text-sm font-medium text-text-primary mb-3">Expected Performance</p>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-2xl font-bold text-success">{formData.selectedPlaybook?.avgResponse}</p>
                  <p className="text-xs text-text-muted">Response Rate</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-accent">{formData.selectedPlaybook?.avgRoi}</p>
                  <p className="text-xs text-text-muted">Expected ROI</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-data-cyan">
                    {Math.round((formData.volumePerDrop * formData.drops * (parseFloat(formData.selectedPlaybook?.avgResponse || '0') / 100)) * 0.05)}
                  </p>
                  <p className="text-xs text-text-muted">Est. Contracts</p>
                </div>
              </div>
            </div>

            {/* Launch Actions */}
            <div className="flex items-center gap-4">
              <button className="btn-secondary flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Save as Draft
              </button>
              <button className="btn-primary flex-1 flex items-center justify-center gap-2">
                <Rocket className="w-4 h-4" />
                Launch Campaign
              </button>
            </div>

            <p className="text-xs text-text-muted text-center">
              First drop: {new Date(formData.startDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/campaigns/builder" className="p-2 hover:bg-glass-surface rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-text-muted" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Template Mode</h1>
          <p className="text-text-secondary">Start from a proven playbook</p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            const isCompleted = index < currentStep;
            const isCurrent = index === currentStep;

            return (
              <div key={step.id} className="flex items-center">
                <button
                  onClick={() => formData.selectedPlaybook || index === 0 ? setCurrentStep(index) : null}
                  disabled={!formData.selectedPlaybook && index > 0}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                    isCurrent
                      ? 'bg-accent/20 text-accent'
                      : isCompleted
                      ? 'text-success hover:bg-glass-surface'
                      : 'text-text-muted hover:bg-glass-surface disabled:opacity-50 disabled:cursor-not-allowed'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
                  <span className="text-sm font-medium hidden lg:inline">{step.label}</span>
                </button>
                {index < STEPS.length - 1 && (
                  <div className={`w-8 h-0.5 mx-2 ${
                    isCompleted ? 'bg-success' : 'bg-glass-border'
                  }`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-6">
          {(() => {
            const Icon = STEPS[currentStep].icon;
            return <Icon className="w-6 h-6 text-accent" />;
          })()}
          <h2 className="text-xl font-semibold text-text-primary">{STEPS[currentStep].label}</h2>
        </div>

        {renderStepContent()}
      </div>

      {/* Navigation */}
      {STEPS[currentStep].id !== 'summary' && (
        <div className="flex items-center justify-between">
          <button
            onClick={prevStep}
            disabled={currentStep === 0}
            className="btn-secondary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="w-4 h-4" />
            Previous
          </button>
          <button
            onClick={nextStep}
            disabled={STEPS[currentStep].id === 'playbooks' && !formData.selectedPlaybook}
            className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
