'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Wand2,
  BookTemplate,
  Sparkles,
  ArrowRight,
  Clock,
  CheckCircle2,
  Zap,
  Target,
  TrendingUp,
  Shield,
  BarChart3,
  Copy,
  MoreHorizontal,
} from 'lucide-react';

// Mock recent campaigns
const recentCampaigns = [
  {
    id: '1',
    name: 'Q4 Absentee Owners - Phoenix',
    mode: 'automatic',
    status: 'active',
    createdAt: '2024-11-15',
    performance: '+24% response',
  },
  {
    id: '2',
    name: 'Probate Nurture - Dallas',
    mode: 'template',
    status: 'active',
    createdAt: '2024-11-10',
    performance: '+18% response',
  },
  {
    id: '3',
    name: 'High Equity Seniors - Atlanta',
    mode: 'automatic',
    status: 'draft',
    createdAt: '2024-11-08',
    performance: null,
  },
];

export default function SmartBuilderPage() {
  const [lastUsedMode] = useState<'automatic' | 'template'>('automatic');

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Smart Campaign Builder</h1>
        <p className="text-text-secondary mt-1">
          Create high-performance direct mail campaigns with AI-powered insights
        </p>
      </div>

      {/* Mode Selection */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Automatic Mode */}
        <Link
          href="/campaigns/builder/automatic"
          className="group glass-card p-6 hover:border-accent/50 transition-all duration-300"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-accent to-data-violet flex items-center justify-center shadow-glow-accent">
              <Wand2 className="w-7 h-7 text-white" />
            </div>
            {lastUsedMode === 'automatic' && (
              <span className="badge badge-accent">Recommended</span>
            )}
          </div>

          <h2 className="text-xl font-semibold text-text-primary mb-2 group-hover:text-accent transition-colors">
            Automatic Mode
          </h2>
          <p className="text-text-secondary mb-4">
            Let AI build your campaign end-to-end using real estate insights, triggers, seasonality, and creative optimization.
          </p>

          <div className="space-y-2 mb-6">
            <div className="flex items-center gap-2 text-sm text-text-muted">
              <Sparkles className="w-4 h-4 text-accent" />
              <span>AI-optimized targeting & offers</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-text-muted">
              <Target className="w-4 h-4 text-accent" />
              <span>Smart creative sequencing</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-text-muted">
              <TrendingUp className="w-4 h-4 text-accent" />
              <span>Built-in A/B testing</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-text-muted">
              <Shield className="w-4 h-4 text-accent" />
              <span>Dispo-aware pricing</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-accent font-medium">
            <span>Start with AI</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* Template Mode */}
        <Link
          href="/campaigns/builder/templates"
          className="group glass-card p-6 hover:border-data-cyan/50 transition-all duration-300"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-data-cyan to-data-emerald flex items-center justify-center"
              style={{ boxShadow: '0 0 20px rgba(34,211,238,0.3)' }}>
              <BookTemplate className="w-7 h-7 text-white" />
            </div>
            {lastUsedMode === 'template' && (
              <span className="badge badge-accent">Recommended</span>
            )}
          </div>

          <h2 className="text-xl font-semibold text-text-primary mb-2 group-hover:text-data-cyan transition-colors">
            Template Mode
          </h2>
          <p className="text-text-secondary mb-4">
            Start from curated playbooks and customize targeting, creatives, and offers with AI assistance.
          </p>

          <div className="space-y-2 mb-6">
            <div className="flex items-center gap-2 text-sm text-text-muted">
              <BookTemplate className="w-4 h-4 text-data-cyan" />
              <span>Proven playbook templates</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-text-muted">
              <Zap className="w-4 h-4 text-data-cyan" />
              <span>Quick setup in minutes</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-text-muted">
              <BarChart3 className="w-4 h-4 text-data-cyan" />
              <span>Best practices built-in</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-text-muted">
              <CheckCircle2 className="w-4 h-4 text-data-cyan" />
              <span>Full customization control</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-data-cyan font-medium">
            <span>Browse Playbooks</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
      </div>

      {/* Recent Smart Campaigns */}
      <div className="glass-card">
        <div className="p-4 border-b border-glass-border">
          <h3 className="text-lg font-semibold text-text-primary">Recent Smart Campaigns</h3>
          <p className="text-sm text-text-muted">Quick access to edit or duplicate your recent campaigns</p>
        </div>

        <div className="divide-y divide-glass-border/50">
          {recentCampaigns.map((campaign) => (
            <div key={campaign.id} className="p-4 flex items-center justify-between hover:bg-glass-surface transition-colors">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  campaign.mode === 'automatic'
                    ? 'bg-accent/20 text-accent'
                    : 'bg-data-cyan/20 text-data-cyan'
                }`}>
                  {campaign.mode === 'automatic' ? (
                    <Wand2 className="w-5 h-5" />
                  ) : (
                    <BookTemplate className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-text-primary">{campaign.name}</p>
                  <div className="flex items-center gap-3 text-sm text-text-muted">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {campaign.createdAt}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      campaign.status === 'active'
                        ? 'bg-success/20 text-success'
                        : 'bg-glass-surface text-text-muted'
                    }`}>
                      {campaign.status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {campaign.performance && (
                  <span className="text-sm font-medium text-success">{campaign.performance}</span>
                )}
                <div className="flex items-center gap-2">
                  <button className="p-2 hover:bg-glass-surface rounded-lg transition-colors" title="Duplicate">
                    <Copy className="w-4 h-4 text-text-muted" />
                  </button>
                  <button className="p-2 hover:bg-glass-surface rounded-lg transition-colors" title="More options">
                    <MoreHorizontal className="w-4 h-4 text-text-muted" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {recentCampaigns.length === 0 && (
          <div className="p-8 text-center">
            <p className="text-text-muted">No recent campaigns. Create your first smart campaign above!</p>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-success/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary">+32%</p>
              <p className="text-sm text-text-muted">Avg. response lift</p>
            </div>
          </div>
        </div>

        <div className="glass-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
              <Zap className="w-5 h-5 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary">5 min</p>
              <p className="text-sm text-text-muted">Avg. setup time</p>
            </div>
          </div>
        </div>

        <div className="glass-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-data-cyan/20 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-data-cyan" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary">89%</p>
              <p className="text-sm text-text-muted">Wizard completion</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
