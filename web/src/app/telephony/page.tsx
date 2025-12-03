'use client';

import { StatCard } from '@/components/StatCard';
import { DataTable } from '@/components/DataTable';
import { Badge, StatusBadge } from '@/components/Badge';
import { Phone, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

const mockPhoneNumbers = [
  {
    id: '1',
    number: '+1 (480) 555-0123',
    type: 'LOCAL',
    status: 'ACTIVE',
    spamScore: 0.12,
    expectedCallsPerK: 15,
    actualCallsPerK: 14.2,
    assignedTo: 'Q1 Absentee Owners',
    lastHealthCheck: '2024-03-15',
  },
  {
    id: '2',
    number: '+1 (214) 555-0456',
    type: 'LOCAL',
    status: 'ACTIVE',
    spamScore: 0.28,
    expectedCallsPerK: 15,
    actualCallsPerK: 12.8,
    assignedTo: 'Pre-Foreclosure Outreach',
    lastHealthCheck: '2024-03-15',
  },
  {
    id: '3',
    number: '+1 (404) 555-0789',
    type: 'LOCAL',
    status: 'SPAM_FLAGGED',
    spamScore: 0.75,
    expectedCallsPerK: 15,
    actualCallsPerK: 4.2,
    assignedTo: 'High Equity Seniors',
    lastHealthCheck: '2024-03-14',
  },
  {
    id: '4',
    number: '+1 (713) 555-0321',
    type: 'LOCAL',
    status: 'ACTIVE',
    spamScore: 0.08,
    expectedCallsPerK: 15,
    actualCallsPerK: 16.1,
    assignedTo: 'Tax Lien Follow-up',
    lastHealthCheck: '2024-03-15',
  },
  {
    id: '5',
    number: '+1 (800) 555-9999',
    type: 'TOLL_FREE',
    status: 'INACTIVE',
    spamScore: 0.05,
    expectedCallsPerK: 12,
    actualCallsPerK: 0,
    assignedTo: null,
    lastHealthCheck: '2024-03-10',
  },
];

export default function TelephonyPage() {
  const activeNumbers = mockPhoneNumbers.filter(
    (p) => p.status === 'ACTIVE'
  ).length;
  const flaggedNumbers = mockPhoneNumbers.filter(
    (p) => p.status === 'SPAM_FLAGGED'
  ).length;
  const avgSpamScore =
    mockPhoneNumbers.reduce((sum, p) => sum + p.spamScore, 0) /
    mockPhoneNumbers.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Telephony</h1>
          <p className="text-gray-500">
            Manage phone numbers and monitor call health
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="Total Numbers"
          value={mockPhoneNumbers.length}
          icon={Phone}
          color="accent"
        />
        <StatCard
          title="Active"
          value={activeNumbers}
          icon={CheckCircle}
          color="success"
        />
        <StatCard
          title="Spam Flagged"
          value={flaggedNumbers}
          icon={AlertTriangle}
          color="danger"
        />
        <StatCard
          title="Avg Spam Score"
          value={`${(avgSpamScore * 100).toFixed(0)}%`}
          color="warning"
        />
      </div>

      {/* Phone Numbers Table */}
      <DataTable
        columns={[
          {
            header: 'Phone Number',
            accessor: (row) => (
              <div>
                <p className="font-medium text-gray-900 font-mono">
                  {row.number}
                </p>
                <Badge size="sm">{row.type}</Badge>
              </div>
            ),
          },
          {
            header: 'Status',
            accessor: (row) => <StatusBadge status={row.status} />,
          },
          {
            header: 'Spam Score',
            accessor: (row) => (
              <div className="flex items-center">
                <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                  <div
                    className={`h-2 rounded-full ${
                      row.spamScore < 0.3
                        ? 'bg-green-500'
                        : row.spamScore < 0.5
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                    }`}
                    style={{ width: `${row.spamScore * 100}%` }}
                  />
                </div>
                <span
                  className={`text-sm font-medium ${
                    row.spamScore < 0.3
                      ? 'text-green-600'
                      : row.spamScore < 0.5
                      ? 'text-yellow-600'
                      : 'text-red-600'
                  }`}
                >
                  {(row.spamScore * 100).toFixed(0)}%
                </span>
              </div>
            ),
          },
          {
            header: 'Calls/1K',
            accessor: (row) => (
              <div className="text-sm">
                <span
                  className={
                    row.actualCallsPerK >= row.expectedCallsPerK * 0.8
                      ? 'text-green-600'
                      : row.actualCallsPerK >= row.expectedCallsPerK * 0.5
                      ? 'text-yellow-600'
                      : 'text-red-600'
                  }
                >
                  {row.actualCallsPerK.toFixed(1)}
                </span>
                <span className="text-gray-400">
                  {' '}
                  / {row.expectedCallsPerK} expected
                </span>
              </div>
            ),
          },
          {
            header: 'Assigned To',
            accessor: (row) =>
              row.assignedTo || (
                <span className="text-gray-400">Unassigned</span>
              ),
          },
          {
            header: 'Last Check',
            accessor: 'lastHealthCheck',
          },
        ]}
        data={mockPhoneNumbers}
      />

      {/* Health Alerts */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Health Alerts
        </h3>
        <div className="space-y-3">
          <div className="flex items-center p-4 bg-red-50 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-red-500 mr-3" />
            <div>
              <p className="font-medium text-red-800">
                +1 (404) 555-0789 flagged as spam
              </p>
              <p className="text-sm text-red-600">
                Spam score increased to 75%. Consider replacing this number.
              </p>
            </div>
          </div>
          <div className="flex items-center p-4 bg-yellow-50 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-yellow-500 mr-3" />
            <div>
              <p className="font-medium text-yellow-800">
                Call drop detected on +1 (214) 555-0456
              </p>
              <p className="text-sm text-yellow-600">
                Calls down 15% from expected while delivery remains stable.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
