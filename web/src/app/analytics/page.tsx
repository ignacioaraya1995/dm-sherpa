'use client';

import { StatCard } from '@/components/StatCard';
import { TrendChart, DonutChart } from '@/components/Charts';
import {
  TrendingUp,
  DollarSign,
  Target,
  Clock,
  BarChart3,
  PieChart,
} from 'lucide-react';

// Mock data
const performanceTrends = [
  { date: 'Jan', mailed: 12000, calls: 180, contracts: 12, profit: 84000 },
  { date: 'Feb', mailed: 15000, calls: 225, contracts: 15, profit: 105000 },
  { date: 'Mar', mailed: 18000, calls: 270, contracts: 18, profit: 126000 },
  { date: 'Apr', mailed: 14000, calls: 210, contracts: 14, profit: 98000 },
  { date: 'May', mailed: 20000, calls: 300, contracts: 20, profit: 140000 },
  { date: 'Jun', mailed: 22000, calls: 330, contracts: 22, profit: 154000 },
];

const dealTypeDistribution = [
  { name: 'Wholesale', value: 65 },
  { name: 'Fix & Flip', value: 20 },
  { name: 'Buy & Hold', value: 10 },
  { name: 'Turnkey', value: 5 },
];

const distressTypePerformance = [
  { name: 'Pre-Foreclosure', value: 32 },
  { name: 'Probate', value: 24 },
  { name: 'Tax Lien', value: 18 },
  { name: 'High Equity', value: 15 },
  { name: 'Other', value: 11 },
];

const cashCycleData = [
  { stage: 'Mail to Lead', days: 21, label: '21 days' },
  { stage: 'Lead to Contract', days: 7, label: '7 days' },
  { stage: 'Contract to Close', days: 35, label: '35 days' },
  { stage: 'Close to Cash', days: 3, label: '3 days' },
];

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-500">
            Deep dive into your performance metrics
          </p>
        </div>
        <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
          <option>Last 6 Months</option>
          <option>Last 3 Months</option>
          <option>Last 12 Months</option>
          <option>Year to Date</option>
        </select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Overall ROI"
          value="2.4x"
          icon={TrendingUp}
          trend={15.2}
          trendLabel="vs last period"
          color="success"
        />
        <StatCard
          title="Cost per Contract"
          value="$856"
          icon={DollarSign}
          trend={-8.3}
          trendLabel="improvement"
          color="accent"
        />
        <StatCard
          title="Contract Rate"
          value="0.11%"
          icon={Target}
          trend={12.5}
          trendLabel="vs last period"
          color="warning"
        />
        <StatCard
          title="Avg Cash Cycle"
          value="66 days"
          icon={Clock}
          trend={-5.2}
          trendLabel="faster"
          color="violet"
        />
      </div>

      {/* Performance Trend */}
      <TrendChart data={performanceTrends} />

      {/* Distribution Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DonutChart data={dealTypeDistribution} title="Deals by Type" />
        <DonutChart
          data={distressTypePerformance}
          title="Contracts by Distress Type"
        />
      </div>

      {/* Cash Cycle Breakdown */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">
          Cash Cycle Breakdown
        </h3>
        <div className="flex items-center justify-between">
          {cashCycleData.map((item, index) => (
            <div key={item.stage} className="flex-1 text-center">
              <div className="relative">
                <div className="w-16 h-16 mx-auto rounded-full bg-primary-100 flex items-center justify-center">
                  <span className="text-xl font-bold text-primary-600">
                    {item.days}
                  </span>
                </div>
                {index < cashCycleData.length - 1 && (
                  <div className="absolute top-1/2 left-full w-full h-0.5 bg-gray-200 -translate-y-1/2 -translate-x-8" />
                )}
              </div>
              <p className="mt-3 text-sm font-medium text-gray-900">
                {item.stage}
              </p>
              <p className="text-xs text-gray-500">{item.label}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 pt-6 border-t border-gray-100">
          <div className="flex items-center justify-center">
            <span className="text-sm text-gray-500 mr-2">Total Cycle:</span>
            <span className="text-2xl font-bold text-gray-900">
              {cashCycleData.reduce((sum, item) => sum + item.days, 0)} days
            </span>
          </div>
        </div>
      </div>

      {/* Attribution Analysis */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Attribution Analysis
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-600 font-medium">First Touch</p>
            <p className="text-2xl font-bold text-blue-900 mt-1">68%</p>
            <p className="text-sm text-blue-600 mt-1">
              Deals from first mailer
            </p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-green-600 font-medium">Multi-Touch</p>
            <p className="text-2xl font-bold text-green-900 mt-1">24%</p>
            <p className="text-sm text-green-600 mt-1">Deals from 2-3 touches</p>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg">
            <p className="text-sm text-purple-600 font-medium">Long Tail</p>
            <p className="text-2xl font-bold text-purple-900 mt-1">8%</p>
            <p className="text-sm text-purple-600 mt-1">Deals from 4+ touches</p>
          </div>
        </div>
      </div>

      {/* Variant Performance */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Top Performing Variants
        </h3>
        <div className="space-y-4">
          {[
            {
              name: 'Check Letter - 75% Offer',
              responseRate: 1.8,
              contractRate: 0.14,
              roi: 3.2,
            },
            {
              name: 'Yellow Letter - Pre-Foreclosure',
              responseRate: 2.1,
              contractRate: 0.12,
              roi: 2.8,
            },
            {
              name: 'Postcard - High Equity',
              responseRate: 1.2,
              contractRate: 0.08,
              roi: 2.4,
            },
            {
              name: 'Generic Letter - Absentee',
              responseRate: 1.5,
              contractRate: 0.1,
              roi: 2.1,
            },
          ].map((variant, index) => (
            <div
              key={variant.name}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center">
                <span className="w-8 h-8 flex items-center justify-center bg-primary-100 text-primary-600 rounded-full font-medium text-sm">
                  {index + 1}
                </span>
                <span className="ml-3 font-medium text-gray-900">
                  {variant.name}
                </span>
              </div>
              <div className="flex items-center space-x-8">
                <div className="text-right">
                  <p className="text-sm text-gray-500">Response</p>
                  <p className="font-medium">{variant.responseRate}%</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Contract</p>
                  <p className="font-medium">{variant.contractRate}%</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">ROI</p>
                  <p className="font-medium text-green-600">{variant.roi}x</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
