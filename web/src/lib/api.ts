const API_BASE = '/api';

export async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `HTTP ${res.status}`);
  }

  return res.json();
}

// Health
export const getHealth = () => fetchApi<HealthResponse>('/health');

// Accounts
export const getAccounts = (page = 1, limit = 10) =>
  fetchApi<PaginatedResponse<Account>>(`/accounts?page=${page}&limit=${limit}`);
export const getAccount = (id: string) => fetchApi<Account>(`/accounts/${id}`);
export const getAccountStats = (id: string) => fetchApi<AccountStats>(`/accounts/${id}/stats`);

// Campaigns
export const getCampaigns = (accountId: string, page = 1, limit = 10) =>
  fetchApi<PaginatedResponse<Campaign>>(`/campaigns?accountId=${accountId}&page=${page}&limit=${limit}`);
export const getCampaign = (id: string) => fetchApi<Campaign>(`/campaigns/${id}`);
export const getCampaignStats = (id: string) => fetchApi<CampaignStats>(`/campaigns/${id}/stats`);

// Properties
export const getProperties = (page = 1, limit = 10) =>
  fetchApi<PaginatedResponse<Property>>(`/properties?page=${page}&limit=${limit}`);
export const getProperty = (id: string) => fetchApi<Property>(`/properties/${id}`);

// Deals
export const getDeals = (accountId: string, page = 1, limit = 10) =>
  fetchApi<PaginatedResponse<Deal>>(`/deals?accountId=${accountId}&page=${page}&limit=${limit}`);
export const getDealStats = (accountId: string) => fetchApi<DealStats>(`/deals/stats?accountId=${accountId}`);
export const getDealPipeline = (accountId: string) => fetchApi<DealPipeline>(`/deals/pipeline?accountId=${accountId}`);

// Markets
export const getMarkets = (page = 1, limit = 10) =>
  fetchApi<PaginatedResponse<Market>>(`/markets?page=${page}&limit=${limit}`);
export const getMarket = (id: string) => fetchApi<Market>(`/markets/${id}`);

// Analytics
export const getDashboard = (accountId: string) => fetchApi<Dashboard>(`/analytics/dashboard?accountId=${accountId}`);
export const getCashCycle = (accountId: string) => fetchApi<CashCycleAnalysis>(`/analytics/cash-cycle?accountId=${accountId}`);

// Types
export interface HealthResponse {
  status: 'ok' | 'error';
  timestamp: string;
  version: string;
  checks: {
    database: { status: string; latencyMs?: number };
    memory: { status: string; usedMb: number; totalMb: number };
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface Account {
  id: string;
  name: string;
  type: string;
  status: string;
  createdAt: string;
  _count?: {
    users: number;
    campaigns: number;
    deals: number;
  };
}

export interface AccountStats {
  totalUsers: number;
  totalCampaigns: number;
  activeCampaigns: number;
  totalDeals: number;
  closedDeals: number;
  totalGrossProfit: number;
  totalMailedPieces: number;
  overallResponseRate: number;
  overallContractRate: number;
}

export interface Campaign {
  id: string;
  name: string;
  description?: string;
  status: string;
  type: string;
  goal: string;
  totalBudget: number;
  spentBudget: number;
  totalMailed: number;
  totalDelivered: number;
  totalCalls: number;
  totalContracts: number;
  startDate?: string;
  endDate?: string;
  createdAt: string;
}

export interface CampaignStats {
  totalMailed: number;
  totalDelivered: number;
  deliveryRate: number;
  totalCalls: number;
  responseRate: number;
  qualifiedLeads: number;
  contracts: number;
  contractRate: number;
  grossProfit: number;
  costPerLead: number;
  costPerContract: number;
  roi: number;
}

export interface Property {
  id: string;
  streetAddress: string;
  city: string;
  state: string;
  avmValue?: number;
  arvValue?: number;
  priceBand?: string;
  propertyType: string;
  beds?: number;
  baths?: number;
  sqft?: number;
  motivationScore?: number;
  dispoScore?: number;
  isVacant: boolean;
  isAbsenteeOwner: boolean;
  distressFlags?: DistressFlag[];
}

export interface DistressFlag {
  id: string;
  type: string;
  severity: string;
  startDate: string;
  isActive: boolean;
}

export interface Deal {
  id: string;
  status: string;
  type: string;
  contractPrice?: number;
  grossProfit?: number;
  contractDate?: string;
  closeDate?: string;
  property?: Property;
}

export interface DealStats {
  totalDeals: number;
  closedDeals: number;
  totalGrossProfit: number;
  avgProfitPerDeal: number;
  avgDaysToClose: number;
}

export interface DealPipeline {
  stages: Array<{
    status: string;
    count: number;
    value: number;
  }>;
}

export interface Market {
  id: string;
  name: string;
  state: string;
  county?: string;
  city?: string;
  medianPrice?: number;
  avgDom?: number;
}

export interface Dashboard {
  period: { start: string; end: string };
  kpis: {
    totalMailed: number;
    totalCalls: number;
    totalContracts: number;
    grossProfit: number;
    responseRate: number;
    contractRate: number;
    costPerContract: number;
    roi: number;
  };
  trends: Array<{
    date: string;
    mailed: number;
    calls: number;
    contracts: number;
    profit: number;
  }>;
}

export interface CashCycleAnalysis {
  accountId: string;
  byDealType: Array<{
    dealType: string;
    avgSpendToLead: number;
    avgLeadToContract: number;
    avgContractToClose: number;
    totalCycleDays: number;
    sampleSize: number;
  }>;
  overall: {
    avgTotalCycleDays: number;
    stdDevCycleDays: number;
    p50CycleDays: number;
    p90CycleDays: number;
  };
}
