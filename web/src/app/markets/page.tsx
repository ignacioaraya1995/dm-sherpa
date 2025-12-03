'use client';

import { StatCard } from '@/components/StatCard';
import { DataTable } from '@/components/DataTable';
import { Badge } from '@/components/Badge';
import { MapPin, TrendingUp, Home, DollarSign } from 'lucide-react';

// Mock data
const mockMarkets = [
  {
    id: '1',
    name: 'Phoenix Metro',
    state: 'AZ',
    county: 'Maricopa',
    city: 'Phoenix',
    medianPrice: 385000,
    avgDom: 28,
    priceAppreciation: 8.5,
    buyerDensityScore: 0.78,
    propertyCount: 12500,
    activeCampaigns: 3,
  },
  {
    id: '2',
    name: 'Dallas-Fort Worth',
    state: 'TX',
    county: 'Dallas',
    city: 'Dallas',
    medianPrice: 365000,
    avgDom: 32,
    priceAppreciation: 6.2,
    buyerDensityScore: 0.72,
    propertyCount: 18200,
    activeCampaigns: 2,
  },
  {
    id: '3',
    name: 'Atlanta Metro',
    state: 'GA',
    county: 'Fulton',
    city: 'Atlanta',
    medianPrice: 345000,
    avgDom: 35,
    priceAppreciation: 7.8,
    buyerDensityScore: 0.68,
    propertyCount: 15800,
    activeCampaigns: 2,
  },
  {
    id: '4',
    name: 'Houston',
    state: 'TX',
    county: 'Harris',
    city: 'Houston',
    medianPrice: 295000,
    avgDom: 38,
    priceAppreciation: 5.4,
    buyerDensityScore: 0.65,
    propertyCount: 22100,
    activeCampaigns: 1,
  },
  {
    id: '5',
    name: 'Tampa Bay',
    state: 'FL',
    county: 'Hillsborough',
    city: 'Tampa',
    medianPrice: 375000,
    avgDom: 30,
    priceAppreciation: 9.2,
    buyerDensityScore: 0.82,
    propertyCount: 9800,
    activeCampaigns: 1,
  },
];

export default function MarketsPage() {
  const totalProperties = mockMarkets.reduce(
    (sum, m) => sum + m.propertyCount,
    0
  );
  const avgMedianPrice =
    mockMarkets.reduce((sum, m) => sum + m.medianPrice, 0) / mockMarkets.length;
  const avgDom =
    mockMarkets.reduce((sum, m) => sum + m.avgDom, 0) / mockMarkets.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Markets</h1>
          <p className="text-gray-500">
            Analyze market performance and opportunities
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="Active Markets"
          value={mockMarkets.length}
          icon={MapPin}
          color="blue"
        />
        <StatCard
          title="Total Properties"
          value={totalProperties.toLocaleString()}
          icon={Home}
          color="green"
        />
        <StatCard
          title="Avg Median Price"
          value={`$${(avgMedianPrice / 1000).toFixed(0)}K`}
          icon={DollarSign}
          color="yellow"
        />
        <StatCard
          title="Avg Days on Market"
          value={avgDom.toFixed(0)}
          icon={TrendingUp}
          color="purple"
        />
      </div>

      {/* Markets Table */}
      <DataTable
        columns={[
          {
            header: 'Market',
            accessor: (row) => (
              <div>
                <p className="font-medium text-gray-900">{row.name}</p>
                <p className="text-sm text-gray-500">
                  {row.county} County, {row.state}
                </p>
              </div>
            ),
          },
          {
            header: 'Median Price',
            accessor: (row) => `$${row.medianPrice.toLocaleString()}`,
            className: 'text-right',
          },
          {
            header: 'Avg DOM',
            accessor: (row) => `${row.avgDom} days`,
            className: 'text-right',
          },
          {
            header: 'Appreciation',
            accessor: (row) => (
              <span
                className={
                  row.priceAppreciation >= 7
                    ? 'text-green-600'
                    : row.priceAppreciation >= 5
                    ? 'text-yellow-600'
                    : 'text-gray-600'
                }
              >
                +{row.priceAppreciation.toFixed(1)}%
              </span>
            ),
            className: 'text-right',
          },
          {
            header: 'Buyer Density',
            accessor: (row) => (
              <div className="flex items-center justify-end">
                <div className="w-20 bg-gray-200 rounded-full h-2 mr-2">
                  <div
                    className={`h-2 rounded-full ${
                      row.buyerDensityScore >= 0.7
                        ? 'bg-green-500'
                        : row.buyerDensityScore >= 0.5
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                    }`}
                    style={{ width: `${row.buyerDensityScore * 100}%` }}
                  />
                </div>
                <span className="text-sm">
                  {(row.buyerDensityScore * 100).toFixed(0)}%
                </span>
              </div>
            ),
          },
          {
            header: 'Properties',
            accessor: (row) => row.propertyCount.toLocaleString(),
            className: 'text-right',
          },
          {
            header: 'Campaigns',
            accessor: (row) => (
              <Badge variant={row.activeCampaigns > 0 ? 'success' : 'default'}>
                {row.activeCampaigns} active
              </Badge>
            ),
          },
        ]}
        data={mockMarkets}
      />
    </div>
  );
}
