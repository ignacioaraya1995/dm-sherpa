'use client';

import { useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Bell,
  CheckCircle2,
  Clock,
  ExternalLink,
  Phone,
  PhoneCall,
  PhoneIncoming,
  PhoneMissed,
  PhoneOff,
  RefreshCw,
  Server,
  Settings,
  Shield,
  Signal,
  Wifi,
  XCircle,
} from 'lucide-react';
import { StatCard } from '@/components/StatCard';
import { Badge, HealthBadge, StatusBadge } from '@/components/Badge';
import { TrendChart, GaugeChart, Sparkline } from '@/components/Charts';
import clsx from 'clsx';

// Mock data
const phoneNumbers = [
  {
    id: '1',
    number: '(512) 555-0101',
    campaign: 'Austin Q4 Absentee',
    status: 'healthy' as const,
    spamScore: 12,
    callsToday: 24,
    lastCall: '5 min ago',
    carrier: 'Twilio',
    verified: true,
  },
  {
    id: '2',
    number: '(512) 555-0102',
    campaign: 'Austin Q4 Probate',
    status: 'healthy' as const,
    spamScore: 8,
    callsToday: 18,
    lastCall: '12 min ago',
    carrier: 'Twilio',
    verified: true,
  },
  {
    id: '3',
    number: '(713) 555-0201',
    campaign: 'Houston Tax Liens',
    status: 'warning' as const,
    spamScore: 45,
    callsToday: 6,
    lastCall: '2 hours ago',
    carrier: 'Twilio',
    verified: true,
  },
  {
    id: '4',
    number: '(713) 555-0202',
    campaign: 'Houston Pre-Foreclosure',
    status: 'warning' as const,
    spamScore: 52,
    callsToday: 3,
    lastCall: '4 hours ago',
    carrier: 'Twilio',
    verified: false,
  },
  {
    id: '5',
    number: '(214) 555-0301',
    campaign: 'Dallas Absentee',
    status: 'healthy' as const,
    spamScore: 15,
    callsToday: 31,
    lastCall: '2 min ago',
    carrier: 'Bandwidth',
    verified: true,
  },
  {
    id: '6',
    number: '(214) 555-0302',
    campaign: 'Dallas Inherited',
    status: 'critical' as const,
    spamScore: 78,
    callsToday: 0,
    lastCall: '2 days ago',
    carrier: 'Bandwidth',
    verified: false,
  },
];

const serviceStatus = [
  { name: 'Twilio Voice', status: 'operational' as const, latency: '45ms' },
  { name: 'Call Tracking', status: 'operational' as const, latency: '12ms' },
  { name: 'SMS Gateway', status: 'operational' as const, latency: '38ms' },
  { name: 'Voicemail Service', status: 'degraded' as const, latency: '250ms' },
  { name: 'Recording Storage', status: 'operational' as const, latency: '85ms' },
];

const recentAlerts = [
  {
    id: '1',
    type: 'spam',
    message: '(214) 555-0302 marked as spam by T-Mobile',
    time: '2 hours ago',
    severity: 'critical' as const,
    resolved: false,
  },
  {
    id: '2',
    type: 'verification',
    message: '(713) 555-0202 requires business verification',
    time: '6 hours ago',
    severity: 'warning' as const,
    resolved: false,
  },
  {
    id: '3',
    type: 'routing',
    message: 'Call routing restored for Austin campaigns',
    time: '1 day ago',
    severity: 'info' as const,
    resolved: true,
  },
];

const callVolumeData = [
  { time: '6am', calls: 2 },
  { time: '8am', calls: 8 },
  { time: '10am', calls: 24 },
  { time: '12pm', calls: 18 },
  { time: '2pm', calls: 32 },
  { time: '4pm', calls: 28 },
  { time: '6pm', calls: 15 },
  { time: '8pm', calls: 5 },
];

export default function HealthMonitorPage() {
  const [selectedNumber, setSelectedNumber] = useState<string | null>(null);

  const healthyNumbers = phoneNumbers.filter(p => p.status === 'healthy').length;
  const warningNumbers = phoneNumbers.filter(p => p.status === 'warning').length;
  const criticalNumbers = phoneNumbers.filter(p => p.status === 'critical').length;
  const totalCalls = phoneNumbers.reduce((sum, p) => sum + p.callsToday, 0);

  const getSpamScoreColor = (score: number) => {
    if (score <= 20) return 'text-success';
    if (score <= 40) return 'text-warning';
    return 'text-danger';
  };

  const getSpamScoreBg = (score: number) => {
    if (score <= 20) return 'bg-success';
    if (score <= 40) return 'bg-warning';
    return 'bg-danger';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Health Monitor</h1>
          <p className="text-text-secondary mt-1">
            Phone number health, routing validation, and infrastructure status
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn-secondary flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Alert Settings
          </button>
          <button className="btn-primary flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Run Health Check
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          title="Active Lines"
          value={`${healthyNumbers}/${phoneNumbers.length}`}
          subtitle="Phone numbers operational"
          icon={Phone}
          color="success"
        />
        <StatCard
          title="Calls Today"
          value={totalCalls}
          trend={12.5}
          trendLabel="vs yesterday"
          icon={PhoneIncoming}
          color="cyan"
        />
        <StatCard
          title="Avg Spam Score"
          value="28"
          subtitle="Target: below 30"
          icon={Shield}
          color="warning"
        />
        <StatCard
          title="Unresolved Alerts"
          value={recentAlerts.filter(a => !a.resolved).length}
          subtitle="Requires attention"
          icon={AlertTriangle}
          color="danger"
        />
      </div>

      {/* Critical Alert Banner */}
      {criticalNumbers > 0 && (
        <div className="glass-card p-4 border-l-4 border-danger flex items-center gap-4">
          <div className="p-2 rounded-lg bg-danger-muted">
            <PhoneOff className="w-5 h-5 text-danger" />
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-text-primary">
              {criticalNumbers} phone number{criticalNumbers > 1 ? 's' : ''} blocked or flagged
            </h3>
            <p className="text-sm text-text-secondary">
              These numbers may not be receiving calls. Immediate action required.
            </p>
          </div>
          <button className="btn-secondary text-sm">View Details</button>
        </div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-12 gap-6">
        {/* Phone Numbers Table */}
        <div className="col-span-8">
          <div className="glass-card overflow-hidden">
            <div className="px-6 py-4 border-b border-glass-border flex items-center justify-between">
              <h3 className="font-semibold text-text-primary">Phone Numbers</h3>
              <div className="flex items-center gap-2">
                <Badge variant="success">{healthyNumbers} Healthy</Badge>
                <Badge variant="warning">{warningNumbers} Warning</Badge>
                <Badge variant="danger">{criticalNumbers} Critical</Badge>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Number</th>
                    <th>Campaign</th>
                    <th>Status</th>
                    <th>Spam Score</th>
                    <th>Calls Today</th>
                    <th>Last Call</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {phoneNumbers.map((phone) => (
                    <tr key={phone.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className={clsx(
                            'w-2 h-2 rounded-full',
                            phone.status === 'healthy' && 'bg-success',
                            phone.status === 'warning' && 'bg-warning',
                            phone.status === 'critical' && 'bg-danger'
                          )} />
                          <div>
                            <span className="font-medium text-text-primary">{phone.number}</span>
                            <div className="flex items-center gap-1 mt-0.5">
                              <span className="text-xs text-text-muted">{phone.carrier}</span>
                              {phone.verified && (
                                <CheckCircle2 className="w-3 h-3 text-success" />
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="text-text-secondary">{phone.campaign}</span>
                      </td>
                      <td>
                        <HealthBadge status={phone.status} />
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-dark-700 rounded-full overflow-hidden">
                            <div
                              className={clsx('h-full rounded-full', getSpamScoreBg(phone.spamScore))}
                              style={{ width: `${phone.spamScore}%` }}
                            />
                          </div>
                          <span className={clsx('text-sm font-medium', getSpamScoreColor(phone.spamScore))}>
                            {phone.spamScore}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className="text-text-primary font-medium">{phone.callsToday}</span>
                      </td>
                      <td>
                        <span className="text-text-muted text-sm">{phone.lastCall}</span>
                      </td>
                      <td>
                        <button className="btn-ghost p-2">
                          <Settings className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Call Volume Chart */}
          <div className="glass-card p-6 mt-6">
            <h3 className="font-semibold text-text-primary mb-4">Call Volume Today</h3>
            <div className="h-48">
              <TrendChart
                data={callVolumeData.map(d => ({ date: d.time, calls: d.calls }))}
                title=""
                lines={[{ key: 'calls', name: 'Calls', color: '#22d3ee' }]}
              />
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="col-span-4 space-y-6">
          {/* Service Status */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-text-primary">Service Status</h3>
              <Badge variant="success">All Operational</Badge>
            </div>
            <div className="space-y-3">
              {serviceStatus.map((service) => (
                <div key={service.name} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <div className={clsx(
                      'w-2 h-2 rounded-full',
                      service.status === 'operational' ? 'bg-success' : 'bg-warning'
                    )} />
                    <span className="text-sm text-text-secondary">{service.name}</span>
                  </div>
                  <span className="text-xs text-text-muted">{service.latency}</span>
                </div>
              ))}
            </div>
            <a
              href="#"
              className="flex items-center gap-2 mt-4 pt-4 border-t border-glass-border text-sm text-accent hover:text-accent-light"
            >
              View full status page
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Recent Alerts */}
          <div className="glass-card p-6">
            <h3 className="font-semibold text-text-primary mb-4">Recent Alerts</h3>
            <div className="space-y-4">
              {recentAlerts.map((alert) => (
                <div key={alert.id} className={clsx(
                  'p-3 rounded-lg',
                  alert.resolved ? 'bg-glass-surface' : 'bg-glass-surface-hover'
                )}>
                  <div className="flex items-start gap-3">
                    <div className={clsx(
                      'p-1.5 rounded-lg',
                      alert.severity === 'critical' && 'bg-danger-muted',
                      alert.severity === 'warning' && 'bg-warning-muted',
                      alert.severity === 'info' && 'bg-accent-muted'
                    )}>
                      {alert.type === 'spam' && <Shield className="w-4 h-4 text-danger" />}
                      {alert.type === 'verification' && <CheckCircle2 className="w-4 h-4 text-warning" />}
                      {alert.type === 'routing' && <Activity className="w-4 h-4 text-accent" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={clsx(
                        'text-sm',
                        alert.resolved ? 'text-text-muted' : 'text-text-primary'
                      )}>
                        {alert.message}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-text-muted">{alert.time}</span>
                        {alert.resolved && (
                          <Badge variant="success" size="sm">Resolved</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="glass-card p-6">
            <h3 className="font-semibold text-text-primary mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <button className="w-full flex items-center gap-3 p-3 rounded-lg bg-glass-surface hover:bg-glass-surface-hover transition-colors text-left">
                <Phone className="w-5 h-5 text-accent" />
                <div>
                  <span className="text-sm font-medium text-text-primary">Test All Lines</span>
                  <p className="text-xs text-text-muted">Verify connectivity</p>
                </div>
              </button>
              <button className="w-full flex items-center gap-3 p-3 rounded-lg bg-glass-surface hover:bg-glass-surface-hover transition-colors text-left">
                <Shield className="w-5 h-5 text-accent" />
                <div>
                  <span className="text-sm font-medium text-text-primary">Spam Check</span>
                  <p className="text-xs text-text-muted">Check carrier databases</p>
                </div>
              </button>
              <button className="w-full flex items-center gap-3 p-3 rounded-lg bg-glass-surface hover:bg-glass-surface-hover transition-colors text-left">
                <Activity className="w-5 h-5 text-accent" />
                <div>
                  <span className="text-sm font-medium text-text-primary">Validate Routing</span>
                  <p className="text-xs text-text-muted">Check campaign mapping</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
