/**
 * FOUNDER INTELLIGENCE MODULE (FIM)
 * Purpose: Track the business-level health of the GPA Hub Cluster.
 */

export interface BacklogItem {
  id: string;
  priority: 'CRITICAL' | 'STABLE' | 'DEBT';
  task: string;
  impact: string;
}

export interface BusinessHealth {
  dailyActiveUsers: number;
  projectedRevenue: number;
  infrastructureStability: number; // 0-100
  unresolvedBacklogCount: number;
}

export interface NodeMetrics {
  branchId: string;
  storageUsedGB: number;
  egressUsedGB: number;
  activeUsers: number;
  estCostINR: number;
  revenueINR: number;
  netYieldINR: number;
  health: 'PROFITABLE' | 'WARNING' | 'LOSS';
}

export interface InfrastructureCluster {
  nodes: Record<string, NodeMetrics>;
  totalClusterRevenue: number;
  totalClusterBurn: number;
  netMonthlyProfit: number;
}

const STORAGE_KEY = 'GPA_HUB_CLUSTER_V6';

const MOCK_BACKLOG: BacklogItem[] = [
  {
    id: '1',
    priority: 'CRITICAL',
    task: 'Migrate Mock Storage to Firebase Production',
    impact: 'Enables 10TB Scaling',
  },
  {
    id: '2',
    priority: 'DEBT',
    task: 'Optimize Image Compression',
    impact: 'Reduces Egress Burn by 20%',
  },
  {
    id: '3',
    priority: 'STABLE',
    task: 'Implement PWA Offline Support',
    impact: 'Student Retention',
  },
];

const generateInitialCluster = (): InfrastructureCluster => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) return JSON.parse(saved);

  const branches = ['ICT', 'CSE', 'ECE', 'MECH', 'CIVIL', 'IT', 'EE', 'CHEM', 'AERO', 'AUTO'];
  const nodes: Record<string, NodeMetrics> = {};
  const REVENUE_PER_BRANCH = 4000;

  branches.forEach(id => {
    const storageGB = 150 + Math.random() * 400;
    const egressGB = 20 + Math.random() * 100;
    const cost = storageGB * 1.8 + egressGB * 8.2;

    nodes[id] = {
      branchId: id,
      storageUsedGB: storageGB,
      egressUsedGB: egressGB,
      activeUsers: 45 + Math.floor(Math.random() * 100),
      revenueINR: REVENUE_PER_BRANCH,
      estCostINR: cost,
      netYieldINR: REVENUE_PER_BRANCH - cost,
      health: 'PROFITABLE',
    };
  });

  return {
    nodes,
    totalClusterRevenue: 40000,
    totalClusterBurn: 18400,
    netMonthlyProfit: 21600,
  };
};

let cluster = generateInitialCluster();

export const infrastructureService = {
  getCluster: (): InfrastructureCluster => ({ ...cluster }),

  getBusinessHealth: (): BusinessHealth => ({
    dailyActiveUsers: Object.values(cluster.nodes).reduce((acc, n) => acc + n.activeUsers, 0),
    projectedRevenue: cluster.totalClusterRevenue,
    infrastructureStability: 98.4,
    unresolvedBacklogCount: MOCK_BACKLOG.length,
  }),

  getBacklog: (): BacklogItem[] => MOCK_BACKLOG,

  getGovernorStatus: () => {
    const mem = (window.performance as any)?.memory?.usedJSHeapSize || 0;
    return {
      heapUsageMB: (mem / 1048576).toFixed(1),
      isMemorySafe: mem < 200 * 1048576,
    };
  },

  getEconomics: () => {
    const totalBurn = Object.values(cluster.nodes).reduce((acc, n) => acc + n.estCostINR, 0);
    const netProfit = cluster.totalClusterRevenue - totalBurn;
    return {
      totalRevenue: cluster.totalClusterRevenue,
      totalBurn,
      netProfit,
      margin: ((netProfit / cluster.totalClusterRevenue) * 100).toFixed(1),
    };
  },
};
