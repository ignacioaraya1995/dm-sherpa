'use client';

import { useState } from 'react';
import { StatCard } from '@/components/StatCard';
import { DataTable } from '@/components/DataTable';
import { Badge } from '@/components/Badge';
import { Building2, Search, Filter, MapPin, AlertTriangle } from 'lucide-react';

// Mock data
const mockProperties = [
  {
    id: '1',
    streetAddress: '123 Main St',
    city: 'Phoenix',
    state: 'AZ',
    zipCode: '85001',
    propertyType: 'SINGLE_FAMILY',
    beds: 3,
    baths: 2,
    sqft: 1800,
    avmValue: 285000,
    arvValue: 320000,
    priceBand: 'BAND_200_300K',
    motivationScore: 0.85,
    dispoScore: 0.72,
    isVacant: false,
    isAbsenteeOwner: true,
    distressFlags: ['PRE_FORECLOSURE', 'TAX_LIEN'],
  },
  {
    id: '2',
    streetAddress: '456 Oak Ave',
    city: 'Dallas',
    state: 'TX',
    zipCode: '75201',
    propertyType: 'SINGLE_FAMILY',
    beds: 4,
    baths: 2.5,
    sqft: 2200,
    avmValue: 425000,
    arvValue: 480000,
    priceBand: 'BAND_300_500K',
    motivationScore: 0.65,
    dispoScore: 0.58,
    isVacant: true,
    isAbsenteeOwner: true,
    distressFlags: ['VACANT', 'ABSENTEE'],
  },
  {
    id: '3',
    streetAddress: '789 Maple Dr',
    city: 'Atlanta',
    state: 'GA',
    zipCode: '30301',
    propertyType: 'TOWNHOUSE',
    beds: 2,
    baths: 2,
    sqft: 1400,
    avmValue: 195000,
    arvValue: 220000,
    priceBand: 'BAND_100_200K',
    motivationScore: 0.92,
    dispoScore: 0.88,
    isVacant: false,
    isAbsenteeOwner: false,
    distressFlags: ['PROBATE'],
  },
  {
    id: '4',
    streetAddress: '321 Cedar Ln',
    city: 'Houston',
    state: 'TX',
    zipCode: '77001',
    propertyType: 'SINGLE_FAMILY',
    beds: 3,
    baths: 2,
    sqft: 1650,
    avmValue: 175000,
    arvValue: 210000,
    priceBand: 'BAND_100_200K',
    motivationScore: 0.78,
    dispoScore: 0.82,
    isVacant: false,
    isAbsenteeOwner: true,
    distressFlags: ['HIGH_EQUITY', 'TIRED_LANDLORD'],
  },
  {
    id: '5',
    streetAddress: '555 Pine Rd',
    city: 'Phoenix',
    state: 'AZ',
    zipCode: '85004',
    propertyType: 'MULTI_FAMILY',
    beds: 6,
    baths: 4,
    sqft: 3200,
    avmValue: 520000,
    arvValue: 580000,
    priceBand: 'BAND_500K_PLUS',
    motivationScore: 0.55,
    dispoScore: 0.45,
    isVacant: false,
    isAbsenteeOwner: true,
    distressFlags: ['CODE_VIOLATION'],
  },
];

const distressColors: Record<string, string> = {
  PRE_FORECLOSURE: 'danger',
  FORECLOSURE: 'danger',
  PROBATE: 'warning',
  TAX_LIEN: 'danger',
  DIVORCE: 'warning',
  CODE_VIOLATION: 'warning',
  EVICTION: 'warning',
  BANKRUPTCY: 'danger',
  VACANT: 'cyan',
  ABSENTEE: 'neutral',
  HIGH_EQUITY: 'success',
  TIRED_LANDLORD: 'cyan',
};

export default function PropertiesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [distressFilter, setDistressFilter] = useState<string>('all');

  const filteredProperties = mockProperties.filter((p) => {
    const matchesSearch =
      p.streetAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.city.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDistress =
      distressFilter === 'all' || p.distressFlags.includes(distressFilter);
    return matchesSearch && matchesDistress;
  });

  const totalValue = mockProperties.reduce((sum, p) => sum + p.avmValue, 0);
  const avgMotivation =
    mockProperties.reduce((sum, p) => sum + p.motivationScore, 0) /
    mockProperties.length;
  const distressedCount = mockProperties.filter(
    (p) => p.distressFlags.length > 0
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Properties</h1>
          <p className="text-text-secondary mt-1">
            Browse and manage your property database
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="Total Properties"
          value={mockProperties.length.toLocaleString()}
          icon={Building2}
          color="accent"
        />
        <StatCard
          title="Total Value"
          value={`$${(totalValue / 1000000).toFixed(1)}M`}
          color="success"
        />
        <StatCard
          title="Avg Motivation"
          value={`${(avgMotivation * 100).toFixed(0)}%`}
          color="warning"
        />
        <StatCard
          title="Distressed"
          value={distressedCount}
          icon={AlertTriangle}
          color="danger"
        />
      </div>

      {/* Filters */}
      <div className="glass-card p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
            <input
              type="text"
              placeholder="Search by address or city..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field w-full pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-text-muted" />
            <select
              value={distressFilter}
              onChange={(e) => setDistressFilter(e.target.value)}
              className="input-field"
            >
              <option value="all">All Distress Types</option>
              <option value="PRE_FORECLOSURE">Pre-Foreclosure</option>
              <option value="PROBATE">Probate</option>
              <option value="TAX_LIEN">Tax Lien</option>
              <option value="VACANT">Vacant</option>
              <option value="HIGH_EQUITY">High Equity</option>
            </select>
          </div>
        </div>
      </div>

      {/* Properties Table */}
      <DataTable
        columns={[
          {
            header: 'Property',
            accessor: (row) => (
              <div>
                <p className="font-medium text-text-primary">{row.streetAddress}</p>
                <p className="text-sm text-text-muted flex items-center">
                  <MapPin className="w-3 h-3 mr-1" />
                  {row.city}, {row.state} {row.zipCode}
                </p>
              </div>
            ),
          },
          {
            header: 'Details',
            accessor: (row) => (
              <div className="text-sm">
                <p className="text-text-primary">{row.propertyType.replace('_', ' ')}</p>
                <p className="text-text-muted">
                  {row.beds}bd / {row.baths}ba / {row.sqft.toLocaleString()}sf
                </p>
              </div>
            ),
          },
          {
            header: 'AVM / ARV',
            accessor: (row) => (
              <div className="text-sm">
                <p className="font-medium text-text-primary">${row.avmValue.toLocaleString()}</p>
                <p className="text-text-muted">
                  ARV: ${row.arvValue.toLocaleString()}
                </p>
              </div>
            ),
            className: 'text-right',
          },
          {
            header: 'Scores',
            accessor: (row) => (
              <div className="text-sm space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-text-muted">Motivation:</span>
                  <span
                    className={`font-medium ${
                      row.motivationScore >= 0.7
                        ? 'text-success'
                        : row.motivationScore >= 0.5
                        ? 'text-warning'
                        : 'text-text-muted'
                    }`}
                  >
                    {(row.motivationScore * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-muted">Dispo:</span>
                  <span
                    className={`font-medium ${
                      row.dispoScore >= 0.7
                        ? 'text-success'
                        : row.dispoScore >= 0.5
                        ? 'text-warning'
                        : 'text-text-muted'
                    }`}
                  >
                    {(row.dispoScore * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            ),
          },
          {
            header: 'Flags',
            accessor: (row) => (
              <div className="flex flex-wrap gap-1">
                {row.isVacant && <Badge variant="cyan">Vacant</Badge>}
                {row.isAbsenteeOwner && <Badge variant="neutral">Absentee</Badge>}
              </div>
            ),
          },
          {
            header: 'Distress',
            accessor: (row) => (
              <div className="flex flex-wrap gap-1">
                {row.distressFlags.map((flag) => (
                  <Badge
                    key={flag}
                    variant={distressColors[flag] as any}
                    size="sm"
                  >
                    {flag.replace('_', ' ')}
                  </Badge>
                ))}
              </div>
            ),
          },
        ]}
        data={filteredProperties}
      />
    </div>
  );
}
