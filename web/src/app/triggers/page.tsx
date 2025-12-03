'use client';

import { StatCard } from '@/components/StatCard';
import { DataTable } from '@/components/DataTable';
import { Badge } from '@/components/Badge';
import { Zap, Play, Pause, CheckCircle, Plus } from 'lucide-react';

const mockTriggers = [
  {
    id: '1',
    name: 'New Pre-Foreclosure Alert',
    description: 'Trigger when new pre-foreclosure is detected in active markets',
    triggerType: 'DISTRESS_FLAG_ADDED',
    actionType: 'ADD_TO_SEGMENT',
    isActive: true,
    totalTriggered: 245,
    lastTriggered: '2024-03-15T10:30:00Z',
  },
  {
    id: '2',
    name: 'High Motivation Score',
    description: 'Add to priority queue when motivation score exceeds 85%',
    triggerType: 'SCORE_THRESHOLD',
    actionType: 'ADD_TO_SEGMENT',
    isActive: true,
    totalTriggered: 128,
    lastTriggered: '2024-03-15T09:15:00Z',
  },
  {
    id: '3',
    name: 'Call Outcome - Appointment Set',
    description: 'Create deal when appointment is set from qualified call',
    triggerType: 'CALL_OUTCOME',
    actionType: 'CREATE_DEAL',
    isActive: true,
    totalTriggered: 89,
    lastTriggered: '2024-03-14T16:45:00Z',
  },
  {
    id: '4',
    name: 'Phone Spam Alert',
    description: 'Notify team when phone number spam score exceeds 50%',
    triggerType: 'PHONE_HEALTH',
    actionType: 'NOTIFICATION',
    isActive: true,
    totalTriggered: 12,
    lastTriggered: '2024-03-14T11:20:00Z',
  },
  {
    id: '5',
    name: 'Campaign Budget Alert',
    description: 'Notify when campaign reaches 80% of budget',
    triggerType: 'BUDGET_THRESHOLD',
    actionType: 'NOTIFICATION',
    isActive: false,
    totalTriggered: 45,
    lastTriggered: '2024-03-10T14:00:00Z',
  },
];

export default function TriggersPage() {
  const activeTriggers = mockTriggers.filter((t) => t.isActive).length;
  const totalTriggered = mockTriggers.reduce(
    (sum, t) => sum + t.totalTriggered,
    0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Triggers</h1>
          <p className="text-gray-500">
            Automate actions based on events and conditions
          </p>
        </div>
        <button className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
          <Plus className="h-5 w-5 mr-2" />
          New Trigger
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="Total Triggers"
          value={mockTriggers.length}
          icon={Zap}
          color="blue"
        />
        <StatCard
          title="Active"
          value={activeTriggers}
          icon={Play}
          color="green"
        />
        <StatCard
          title="Total Executions"
          value={totalTriggered}
          icon={CheckCircle}
          color="purple"
        />
        <StatCard
          title="Today's Executions"
          value="47"
          color="yellow"
        />
      </div>

      {/* Triggers Table */}
      <DataTable
        columns={[
          {
            header: 'Trigger',
            accessor: (row) => (
              <div>
                <p className="font-medium text-gray-900">{row.name}</p>
                <p className="text-sm text-gray-500">{row.description}</p>
              </div>
            ),
          },
          {
            header: 'Type',
            accessor: (row) => (
              <Badge>{row.triggerType.replace(/_/g, ' ')}</Badge>
            ),
          },
          {
            header: 'Action',
            accessor: (row) => (
              <Badge variant="info">{row.actionType.replace(/_/g, ' ')}</Badge>
            ),
          },
          {
            header: 'Status',
            accessor: (row) =>
              row.isActive ? (
                <span className="inline-flex items-center text-green-600">
                  <Play className="h-4 w-4 mr-1" />
                  Active
                </span>
              ) : (
                <span className="inline-flex items-center text-gray-400">
                  <Pause className="h-4 w-4 mr-1" />
                  Paused
                </span>
              ),
          },
          {
            header: 'Executions',
            accessor: 'totalTriggered',
            className: 'text-right',
          },
          {
            header: 'Last Triggered',
            accessor: (row) =>
              new Date(row.lastTriggered).toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              }),
          },
        ]}
        data={mockTriggers}
      />
    </div>
  );
}
