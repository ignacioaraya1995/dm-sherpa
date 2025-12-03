'use client';

import { useState } from 'react';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  ChevronRight,
  Copy,
  Edit3,
  Eye,
  Image,
  Layers,
  Mail,
  MoreHorizontal,
  Palette,
  Phone,
  Plus,
  Save,
  Settings,
  Sparkles,
  Star,
  Trash2,
  Type,
  Upload,
  User,
  X,
} from 'lucide-react';
import { StatCard } from '@/components/StatCard';
import { Badge } from '@/components/Badge';
import clsx from 'clsx';

// Types
interface Brand {
  id: string;
  name: string;
  isDefault: boolean;
  logo?: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  typography: {
    headingFont: string;
    bodyFont: string;
  };
  contact: {
    companyName: string;
    phone: string;
    website?: string;
    address?: string;
  };
  templatesUsing: number;
  campaignsUsing: number;
  createdAt: string;
  lastUpdated: string;
}

// Mock Data
const brands: Brand[] = [
  {
    id: '1',
    name: 'Primary Brand',
    isDefault: true,
    colors: {
      primary: '#1e40af',
      secondary: '#3b82f6',
      accent: '#f59e0b',
    },
    typography: {
      headingFont: 'Georgia',
      bodyFont: 'Arial',
    },
    contact: {
      companyName: 'Texas Home Buyers LLC',
      phone: '(512) 555-0123',
      website: 'texashomebuyers.com',
      address: '123 Main St, Austin, TX 78701',
    },
    templatesUsing: 12,
    campaignsUsing: 8,
    createdAt: '2024-01-15',
    lastUpdated: '2024-11-28',
  },
  {
    id: '2',
    name: 'Premium Brand',
    isDefault: false,
    colors: {
      primary: '#0f172a',
      secondary: '#475569',
      accent: '#c084fc',
    },
    typography: {
      headingFont: 'Playfair Display',
      bodyFont: 'Lato',
    },
    contact: {
      companyName: 'Prestige Properties',
      phone: '(512) 555-0456',
      website: 'prestigeproperties.com',
    },
    templatesUsing: 4,
    campaignsUsing: 3,
    createdAt: '2024-03-20',
    lastUpdated: '2024-11-25',
  },
  {
    id: '3',
    name: 'Local Investor',
    isDefault: false,
    colors: {
      primary: '#166534',
      secondary: '#22c55e',
      accent: '#eab308',
    },
    typography: {
      headingFont: 'Roboto Slab',
      bodyFont: 'Open Sans',
    },
    contact: {
      companyName: 'Your Local Home Buyer',
      phone: '(512) 555-0789',
    },
    templatesUsing: 6,
    campaignsUsing: 4,
    createdAt: '2024-06-10',
    lastUpdated: '2024-11-20',
  },
];

const brandingTips = [
  {
    title: 'Consistent recognition',
    description: 'Same logo, colors, and contact info across all pieces builds familiarity',
    icon: Eye,
  },
  {
    title: 'Multiple brands for testing',
    description: 'Create separate brands for different approaches without losing identity',
    icon: Layers,
  },
  {
    title: 'Local vs premium positioning',
    description: 'Use different brands for owner-occupant vs high-equity segments',
    icon: Star,
  },
];

export default function BrandManagerPage() {
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const totalTemplates = brands.reduce((sum, b) => sum + b.templatesUsing, 0);
  const totalCampaigns = brands.reduce((sum, b) => sum + b.campaignsUsing, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Brand Manager</h1>
          <p className="text-text-secondary mt-1">
            Define consistent brand elements for all your mail pieces
          </p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Brand
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          title="Total Brands"
          value={brands.length}
          subtitle="Configured"
          icon={Palette}
          color="accent"
        />
        <StatCard
          title="Templates Using Brands"
          value={totalTemplates}
          subtitle="With brand applied"
          icon={Layers}
          color="cyan"
        />
        <StatCard
          title="Active Campaigns"
          value={totalCampaigns}
          subtitle="Using brands"
          icon={Mail}
          color="success"
        />
        <StatCard
          title="Brand Consistency"
          value="94%"
          subtitle="Across campaigns"
          icon={CheckCircle2}
          color="violet"
        />
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Brands List */}
        <div className="col-span-8 space-y-4">
          {brands.map((brand) => (
            <div
              key={brand.id}
              onClick={() => setSelectedBrand(brand)}
              className={clsx(
                'glass-card p-6 cursor-pointer transition-all hover:border-accent/30',
                selectedBrand?.id === brand.id && 'border-accent/50'
              )}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  {/* Color Preview */}
                  <div className="w-16 h-16 rounded-xl overflow-hidden flex flex-col shadow-lg">
                    <div
                      className="flex-1"
                      style={{ backgroundColor: brand.colors.primary }}
                    />
                    <div className="flex h-4">
                      <div
                        className="flex-1"
                        style={{ backgroundColor: brand.colors.secondary }}
                      />
                      <div
                        className="flex-1"
                        style={{ backgroundColor: brand.colors.accent }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-text-primary">{brand.name}</h3>
                      {brand.isDefault && (
                        <Badge variant="accent" size="sm">Default</Badge>
                      )}
                    </div>
                    <p className="text-sm text-text-secondary mb-2">{brand.contact.companyName}</p>
                    <div className="flex items-center gap-4 text-sm text-text-muted">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {brand.contact.phone}
                      </span>
                      {brand.contact.website && (
                        <span className="flex items-center gap-1">
                          <span className="w-3 h-3">🌐</span>
                          {brand.contact.website}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm text-text-muted">
                      {brand.templatesUsing} templates • {brand.campaignsUsing} campaigns
                    </p>
                    <p className="text-xs text-text-muted">
                      Updated {brand.lastUpdated}
                    </p>
                  </div>
                  <button className="btn-ghost p-2">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Typography Preview */}
              <div className="mt-4 pt-4 border-t border-glass-border">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Type className="w-4 h-4 text-text-muted" />
                    <span className="text-sm text-text-muted">Heading:</span>
                    <span
                      className="text-sm font-medium text-text-primary"
                      style={{ fontFamily: brand.typography.headingFont }}
                    >
                      {brand.typography.headingFont}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Type className="w-4 h-4 text-text-muted" />
                    <span className="text-sm text-text-muted">Body:</span>
                    <span
                      className="text-sm text-text-primary"
                      style={{ fontFamily: brand.typography.bodyFont }}
                    >
                      {brand.typography.bodyFont}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Sidebar */}
        <div className="col-span-4 space-y-6">
          {/* Quick Actions for Selected Brand */}
          {selectedBrand ? (
            <div className="glass-card p-6">
              <h3 className="font-semibold text-text-primary mb-4">
                {selectedBrand.name}
              </h3>
              <div className="space-y-2">
                <button
                  onClick={() => setIsEditing(true)}
                  className="w-full btn-secondary flex items-center justify-center gap-2"
                >
                  <Edit3 className="w-4 h-4" />
                  Edit Brand
                </button>
                <button className="w-full btn-secondary flex items-center justify-center gap-2">
                  <Copy className="w-4 h-4" />
                  Duplicate
                </button>
                <button className="w-full btn-secondary flex items-center justify-center gap-2">
                  <Eye className="w-4 h-4" />
                  Preview on Template
                </button>
                {!selectedBrand.isDefault && (
                  <>
                    <button className="w-full btn-secondary flex items-center justify-center gap-2">
                      <Star className="w-4 h-4" />
                      Set as Default
                    </button>
                    <button className="w-full btn-ghost text-danger flex items-center justify-center gap-2">
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="glass-card p-6 text-center">
              <Palette className="w-12 h-12 text-text-muted mx-auto mb-3" />
              <p className="text-text-secondary">Select a brand to view actions</p>
            </div>
          )}

          {/* Branding Tips */}
          <div className="glass-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-accent" />
              <h3 className="font-semibold text-text-primary">Branding Tips</h3>
            </div>
            <div className="space-y-4">
              {brandingTips.map((tip, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="p-1.5 rounded bg-accent-muted">
                    <tip.icon className="w-3 h-3 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">{tip.title}</p>
                    <p className="text-xs text-text-muted">{tip.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Brand Consistency Warning */}
          <div className="glass-card p-6 border-warning/30 bg-warning-muted/20">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-warning shrink-0" />
              <div>
                <h3 className="font-semibold text-warning mb-1">Consistency Check</h3>
                <p className="text-sm text-text-secondary">
                  2 templates in your library don't have a brand applied. Consider updating
                  them for consistent recognition.
                </p>
                <button className="text-sm text-warning hover:underline mt-2">
                  View unbranded templates →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit/Create Brand Modal */}
      {(isEditing || isCreating) && (
        <div className="fixed inset-0 bg-dark-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="glass-card w-full max-w-3xl max-h-[90vh] overflow-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-glass-border">
              <div>
                <h2 className="text-xl font-bold text-text-primary">
                  {isCreating ? 'Create New Brand' : `Edit ${selectedBrand?.name}`}
                </h2>
                <p className="text-text-secondary text-sm mt-1">
                  Define your brand identity for consistent mail pieces
                </p>
              </div>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setIsCreating(false);
                }}
                className="btn-ghost p-2"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Brand Name */}
              <div>
                <label className="text-sm font-medium text-text-secondary mb-2 block">Brand Name</label>
                <input
                  type="text"
                  placeholder="e.g., Primary Brand"
                  defaultValue={selectedBrand?.name || ''}
                  className="input-field w-full"
                />
              </div>

              {/* Logo Upload */}
              <div>
                <label className="text-sm font-medium text-text-secondary mb-2 block">Logo</label>
                <div className="border-2 border-dashed border-glass-border rounded-xl p-8 text-center hover:border-accent/30 transition-colors cursor-pointer">
                  <Upload className="w-8 h-8 text-text-muted mx-auto mb-2" />
                  <p className="text-sm text-text-secondary">
                    Drop your logo here or <span className="text-accent">browse</span>
                  </p>
                  <p className="text-xs text-text-muted mt-1">PNG, JPG up to 2MB. Recommended: 400x100px</p>
                </div>
              </div>

              {/* Colors */}
              <div>
                <label className="text-sm font-medium text-text-secondary mb-3 block">Brand Colors</label>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs text-text-muted mb-1 block">Primary</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        defaultValue={selectedBrand?.colors.primary || '#1e40af'}
                        className="w-10 h-10 rounded-lg border border-glass-border cursor-pointer"
                      />
                      <input
                        type="text"
                        defaultValue={selectedBrand?.colors.primary || '#1e40af'}
                        className="input-field flex-1"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-text-muted mb-1 block">Secondary</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        defaultValue={selectedBrand?.colors.secondary || '#3b82f6'}
                        className="w-10 h-10 rounded-lg border border-glass-border cursor-pointer"
                      />
                      <input
                        type="text"
                        defaultValue={selectedBrand?.colors.secondary || '#3b82f6'}
                        className="input-field flex-1"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-text-muted mb-1 block">Accent</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        defaultValue={selectedBrand?.colors.accent || '#f59e0b'}
                        className="w-10 h-10 rounded-lg border border-glass-border cursor-pointer"
                      />
                      <input
                        type="text"
                        defaultValue={selectedBrand?.colors.accent || '#f59e0b'}
                        className="input-field flex-1"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Typography */}
              <div>
                <label className="text-sm font-medium text-text-secondary mb-3 block">Typography</label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-text-muted mb-1 block">Heading Font</label>
                    <select
                      className="input-field w-full"
                      defaultValue={selectedBrand?.typography.headingFont || 'Georgia'}
                    >
                      <option>Georgia</option>
                      <option>Playfair Display</option>
                      <option>Roboto Slab</option>
                      <option>Merriweather</option>
                      <option>Times New Roman</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-text-muted mb-1 block">Body Font</label>
                    <select
                      className="input-field w-full"
                      defaultValue={selectedBrand?.typography.bodyFont || 'Arial'}
                    >
                      <option>Arial</option>
                      <option>Open Sans</option>
                      <option>Lato</option>
                      <option>Roboto</option>
                      <option>Helvetica</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div>
                <label className="text-sm font-medium text-text-secondary mb-3 block">Contact Information</label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-text-muted mb-1 block">Company Name</label>
                    <input
                      type="text"
                      placeholder="Your Company LLC"
                      defaultValue={selectedBrand?.contact.companyName || ''}
                      className="input-field w-full"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-text-muted mb-1 block">Phone Number</label>
                    <input
                      type="text"
                      placeholder="(512) 555-0123"
                      defaultValue={selectedBrand?.contact.phone || ''}
                      className="input-field w-full"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-text-muted mb-1 block">Website (optional)</label>
                    <input
                      type="text"
                      placeholder="yourcompany.com"
                      defaultValue={selectedBrand?.contact.website || ''}
                      className="input-field w-full"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-text-muted mb-1 block">Address (optional)</label>
                    <input
                      type="text"
                      placeholder="123 Main St, City, ST 12345"
                      defaultValue={selectedBrand?.contact.address || ''}
                      className="input-field w-full"
                    />
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div>
                <label className="text-sm font-medium text-text-secondary mb-3 block">Preview</label>
                <div className="p-6 rounded-xl bg-white">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-24 h-8 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500">
                      Logo
                    </div>
                    <div>
                      <p className="font-bold text-gray-900" style={{ fontFamily: selectedBrand?.typography.headingFont || 'Georgia' }}>
                        {selectedBrand?.contact.companyName || 'Your Company LLC'}
                      </p>
                      <p className="text-sm text-gray-600" style={{ fontFamily: selectedBrand?.typography.bodyFont || 'Arial' }}>
                        {selectedBrand?.contact.phone || '(512) 555-0123'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded"
                      style={{ backgroundColor: selectedBrand?.colors.primary || '#1e40af' }}
                    />
                    <div
                      className="w-6 h-6 rounded"
                      style={{ backgroundColor: selectedBrand?.colors.secondary || '#3b82f6' }}
                    />
                    <div
                      className="w-6 h-6 rounded"
                      style={{ backgroundColor: selectedBrand?.colors.accent || '#f59e0b' }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between p-6 border-t border-glass-border">
              <div className="flex items-center gap-2">
                <input type="checkbox" id="setDefault" className="rounded" />
                <label htmlFor="setDefault" className="text-sm text-text-secondary">
                  Set as default brand
                </label>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setIsCreating(false);
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button className="btn-primary flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  {isCreating ? 'Create Brand' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
