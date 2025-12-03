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
  TestTube,
  Phone,
  Rocket,
  Sparkles,
  Info,
  Plus,
  X,
  RefreshCw,
  AlertTriangle,
  ChevronDown,
  Zap,
  Calendar,
  TrendingUp,
  Building,
  Users,
  Home,
  Clock,
  CheckCircle2,
  Lightbulb,
} from 'lucide-react';

const STEPS = [
  { id: 'basics', label: 'Basic Inputs', icon: Target },
  { id: 'targeting', label: 'Data Targeting', icon: MapPin },
  { id: 'offers', label: 'Offer Strategy', icon: DollarSign },
  { id: 'creative', label: 'Creative & Campaign', icon: Palette },
  { id: 'testing', label: 'Testing Plan', icon: TestTube },
  { id: 'telephony', label: 'Telephony', icon: Phone },
  { id: 'summary', label: 'Summary', icon: Rocket },
];

const MARKETS = [
  { id: 'phoenix', name: 'Phoenix, AZ', counties: ['Maricopa'] },
  { id: 'dallas', name: 'Dallas, TX', counties: ['Dallas', 'Tarrant', 'Collin'] },
  { id: 'atlanta', name: 'Atlanta, GA', counties: ['Fulton', 'DeKalb', 'Gwinnett'] },
  { id: 'houston', name: 'Houston, TX', counties: ['Harris', 'Fort Bend'] },
  { id: 'tampa', name: 'Tampa, FL', counties: ['Hillsborough', 'Pinellas'] },
];

const STRATEGIES = [
  { id: 'wholesale', name: 'Wholesale', description: 'Quick assignment, focus on speed' },
  { id: 'flip', name: 'Fix & Flip', description: 'Value-add renovation plays' },
  { id: 'novation', name: 'Novation', description: 'Creative financing structures' },
  { id: 'buy_hold', name: 'Buy & Hold', description: 'Long-term rental acquisitions' },
];

const LEAD_TYPES = [
  { id: 'absentee', name: 'Absentee Owners', icon: Building },
  { id: 'owner_occupied', name: 'Owner Occupied', icon: Home },
  { id: 'probate', name: 'Probate/Inheritance', icon: Users },
  { id: 'preforeclosure', name: 'Pre-Foreclosure', icon: AlertTriangle },
  { id: 'tax_lien', name: 'Tax Lien', icon: DollarSign },
  { id: 'high_equity', name: 'High Equity', icon: TrendingUp },
];

// AI-generated list suggestions
const AI_LIST_SUGGESTIONS = [
  {
    name: 'Absentee Owners - High Equity',
    records: 12450,
    refreshCycle: '30 days',
    reason: 'Highest response rate in Phoenix market for wholesale strategy',
    confidence: 94,
  },
  {
    name: 'Pre-Foreclosure (NOD 30-90 days)',
    records: 2340,
    refreshCycle: '7 days',
    reason: 'Time-sensitive trigger list with high motivation',
    confidence: 89,
  },
  {
    name: 'Probate Filed Last 6 Months',
    records: 890,
    refreshCycle: '14 days',
    reason: 'Strong Q4 performance, lower competition',
    confidence: 86,
  },
];

// AI creative suggestions
const AI_CREATIVE_SUGGESTIONS = [
  {
    drop: 1,
    type: 'Postcard',
    name: 'Curiosity Postcard - Yellow Letter Style',
    segment: 'All',
    reason: 'High open rates, low cost entry point',
  },
  {
    drop: 2,
    type: 'Letter',
    name: 'Branded Letter with Testimonial',
    segment: 'All',
    reason: 'Builds credibility after initial touch',
  },
  {
    drop: 3,
    type: 'Check Mailer',
    name: 'Check Mailer - Specific Offer',
    segment: 'High Equity Only',
    reason: 'Strong conversion for qualified leads',
  },
  {
    drop: 4,
    type: 'Postcard',
    name: 'Sorry We Missed You',
    segment: 'Non-responders',
    reason: 'Re-engagement for warm leads',
  },
];

export default function AutomaticModePage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    // Basic inputs
    selectedMarkets: ['phoenix'],
    strategy: 'wholesale',
    maxPrice: 350000,
    monthlyBudget: 15000,
    targetVolume: '10000-15000',
    leadTypes: ['absentee', 'preforeclosure'],
    exclusions: '',
    // Targeting
    lists: AI_LIST_SUGGESTIONS,
    // Offers
    offerMode: 'dynamic',
    offerPreference: 'balanced',
    countyAdjustments: {},
    // Creative
    creativeSequence: AI_CREATIVE_SUGGESTIONS,
    // Testing
    enableTesting: true,
    testCreatives: true,
    testOffers: true,
    evaluationWindow: 30,
    // Telephony
    trackingNumbers: 'auto',
    healthChecks: true,
    // Campaign name
    campaignName: 'Q4 2024 Smart Campaign - Phoenix',
  });

  const updateFormData = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleLeadType = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      leadTypes: prev.leadTypes.includes(id)
        ? prev.leadTypes.filter((t) => t !== id)
        : [...prev.leadTypes, id],
    }));
  };

  const toggleMarket = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedMarkets: prev.selectedMarkets.includes(id)
        ? prev.selectedMarkets.filter((m) => m !== id)
        : [...prev.selectedMarkets, id],
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

  const renderStepContent = () => {
    switch (STEPS[currentStep].id) {
      case 'basics':
        return (
          <div className="space-y-6">
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
                      formData.selectedMarkets.includes(market.id)
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

            {/* Strategy */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-3">
                Investment Strategy
              </label>
              <div className="grid grid-cols-2 gap-3">
                {STRATEGIES.map((strategy) => (
                  <button
                    key={strategy.id}
                    onClick={() => updateFormData('strategy', strategy.id)}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      formData.strategy === strategy.id
                        ? 'border-accent bg-accent/10 text-text-primary'
                        : 'border-glass-border bg-glass-surface text-text-secondary hover:border-glass-border-hover'
                    }`}
                  >
                    <p className="font-medium">{strategy.name}</p>
                    <p className="text-xs text-text-muted">{strategy.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Budget & Volume */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Max Property Price
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input
                    type="number"
                    value={formData.maxPrice}
                    onChange={(e) => updateFormData('maxPrice', parseInt(e.target.value))}
                    className="input-field w-full pl-9"
                  />
                </div>
              </div>
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
            </div>

            {/* Lead Types */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-3">
                Lead Types to Include
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {LEAD_TYPES.map((type) => {
                  const Icon = type.icon;
                  return (
                    <button
                      key={type.id}
                      onClick={() => toggleLeadType(type.id)}
                      className={`p-3 rounded-lg border flex items-center gap-3 transition-all ${
                        formData.leadTypes.includes(type.id)
                          ? 'border-accent bg-accent/10 text-text-primary'
                          : 'border-glass-border bg-glass-surface text-text-secondary hover:border-glass-border-hover'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-sm">{type.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Exclusions */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Price Band Exclusions (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g., 600k-900k, >1M"
                value={formData.exclusions}
                onChange={(e) => updateFormData('exclusions', e.target.value)}
                className="input-field w-full"
              />
              <p className="text-xs text-text-muted mt-1">Exclude specific price ranges from targeting</p>
            </div>
          </div>
        );

      case 'targeting':
        return (
          <div className="space-y-6">
            {/* AI Insight Banner */}
            <div className="glass-card p-4 border-accent/30 bg-accent/5">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-4 h-4 text-accent" />
                </div>
                <div>
                  <p className="font-medium text-text-primary">AI-Optimized List Strategy</p>
                  <p className="text-sm text-text-secondary mt-1">
                    Based on your Phoenix market selection and wholesale strategy, we've identified high-performing
                    list combinations with optimal refresh cycles.
                  </p>
                </div>
              </div>
            </div>

            {/* Suggested Lists */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-text-primary">
                  Recommended Lists
                </label>
                <button className="text-xs text-accent hover:text-accent-light flex items-center gap-1">
                  <RefreshCw className="w-3 h-3" />
                  Regenerate
                </button>
              </div>

              <div className="space-y-3">
                {formData.lists.map((list, index) => (
                  <div key={index} className="glass-card p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-text-primary">{list.name}</p>
                          <span className="text-xs px-2 py-0.5 rounded bg-success/20 text-success">
                            {list.confidence}% match
                          </span>
                        </div>
                        <p className="text-sm text-text-secondary mt-1">{list.reason}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-text-muted">
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {list.records.toLocaleString()} records
                          </span>
                          <span className="flex items-center gap-1">
                            <RefreshCw className="w-3 h-3" />
                            Refresh: {list.refreshCycle}
                          </span>
                        </div>
                      </div>
                      <button className="p-1 hover:bg-glass-surface rounded">
                        <X className="w-4 h-4 text-text-muted" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <button className="mt-3 text-sm text-accent hover:text-accent-light flex items-center gap-1">
                <Plus className="w-4 h-4" />
                Add custom list
              </button>
            </div>

            {/* Refresh Explanation */}
            <div className="glass-card p-4 bg-glass-surface">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-text-muted flex-shrink-0 mt-0.5" />
                <div className="text-sm text-text-secondary">
                  <p className="font-medium text-text-primary mb-1">Why these refresh cycles?</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Trigger lists (pre-foreclosure) need weekly updates to catch new filings</li>
                    <li>Absentee lists are stable - 30-day refresh balances cost vs freshness</li>
                    <li>Probate lists update bi-weekly as new cases are filed monthly</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );

      case 'offers':
        return (
          <div className="space-y-6">
            {/* Offer Mode Selection */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-3">
                Offer Calculation Method
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => updateFormData('offerMode', 'dynamic')}
                  className={`p-4 rounded-lg border text-left transition-all ${
                    formData.offerMode === 'dynamic'
                      ? 'border-accent bg-accent/10'
                      : 'border-glass-border bg-glass-surface hover:border-glass-border-hover'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-5 h-5 text-accent" />
                    <span className="font-medium text-text-primary">Dynamic (AI)</span>
                  </div>
                  <p className="text-sm text-text-secondary">
                    AI calculates optimal offer % based on AVM, distress level, and market conditions
                  </p>
                </button>
                <button
                  onClick={() => updateFormData('offerMode', 'flat')}
                  className={`p-4 rounded-lg border text-left transition-all ${
                    formData.offerMode === 'flat'
                      ? 'border-accent bg-accent/10'
                      : 'border-glass-border bg-glass-surface hover:border-glass-border-hover'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-5 h-5 text-text-muted" />
                    <span className="font-medium text-text-primary">Flat Percentage</span>
                  </div>
                  <p className="text-sm text-text-secondary">
                    Use a fixed % of AVM across all properties in the campaign
                  </p>
                </button>
              </div>
            </div>

            {/* Offer Preference */}
            {formData.offerMode === 'dynamic' && (
              <div>
                <label className="block text-sm font-medium text-text-primary mb-3">
                  Optimization Preference
                </label>
                <div className="glass-card p-4">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-text-muted">Bigger Spreads</span>
                    <span className="text-sm text-text-muted">More Volume</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={formData.offerPreference === 'spreads' ? 25 : formData.offerPreference === 'volume' ? 75 : 50}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      updateFormData('offerPreference', val < 40 ? 'spreads' : val > 60 ? 'volume' : 'balanced');
                    }}
                    className="w-full accent-accent"
                  />
                  <p className="text-center text-sm text-text-secondary mt-2">
                    {formData.offerPreference === 'spreads' && 'Lower offers for bigger margins'}
                    {formData.offerPreference === 'volume' && 'Higher offers for more responses'}
                    {formData.offerPreference === 'balanced' && 'Balanced approach'}
                  </p>
                </div>
              </div>
            )}

            {/* Example Preview */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-3">
                Offer Preview by County
              </label>
              <div className="glass-card overflow-hidden">
                <table className="w-full">
                  <thead className="bg-glass-surface">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">County</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">Avg AVM</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">Mailed Offer</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">Target Buy</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">Spread</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-glass-border/50">
                    <tr>
                      <td className="px-4 py-3 text-sm text-text-primary">Maricopa</td>
                      <td className="px-4 py-3 text-sm text-text-secondary">$320,000</td>
                      <td className="px-4 py-3 text-sm text-text-primary">$256,000 (80%)</td>
                      <td className="px-4 py-3 text-sm text-text-secondary">$224,000 (70%)</td>
                      <td className="px-4 py-3 text-sm text-success font-medium">$32,000</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm text-text-primary">Dallas</td>
                      <td className="px-4 py-3 text-sm text-text-secondary">$285,000</td>
                      <td className="px-4 py-3 text-sm text-text-primary">$222,300 (78%)</td>
                      <td className="px-4 py-3 text-sm text-text-secondary">$199,500 (70%)</td>
                      <td className="px-4 py-3 text-sm text-success font-medium">$22,800</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Adjustment Controls */}
            <div className="glass-card p-4 bg-glass-surface">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-text-primary">County-Level Adjustments</p>
                  <p className="text-sm text-text-muted">Fine-tune offer percentages by county</p>
                </div>
                <button className="btn-secondary text-sm">
                  Customize
                </button>
              </div>
            </div>
          </div>
        );

      case 'creative':
        return (
          <div className="space-y-6">
            {/* AI Creative Strategy */}
            <div className="glass-card p-4 border-accent/30 bg-accent/5">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-4 h-4 text-accent" />
                </div>
                <div>
                  <p className="font-medium text-text-primary">AI-Designed Multi-Touch Sequence</p>
                  <p className="text-sm text-text-secondary mt-1">
                    4-drop sequence optimized for wholesale in Phoenix. Respects Q4 seasonality and avoids
                    check mailer fatigue in saturated areas.
                  </p>
                </div>
              </div>
            </div>

            {/* Creative Sequence */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-3">
                Campaign Sequence
              </label>
              <div className="space-y-3">
                {formData.creativeSequence.map((creative, index) => (
                  <div key={index} className="glass-card p-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold">
                        {creative.drop}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs px-2 py-0.5 rounded bg-glass-surface text-text-muted">
                            {creative.type}
                          </span>
                          <p className="font-medium text-text-primary">{creative.name}</p>
                        </div>
                        <p className="text-sm text-text-muted mt-1">
                          Segment: {creative.segment} • {creative.reason}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button className="p-2 hover:bg-glass-surface rounded-lg text-text-muted hover:text-text-primary">
                          <RefreshCw className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Timing */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Drop Interval
                </label>
                <select className="input-field w-full">
                  <option value="30">Every 30 days</option>
                  <option value="45">Every 45 days</option>
                  <option value="21">Every 21 days</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  First Drop Date
                </label>
                <input type="date" className="input-field w-full" defaultValue="2024-12-15" />
              </div>
            </div>

            {/* Seasonal Warning */}
            <div className="glass-card p-4 bg-warning/5 border-warning/30">
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-warning flex-shrink-0" />
                <div>
                  <p className="font-medium text-text-primary">Q4 Seasonality Applied</p>
                  <p className="text-sm text-text-secondary mt-1">
                    Tax-angle messaging enabled for drops 1-2. Skip week of Dec 23-30 to avoid holiday mail delays.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'testing':
        return (
          <div className="space-y-6">
            {/* Enable Testing */}
            <div className="glass-card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-text-primary">Enable A/B Testing</p>
                  <p className="text-sm text-text-muted">Automatically split and test variations</p>
                </div>
                <button
                  onClick={() => updateFormData('enableTesting', !formData.enableTesting)}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    formData.enableTesting ? 'bg-accent' : 'bg-dark-700'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                    formData.enableTesting ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>
            </div>

            {formData.enableTesting && (
              <>
                {/* Test Types */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-3">
                    What to Test
                  </label>
                  <div className="space-y-3">
                    <div className="glass-card p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Palette className="w-5 h-5 text-accent" />
                          <div>
                            <p className="font-medium text-text-primary">Creative Variations</p>
                            <p className="text-sm text-text-muted">Test 2-3 creative formats per drop</p>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={formData.testCreatives}
                          onChange={(e) => updateFormData('testCreatives', e.target.checked)}
                          className="w-5 h-5 accent-accent"
                        />
                      </div>
                    </div>

                    <div className="glass-card p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <DollarSign className="w-5 h-5 text-success" />
                          <div>
                            <p className="font-medium text-text-primary">Offer Levels</p>
                            <p className="text-sm text-text-muted">Test different offer percentages</p>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={formData.testOffers}
                          onChange={(e) => updateFormData('testOffers', e.target.checked)}
                          className="w-5 h-5 accent-accent"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* AI Test Suggestions */}
                <div className="glass-card p-4 border-accent/30 bg-accent/5">
                  <div className="flex items-start gap-3">
                    <Lightbulb className="w-5 h-5 text-accent flex-shrink-0" />
                    <div>
                      <p className="font-medium text-text-primary">AI Test Recommendations</p>
                      <ul className="text-sm text-text-secondary mt-2 space-y-2">
                        <li className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-success" />
                          Drop 1: Postcard vs Yellow Letter (50/50 split)
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-success" />
                          Drop 3: Check at 78% vs 82% offer (50/50 split)
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Evaluation Settings */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Evaluation Window
                    </label>
                    <select
                      value={formData.evaluationWindow}
                      onChange={(e) => updateFormData('evaluationWindow', parseInt(e.target.value))}
                      className="input-field w-full"
                    >
                      <option value={14}>14 days</option>
                      <option value={30}>30 days</option>
                      <option value={45}>45 days</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Winner Threshold
                    </label>
                    <select className="input-field w-full">
                      <option value="90">90% confidence</option>
                      <option value="95">95% confidence</option>
                      <option value="80">80% confidence</option>
                    </select>
                  </div>
                </div>

                <p className="text-sm text-text-muted">
                  When a winner is determined, 80% of remaining volume will automatically shift to the winning variant.
                </p>
              </>
            )}
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
                    Automatically create tracking numbers for each campaign segment
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
                    Map campaign to your existing tracking numbers
                  </p>
                </button>
              </div>
            </div>

            {/* Numbers Preview */}
            {formData.trackingNumbers === 'auto' && (
              <div className="glass-card overflow-hidden">
                <div className="p-4 border-b border-glass-border">
                  <p className="font-medium text-text-primary">Numbers to Provision</p>
                </div>
                <table className="w-full">
                  <thead className="bg-glass-surface">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">Segment</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">Area Code</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">Type</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-glass-border/50">
                    <tr>
                      <td className="px-4 py-3 text-sm text-text-primary">Absentee - Phoenix</td>
                      <td className="px-4 py-3 text-sm text-text-secondary">602</td>
                      <td className="px-4 py-3 text-sm text-text-muted">Local</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm text-text-primary">Pre-Foreclosure - Phoenix</td>
                      <td className="px-4 py-3 text-sm text-text-secondary">480</td>
                      <td className="px-4 py-3 text-sm text-text-muted">Local</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* Health Checks */}
            <div className="glass-card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-text-primary">Phone Health Monitoring</p>
                  <p className="text-sm text-text-muted">
                    Periodic test calls to verify numbers are reachable
                  </p>
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

            {formData.healthChecks && (
              <div className="glass-card p-4 bg-glass-surface">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0" />
                  <div className="text-sm text-text-secondary">
                    <p className="font-medium text-text-primary mb-1">Health checks will include:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Daily synthetic test calls during business hours</li>
                      <li>SMS deliverability verification</li>
                      <li>Alerts if call volume drops unexpectedly</li>
                      <li>Carrier reputation monitoring</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
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

            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="glass-card p-4">
                <p className="text-xs text-text-muted uppercase tracking-wider mb-2">Markets</p>
                <p className="text-lg font-semibold text-text-primary">
                  {formData.selectedMarkets.map(m => MARKETS.find(mk => mk.id === m)?.name).join(', ')}
                </p>
              </div>
              <div className="glass-card p-4">
                <p className="text-xs text-text-muted uppercase tracking-wider mb-2">Strategy</p>
                <p className="text-lg font-semibold text-text-primary">
                  {STRATEGIES.find(s => s.id === formData.strategy)?.name}
                </p>
              </div>
              <div className="glass-card p-4">
                <p className="text-xs text-text-muted uppercase tracking-wider mb-2">Monthly Budget</p>
                <p className="text-lg font-semibold text-text-primary">
                  ${formData.monthlyBudget.toLocaleString()}
                </p>
              </div>
              <div className="glass-card p-4">
                <p className="text-xs text-text-muted uppercase tracking-wider mb-2">Total Records</p>
                <p className="text-lg font-semibold text-text-primary">
                  {formData.lists.reduce((sum, l) => sum + l.records, 0).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Timeline */}
            <div className="glass-card p-4">
              <p className="text-sm font-medium text-text-primary mb-3">Campaign Timeline</p>
              <div className="flex items-center gap-2">
                {formData.creativeSequence.map((creative, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent text-sm font-medium">
                        {creative.drop}
                      </div>
                      <span className="text-xs text-text-muted mt-1">{creative.type}</span>
                    </div>
                    {index < formData.creativeSequence.length - 1 && (
                      <div className="w-8 h-0.5 bg-glass-border" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Key Metrics */}
            <div className="glass-card p-4">
              <p className="text-sm font-medium text-text-primary mb-3">Projected Performance</p>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-2xl font-bold text-success">1.8-2.4%</p>
                  <p className="text-xs text-text-muted">Expected Response Rate</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-accent">$2,800</p>
                  <p className="text-xs text-text-muted">Est. Cost per Contract</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-data-cyan">5-8</p>
                  <p className="text-xs text-text-muted">Expected Contracts/Month</p>
                </div>
              </div>
            </div>

            {/* Actions */}
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
              First drop will be sent on December 15, 2024. You can pause or modify the campaign at any time.
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
          <h1 className="text-2xl font-bold text-text-primary">Automatic Mode</h1>
          <p className="text-text-secondary">AI-powered campaign configuration</p>
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
                  onClick={() => setCurrentStep(index)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                    isCurrent
                      ? 'bg-accent/20 text-accent'
                      : isCompleted
                      ? 'text-success hover:bg-glass-surface'
                      : 'text-text-muted hover:bg-glass-surface'
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
            className="btn-primary flex items-center gap-2"
          >
            Next
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
