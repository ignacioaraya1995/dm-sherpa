'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Send,
  Home,
  Handshake,
  MapPin,
  BarChart3,
  Phone,
  Zap,
  Users,
  Settings,
  Activity,
  DollarSign,
  TestTube,
  Target,
  TrendingUp,
  AlertTriangle,
  Calendar,
  Palette,
  Layers,
  Brush,
  ChevronDown,
  ChevronRight,
  Wand2,
} from 'lucide-react';
import clsx from 'clsx';

const navigation = [
  {
    label: 'Overview',
    items: [
      { name: 'Dashboard', href: '/', icon: LayoutDashboard },
      { name: 'Diagnostics', href: '/diagnostics', icon: Activity },
    ],
  },
  {
    label: 'Campaigns',
    items: [
      { name: 'All Campaigns', href: '/campaigns', icon: Send },
      { name: 'Smart Builder', href: '/campaigns/builder', icon: Wand2 },
      { name: 'A/B Testing', href: '/testing', icon: TestTube },
      { name: 'Triggers', href: '/triggers', icon: Zap },
    ],
  },
  {
    label: 'Creative',
    items: [
      { name: 'Template Library', href: '/creative', icon: Palette },
      { name: 'Campaign Sequences', href: '/creative/campaigns', icon: Layers },
      { name: 'Brand Manager', href: '/creative/brands', icon: Brush },
    ],
  },
  {
    label: 'Pipeline',
    items: [
      { name: 'Properties', href: '/properties', icon: Home },
      { name: 'Deals', href: '/deals', icon: Handshake },
      { name: 'Markets', href: '/markets', icon: MapPin },
    ],
  },
  {
    label: 'Intelligence',
    items: [
      { name: 'Analytics', href: '/analytics', icon: BarChart3 },
      { name: 'Attribution', href: '/attribution', icon: TrendingUp },
      { name: 'Offer Calibration', href: '/offers', icon: DollarSign },
      { name: 'Seasonality', href: '/seasonality', icon: Calendar },
    ],
  },
  {
    label: 'Infrastructure',
    items: [
      { name: 'Telephony', href: '/telephony', icon: Phone },
      { name: 'Health Monitor', href: '/health', icon: AlertTriangle },
    ],
  },
  {
    label: 'Settings',
    items: [
      { name: 'Accounts', href: '/accounts', icon: Users },
      { name: 'Settings', href: '/settings', icon: Settings },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() => {
    // Initialize all groups as expanded
    const initial: Record<string, boolean> = {};
    navigation.forEach((group) => {
      initial[group.label] = true;
    });
    return initial;
  });

  const toggleGroup = (label: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [label]: !prev[label],
    }));
  };

  // Check if a specific nav item is active
  const isItemActive = (href: string, allItems: typeof navigation[0]['items']) => {
    // Exact match is always active
    if (pathname === href) return true;

    // For non-root paths, check if pathname starts with href
    // BUT only if no other sibling item is a better match
    if (href !== '/' && pathname.startsWith(href + '/')) {
      // Check if any sibling is a more specific match
      const hasMoreSpecificMatch = allItems.some(
        (sibling) => sibling.href !== href && pathname.startsWith(sibling.href)
      );
      return !hasMoreSpecificMatch;
    }

    return false;
  };

  // Check if any item in a group is active
  const isGroupActive = (items: typeof navigation[0]['items']) => {
    return items.some((item) => isItemActive(item.href, items));
  };

  return (
    <aside className="w-64 h-screen flex flex-col bg-dark-800/70 backdrop-blur-xl border-r border-glass-border">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-glass-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-accent flex items-center justify-center shadow-glow-accent">
            <Target className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-semibold text-text-primary">DM Sherpa</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 scrollbar-hide">
        {navigation.map((group) => {
          const isExpanded = expandedGroups[group.label];
          const groupActive = isGroupActive(group.items);

          return (
            <div key={group.label} className="mb-2">
              {/* Group Header - Clickable */}
              <button
                onClick={() => toggleGroup(group.label)}
                className={clsx(
                  'w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors',
                  'hover:bg-glass-surface',
                  groupActive && 'bg-glass-surface'
                )}
              >
                <span className={clsx(
                  'text-xs font-semibold uppercase tracking-wider',
                  groupActive ? 'text-accent' : 'text-text-muted'
                )}>
                  {group.label}
                </span>
                {isExpanded ? (
                  <ChevronDown className={clsx(
                    'w-4 h-4 transition-transform',
                    groupActive ? 'text-accent' : 'text-text-muted'
                  )} />
                ) : (
                  <ChevronRight className={clsx(
                    'w-4 h-4 transition-transform',
                    groupActive ? 'text-accent' : 'text-text-muted'
                  )} />
                )}
              </button>

              {/* Group Items - Collapsible */}
              <div
                className={clsx(
                  'overflow-hidden transition-all duration-200 ease-in-out',
                  isExpanded ? 'max-h-96 opacity-100 mt-1' : 'max-h-0 opacity-0'
                )}
              >
                <ul className="space-y-1 pl-2">
                  {group.items.map((item) => {
                    const isActive = isItemActive(item.href, group.items);
                    const Icon = item.icon;
                    return (
                      <li key={item.name}>
                        <Link
                          href={item.href}
                          className={clsx(
                            'nav-item',
                            isActive && 'nav-item-active'
                          )}
                        >
                          <Icon className="w-5 h-5" />
                          <span className="text-sm font-medium">{item.name}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          );
        })}
      </nav>

      {/* System Health Footer */}
      <div className="p-4 border-t border-glass-border">
        <div className="glass-card-sm p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-text-muted uppercase tracking-wider">
              System Health
            </span>
            <div className="health-indicator">
              <div className="health-dot health-dot-healthy" />
              <span className="text-xs text-success">Operational</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-1.5">
              <Phone className="w-3 h-3 text-text-muted" />
              <span className="text-text-secondary">12/12 lines</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Activity className="w-3 h-3 text-text-muted" />
              <span className="text-text-secondary">99.8% uptime</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
