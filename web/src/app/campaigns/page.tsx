'use client';

import { useState } from 'react';
import Link from 'next/link';
import { StatCard } from '@/components/StatCard';
import { DataTable } from '@/components/DataTable';
import { StatusBadge, Badge } from '@/components/Badge';
import { Mail, Plus, Filter, Search } from 'lucide-react';

// Mock data
const mockCampaigns = [
  {
    id: '1',
    name: 'Q1 2024 Absentee Owners - Phoenix',
    type: 'WHOLESALER',
    status: 'ACTIVE',
    goal: 'CONTRACTS',
    totalBudget: 50000,
    spentBudget: 32500,
    totalMailed: 25000,
    totalCalls: 375,
    totalContracts: 25,
    responseRate: 0.015,
    roi: 2.4,
    startDate: '2024-01-15',
  },
  {
    id: '2',
    name: 'Pre-Foreclosure Outreach - Dallas',
    type: 'WHOLESALER',
    status: 'ACTIVE',
    goal: 'CONTRACTS',
    totalBudget: 30000,
    spentBudget: 18000,
    totalMailed: 12000,
    totalCalls: 240,
    totalContracts: 18,
    responseRate: 0.02,
    roi: 3.1,
    startDate: '2024-02-01',
  },
  {
    id: '3',
    name: 'High Equity Seniors - Atlanta',
    type: 'BUY_AND_HOLD',
    status: 'PAUSED',
    goal: 'APPOINTMENTS',
    totalBudget: 40000,
    spentBudget: 28000,
    totalMailed: 20000,
    totalCalls: 240,
    totalContracts: 12,
    responseRate: 0.012,
    roi: 1.8,
    startDate: '2023-11-01',
  },
  {
    id: '4',
    name: 'Tax Lien Follow-up - Houston',
    type: 'FLIPPER',
    status: 'COMPLETED',
    goal: 'CONTRACTS',
    totalBudget: 20000,
    spentBudget: 20000,
    totalMailed: 15000,
    totalCalls: 300,
    totalContracts: 21,
    responseRate: 0.02,
    roi: 2.9,
    startDate: '2023-09-01',
  },
  {
    id: '5',
    name: 'Q4 Check Mailer - Multi-Market',
    type: 'WHOLESALER',
    status: 'DRAFT',
    goal: 'CONTRACTS',
    totalBudget: 75000,
    spentBudget: 0,
    totalMailed: 0,
    totalCalls: 0,
    totalContracts: 0,
    responseRate: 0,
    roi: 0,
    startDate: null,
  },
];

export default function CampaignsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredCampaigns = mockCampaigns.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalMailed = mockCampaigns.reduce((sum, c) => sum + c.totalMailed, 0);
  const totalCalls = mockCampaigns.reduce((sum, c) => sum + c.totalCalls, 0);
  const totalContracts = mockCampaigns.reduce((sum, c) => sum + c.totalContracts, 0);
  const activeCampaigns = mockCampaigns.filter((c) => c.status === 'ACTIVE').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Campaigns</h1>
          <p className="text-text-secondary mt-1">Manage your direct mail campaigns</p>
        </div>
        <button className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New Campaign
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="Active Campaigns"
          value={activeCampaigns}
          icon={Mail}
          color="accent"
        />
        <StatCard
          title="Total Mailed"
          value={totalMailed.toLocaleString()}
          color="success"
        />
        <StatCard
          title="Total Calls"
          value={totalCalls.toLocaleString()}
          color="warning"
        />
        <StatCard
          title="Total Contracts"
          value={totalContracts}
          color="violet"
        />
      </div>

      {/* Filters */}
      <div className="glass-card p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
            <input
              type="text"
              placeholder="Search campaigns..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field w-full pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-text-muted" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-field"
            >
              <option value="all">All Status</option>
              <option value="DRAFT">Draft</option>
              <option value="ACTIVE">Active</option>
              <option value="PAUSED">Paused</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Campaigns Table */}
      <DataTable
        columns={[
          {
            header: 'Campaign',
            accessor: (row) => (
              <div>
                <Link
                  href={`/campaigns/${row.id}`}
                  className="font-medium text-text-primary hover:text-accent transition-colors"
                >
                  {row.name}
                </Link>
                <p className="text-sm text-text-muted">{row.type}</p>
              </div>
            ),
          },
          {
            header: 'Status',
            accessor: (row) => <StatusBadge status={row.status} />,
          },
          {
            header: 'Budget',
            accessor: (row) => (
              <div>
                <div className="font-medium text-text-primary">
                  ${row.spentBudget.toLocaleString()} / ${row.totalBudget.toLocaleString()}
                </div>
                <div className="w-full bg-dark-700 rounded-full h-1.5 mt-1">
                  <div
                    className="bg-accent h-1.5 rounded-full"
                    style={{
                      width: `${(row.spentBudget / row.totalBudget) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ),
          },
          {
            header: 'Mailed',
            accessor: (row) => <span className="text-text-primary">{row.totalMailed.toLocaleString()}</span>,
            className: 'text-right',
          },
          {
            header: 'Calls',
            accessor: (row) => <span className="text-text-primary">{row.totalCalls.toLocaleString()}</span>,
            className: 'text-right',
          },
          {
            header: 'Contracts',
            accessor: (row) => <span className="text-text-primary">{row.totalContracts}</span>,
            className: 'text-right',
          },
          {
            header: 'Response',
            accessor: (row) => (
              <span className="text-text-primary">
                {row.responseRate > 0 ? `${(row.responseRate * 100).toFixed(2)}%` : '-'}
              </span>
            ),
            className: 'text-right',
          },
          {
            header: 'ROI',
            accessor: (row) =>
              row.roi > 0 ? (
                <span className={row.roi >= 2 ? 'text-success font-medium' : 'text-warning'}>
                  {row.roi.toFixed(1)}x
                </span>
              ) : (
                <span className="text-text-muted">-</span>
              ),
            className: 'text-right',
          },
        ]}
        data={filteredCampaigns}
      />
    </div>
  );
}
