'use client';

import { useState } from 'react';
import { StatCard } from '@/components/StatCard';
import { DataTable } from '@/components/DataTable';
import { StatusBadge, Badge } from '@/components/Badge';
import { PipelineChart } from '@/components/Charts';
import { DollarSign, TrendingUp, Clock, Target, Search, Filter } from 'lucide-react';
import { format } from 'date-fns';

// Mock data
const mockDeals = [
  {
    id: '1',
    property: '123 Main St, Phoenix, AZ',
    status: 'CLOSED',
    type: 'WHOLESALE',
    contractPrice: 185000,
    assignmentFee: 12000,
    grossProfit: 12000,
    contractDate: '2024-01-15',
    closeDate: '2024-02-28',
    daysToClose: 44,
    campaign: 'Q1 Absentee Owners',
  },
  {
    id: '2',
    property: '456 Oak Ave, Dallas, TX',
    status: 'UNDER_CONTRACT',
    type: 'WHOLESALE',
    contractPrice: 320000,
    assignmentFee: 18000,
    grossProfit: null,
    contractDate: '2024-03-01',
    closeDate: null,
    daysToClose: null,
    campaign: 'Pre-Foreclosure Outreach',
  },
  {
    id: '3',
    property: '789 Maple Dr, Atlanta, GA',
    status: 'DUE_DILIGENCE',
    type: 'FIX_AND_FLIP',
    contractPrice: 145000,
    assignmentFee: null,
    grossProfit: null,
    contractDate: '2024-03-05',
    closeDate: null,
    daysToClose: null,
    campaign: 'High Equity Seniors',
  },
  {
    id: '4',
    property: '321 Cedar Ln, Houston, TX',
    status: 'PENDING',
    type: 'WHOLESALE',
    contractPrice: 165000,
    assignmentFee: 8500,
    grossProfit: null,
    contractDate: '2024-03-10',
    closeDate: null,
    daysToClose: null,
    campaign: 'Tax Lien Follow-up',
  },
  {
    id: '5',
    property: '555 Pine Rd, Phoenix, AZ',
    status: 'CLOSED',
    type: 'WHOLESALE',
    contractPrice: 425000,
    assignmentFee: 22000,
    grossProfit: 22000,
    contractDate: '2024-01-20',
    closeDate: '2024-03-01',
    daysToClose: 40,
    campaign: 'Q1 Absentee Owners',
  },
  {
    id: '6',
    property: '777 Elm Blvd, Dallas, TX',
    status: 'FELL_THROUGH',
    type: 'WHOLESALE',
    contractPrice: 275000,
    assignmentFee: 15000,
    grossProfit: 0,
    contractDate: '2024-02-01',
    closeDate: null,
    daysToClose: null,
    campaign: 'Pre-Foreclosure Outreach',
  },
];

const mockPipeline = [
  { status: 'Pending', count: 12, value: 1980000 },
  { status: 'Under Contract', count: 8, value: 2560000 },
  { status: 'Due Diligence', count: 5, value: 725000 },
  { status: 'Closed (MTD)', count: 15, value: 2625000 },
];

export default function DealsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredDeals = mockDeals.filter((d) => {
    const matchesSearch = d.property
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || d.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const closedDeals = mockDeals.filter((d) => d.status === 'CLOSED');
  const totalProfit = closedDeals.reduce(
    (sum, d) => sum + (d.grossProfit || 0),
    0
  );
  const avgProfit = closedDeals.length > 0 ? totalProfit / closedDeals.length : 0;
  const avgDaysToClose =
    closedDeals.length > 0
      ? closedDeals.reduce((sum, d) => sum + (d.daysToClose || 0), 0) /
        closedDeals.length
      : 0;
  const pipelineValue = mockDeals
    .filter((d) => !['CLOSED', 'FELL_THROUGH'].includes(d.status))
    .reduce((sum, d) => sum + (d.assignmentFee || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Deals</h1>
          <p className="text-gray-500">Track your deal pipeline and closings</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="Total Profit (MTD)"
          value={`$${totalProfit.toLocaleString()}`}
          icon={DollarSign}
          trend={18.5}
          trendLabel="vs last month"
          color="success"
        />
        <StatCard
          title="Avg Profit/Deal"
          value={`$${avgProfit.toLocaleString()}`}
          icon={TrendingUp}
          color="accent"
        />
        <StatCard
          title="Avg Days to Close"
          value={avgDaysToClose.toFixed(0)}
          icon={Clock}
          color="warning"
        />
        <StatCard
          title="Pipeline Value"
          value={`$${pipelineValue.toLocaleString()}`}
          icon={Target}
          color="violet"
        />
      </div>

      {/* Pipeline Chart */}
      <PipelineChart data={mockPipeline} />

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by property..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="UNDER_CONTRACT">Under Contract</option>
              <option value="DUE_DILIGENCE">Due Diligence</option>
              <option value="CLOSED">Closed</option>
              <option value="FELL_THROUGH">Fell Through</option>
            </select>
          </div>
        </div>
      </div>

      {/* Deals Table */}
      <DataTable
        columns={[
          {
            header: 'Property',
            accessor: (row) => (
              <div>
                <p className="font-medium text-gray-900">{row.property}</p>
                <p className="text-sm text-gray-500">{row.campaign}</p>
              </div>
            ),
          },
          {
            header: 'Status',
            accessor: (row) => <StatusBadge status={row.status} />,
          },
          {
            header: 'Type',
            accessor: (row) => (
              <Badge>{row.type.replace('_', ' ')}</Badge>
            ),
          },
          {
            header: 'Contract Price',
            accessor: (row) => `$${row.contractPrice.toLocaleString()}`,
            className: 'text-right',
          },
          {
            header: 'Assignment Fee',
            accessor: (row) =>
              row.assignmentFee
                ? `$${row.assignmentFee.toLocaleString()}`
                : '-',
            className: 'text-right',
          },
          {
            header: 'Profit',
            accessor: (row) =>
              row.grossProfit !== null ? (
                <span
                  className={
                    row.grossProfit > 0
                      ? 'text-green-600 font-medium'
                      : 'text-red-600'
                  }
                >
                  ${row.grossProfit.toLocaleString()}
                </span>
              ) : (
                '-'
              ),
            className: 'text-right',
          },
          {
            header: 'Contract Date',
            accessor: (row) =>
              row.contractDate
                ? format(new Date(row.contractDate), 'MMM d, yyyy')
                : '-',
          },
          {
            header: 'Close Date',
            accessor: (row) =>
              row.closeDate
                ? format(new Date(row.closeDate), 'MMM d, yyyy')
                : '-',
          },
          {
            header: 'Days',
            accessor: (row) => (row.daysToClose ? row.daysToClose : '-'),
            className: 'text-right',
          },
        ]}
        data={filteredDeals}
      />
    </div>
  );
}
