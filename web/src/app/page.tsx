'use client';

import { useQuery } from '@tanstack/react-query';
import { StatCard } from '@/components/StatCard';
import { TrendChart, PipelineChart } from '@/components/Charts';
import { DataTable } from '@/components/DataTable';
import { StatusBadge } from '@/components/Badge';
import { getAccounts, getHealth, type Account } from '@/lib/api';
import {
  Mail,
  Phone,
  FileCheck,
  DollarSign,
  TrendingUp,
  Target,
  Clock,
  BarChart3,
} from 'lucide-react';

// Mock data for demo
const mockTrends = [
  { date: 'Jan', mailed: 12000, calls: 180, contracts: 12, profit: 84000 },
  { date: 'Feb', mailed: 15000, calls: 225, contracts: 15, profit: 105000 },
  { date: 'Mar', mailed: 18000, calls: 270, contracts: 18, profit: 126000 },
  { date: 'Apr', mailed: 14000, calls: 210, contracts: 14, profit: 98000 },
  { date: 'May', mailed: 20000, calls: 300, contracts: 20, profit: 140000 },
  { date: 'Jun', mailed: 22000, calls: 330, contracts: 22, profit: 154000 },
];

const mockPipeline = [
  { status: 'Pending', count: 45, value: 2250000 },
  { status: 'Under Contract', count: 28, value: 1400000 },
  { status: 'Due Diligence', count: 15, value: 750000 },
  { status: 'Closed', count: 89, value: 4450000 },
];

const mockCampaigns = [
  { id: '1', name: 'Q1 Absentee Owners', status: 'ACTIVE', mailed: 15000, calls: 225, contracts: 15, roi: 2.4 },
  { id: '2', name: 'Pre-Foreclosure Outreach', status: 'ACTIVE', mailed: 8000, calls: 160, contracts: 12, roi: 3.1 },
  { id: '3', name: 'High Equity Seniors', status: 'PAUSED', mailed: 12000, calls: 144, contracts: 8, roi: 1.8 },
  { id: '4', name: 'Tax Lien Follow-up', status: 'COMPLETED', mailed: 5000, calls: 100, contracts: 7, roi: 2.9 },
];

export default function DashboardPage() {
  const { data: health } = useQuery({
    queryKey: ['health'],
    queryFn: getHealth,
  });

  const { data: accountsData } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => getAccounts(1, 10),
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500">
            Overview of your direct mail performance
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              health?.status === 'ok'
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            <span
              className={`w-2 h-2 mr-1.5 rounded-full ${
                health?.status === 'ok' ? 'bg-green-500' : 'bg-red-500'
              }`}
            />
            System {health?.status === 'ok' ? 'Healthy' : 'Error'}
          </span>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Mailed"
          value="101,000"
          subtitle="Last 6 months"
          icon={Mail}
          trend={12.5}
          trendLabel="vs last period"
          color="blue"
        />
        <StatCard
          title="Total Calls"
          value="1,515"
          subtitle="1.5% response rate"
          icon={Phone}
          trend={8.2}
          trendLabel="vs last period"
          color="green"
        />
        <StatCard
          title="Contracts"
          value="101"
          subtitle="6.7% of calls"
          icon={FileCheck}
          trend={15.3}
          trendLabel="vs last period"
          color="yellow"
        />
        <StatCard
          title="Gross Profit"
          value="$707K"
          subtitle="$7K avg per deal"
          icon={DollarSign}
          trend={22.1}
          trendLabel="vs last period"
          color="purple"
        />
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Response Rate"
          value="1.5%"
          icon={TrendingUp}
          color="blue"
        />
        <StatCard
          title="Contract Rate"
          value="0.1%"
          icon={Target}
          color="green"
        />
        <StatCard
          title="Cost per Contract"
          value="$850"
          icon={BarChart3}
          color="yellow"
        />
        <StatCard
          title="Avg Days to Close"
          value="42"
          icon={Clock}
          color="purple"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TrendChart data={mockTrends} />
        </div>
        <PipelineChart data={mockPipeline} />
      </div>

      {/* Active Campaigns Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Active Campaigns
        </h3>
        <DataTable
          columns={[
            { header: 'Campaign', accessor: 'name' },
            {
              header: 'Status',
              accessor: (row) => <StatusBadge status={row.status} />,
            },
            {
              header: 'Mailed',
              accessor: (row) => row.mailed.toLocaleString(),
              className: 'text-right',
            },
            {
              header: 'Calls',
              accessor: (row) => row.calls.toLocaleString(),
              className: 'text-right',
            },
            {
              header: 'Contracts',
              accessor: 'contracts',
              className: 'text-right',
            },
            {
              header: 'ROI',
              accessor: (row) => (
                <span
                  className={
                    row.roi >= 2 ? 'text-green-600' : 'text-yellow-600'
                  }
                >
                  {row.roi.toFixed(1)}x
                </span>
              ),
              className: 'text-right',
            },
          ]}
          data={mockCampaigns}
        />
      </div>

      {/* Account Summary */}
      {accountsData?.data && accountsData.data.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Accounts
          </h3>
          <DataTable
            columns={[
              { header: 'Name', accessor: 'name' },
              { header: 'Type', accessor: 'type' },
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
            ]}
            data={accountsData.data}
          />
        </div>
      )}
    </div>
  );
}
