import { checkServerHealth } from './apiClient';

interface ClientMetrics {
  pageLoads: number;
  apiCalls: number;
  apiErrors: number;
  avgApiTime: number;
  lastHeartbeat: string;
  serverOnline: boolean;
}

type MetricListener = (metrics: ClientMetrics) => void;

class MonitoringService {
  private metrics: ClientMetrics = {
    pageLoads: 0,
    apiCalls: 0,
    apiErrors: 0,
    avgApiTime: 0,
    lastHeartbeat: '',
    serverOnline: false,
  };
  private apiTimes: number[] = [];
  private listeners: MetricListener[] = [];
  private healthInterval: ReturnType<typeof setInterval> | null = null;

  subscribe(listener: MetricListener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(l => {
      try { l({ ...this.metrics }); } catch { /* ignore */ }
    });
  }

  trackPageLoad() {
    this.metrics.pageLoads++;
    this.notify();
  }

  trackApiCall(durationMs: number, isError: boolean) {
    this.metrics.apiCalls++;
    if (isError) this.metrics.apiErrors++;
    this.apiTimes.push(durationMs);
    if (this.apiTimes.length > 100) this.apiTimes.shift();
    this.metrics.avgApiTime = Math.round(this.apiTimes.reduce((a, b) => a + b, 0) / this.apiTimes.length);
    this.notify();
  }

  getMetrics(): ClientMetrics {
    return { ...this.metrics };
  }

  startHealthCheck(intervalMs = 60000) {
    if (this.healthInterval) clearInterval(this.healthInterval);
    this.healthCheck();
    this.healthInterval = setInterval(() => this.healthCheck(), intervalMs);
  }

  stopHealthCheck() {
    if (this.healthInterval) {
      clearInterval(this.healthInterval);
      this.healthInterval = null;
    }
  }

  private async healthCheck() {
    const online = await checkServerHealth();
    this.metrics.serverOnline = online;
    this.metrics.lastHeartbeat = new Date().toISOString();
    this.notify();
  }
}

export const monitoringService = new MonitoringService();
