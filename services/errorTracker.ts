interface ErrorReport {
  id: string;
  message: string;
  stack?: string;
  component?: string;
  url: string;
  userAgent: string;
  timestamp: string;
  userId?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  metadata?: Record<string, unknown>;
}

interface ErrorListener {
  (error: ErrorReport): void;
}

class ErrorTracker {
  private listeners: ErrorListener[] = [];
  private queue: ErrorReport[] = [];
  private maxQueueSize = 100;
  private userId: string | null = null;
  private enabled = true;

  setUser(userId: string) {
    this.userId = userId;
  }

  clearUser() {
    this.userId = null;
  }

  onReport(listener: ErrorListener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private generateId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  private notify(error: ErrorReport) {
    this.listeners.forEach(l => {
      try { l(error); } catch { /* listener error */ }
    });
  }

  report(error: Error | string, options: {
    component?: string;
    severity?: ErrorReport['severity'];
    metadata?: Record<string, unknown>;
  } = {}) {
    if (!this.enabled) return;

    const errorObj = typeof error === 'string' ? new Error(error) : error;
    const report: ErrorReport = {
      id: this.generateId(),
      message: errorObj.message,
      stack: errorObj.stack,
      component: options.component,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      userId: this.userId || undefined,
      severity: options.severity || 'medium',
      metadata: options.metadata,
    };

    this.queue.push(report);
    if (this.queue.length > this.maxQueueSize) {
      this.queue.shift();
    }

    this.notify(report);

    if (report.severity === 'critical') {
      console.error('[CRITICAL ERROR]', report.message, report.stack);
    }
  }

  getReports(): ErrorReport[] {
    return [...this.queue];
  }

  clearReports() {
    this.queue = [];
  }

  installGlobalHandlers() {
    window.addEventListener('error', (event) => {
      this.report(event.error || new Error(event.message), {
        severity: 'high',
        metadata: { filename: event.filename, lineno: event.lineno, colno: event.colno },
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      const reason = event.reason;
      const message = reason instanceof Error ? reason.message : String(reason);
      this.report(message, {
        severity: 'high',
        metadata: { type: 'unhandledrejection' },
      });
    });
  }
}

export const errorTracker = new ErrorTracker();
export type { ErrorReport };
