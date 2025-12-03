'use client';

import { useQuery } from '@tanstack/react-query';
import { StatCard } from '@/components/StatCard';
import { DataTable } from '@/components/DataTable';
import { StatusBadge, Badge } from '@/components/Badge';
import { getAccounts, type Account } from '@/lib/api';
import { Users, Building2, Mail, DollarSign, Plus } from 'lucide-react';

// Fallback mock data
const mockAccounts = [
  {
    id: '1',
    name: 'Phoenix Wholesale Group',
    type: 'WHOLESALER',
    status: 'ACTIVE',
    createdAt: '2023-06-15',
    _count: { users: 5, campaigns: 8, deals: 42 },
  },
  {
    id: '2',
    name: 'DFW Flip Masters',
    type: 'FLIPPER',
    status: 'ACTIVE',
    createdAt: '2023-08-01',
    _count: { users: 3, campaigns: 4, deals: 18 },
  },
  {
    id: '3',
    name: 'Atlanta Home Buyers',
    type: 'BUY_AND_HOLD',
    status: 'ACTIVE',
    createdAt: '2023-09-10',
    _count: { users: 4, campaigns: 6, deals: 28 },
  },
  {
    id: '4',
    name: 'Texas Roofing Pros',
    type: 'ROOFER',
    status: 'ACTIVE',
    createdAt: '2024-01-05',
    _count: { users: 2, campaigns: 2, deals: 8 },
  },
];

export default function AccountsPage() {
  const { data: accountsData, isLoading } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => getAccounts(1, 20),
  });

  const accounts = accountsData?.data || mockAccounts;

  const totalUsers = accounts.reduce((sum, a) => sum + (a._count?.users || 0), 0);
  const totalCampaigns = accounts.reduce(
    (sum, a) => sum + (a._count?.campaigns || 0),
    0
  );
  const totalDeals = accounts.reduce((sum, a) => sum + (a._count?.deals || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Accounts</h1>
          <p className="text-gray-500">Manage your organization accounts</p>
        </div>
        <button className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
          <Plus className="h-5 w-5 mr-2" />
          New Account
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="Total Accounts"
          value={accounts.length}
          icon={Building2}
          color="blue"
        />
        <StatCard
          title="Total Users"
          value={totalUsers}
          icon={Users}
          color="green"
        />
        <StatCard
          title="Total Campaigns"
          value={totalCampaigns}
          icon={Mail}
          color="yellow"
        />
        <StatCard
          title="Total Deals"
          value={totalDeals}
          icon={DollarSign}
          color="purple"
        />
      </div>

      {/* Accounts Table */}
      <DataTable
        columns={[
          {
            header: 'Account',
            accessor: (row) => (
              <div>
                <p className="font-medium text-gray-900">{row.name}</p>
                <Badge size="sm">{row.type.replace('_', ' ')}</Badge>
              </div>
            ),
          },
          {
            header: 'Status',
            accessor: (row) => <StatusBadge status={row.status} />,
          },
          {
            header: 'Users',
            accessor: (row) => row._count?.users || 0,
            className: 'text-right',
          },
          {
            header: 'Campaigns',
            accessor: (row) => row._count?.campaigns || 0,
            className: 'text-right',
          },
          {
            header: 'Deals',
            accessor: (row) => row._count?.deals || 0,
            className: 'text-right',
          },
          {
            header: 'Created',
            accessor: (row) =>
              new Date(row.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              }),
          },
        ]}
        data={accounts}
        isLoading={isLoading}
      />
    </div>
  );
}
