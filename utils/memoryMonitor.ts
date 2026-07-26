/**
 * Memory Monitoring Utility
 * Tracks runtime memory usage to ensure app stays under 45MB RAM target
 * for ₹5,000 Android phones with 2GB RAM
 */

const MEMORY_TARGET_MB = 45;
const WARNING_THRESHOLD_MB = 40;
const CHECK_INTERVAL_MS = 30000; // Check every 30 seconds

export interface MemoryStatus {
  usedMB: number;
  target: number;
  percentage: number;
  isOverTarget: boolean;
  isWarning: boolean;
  timestamp: number;
}

type MemoryCallback = (status: MemoryStatus) => void;

class MemoryMonitor {
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private listeners: Set<MemoryCallback> = new Set();
  private lastStatus: MemoryStatus | null = null;

  /**
   * Get current memory usage (if available)
   */
  public getMemoryUsage(): MemoryStatus | null {
    if (typeof performance === 'undefined' || !(performance as any).memory) {
      return null;
    }

    const memory = (performance as any).memory;
    const usedMB = Math.round(memory.usedJSHeapSize / (1024 * 1024));
    const percentage = Math.round((usedMB / MEMORY_TARGET_MB) * 100);

    const status: MemoryStatus = {
      usedMB,
      target: MEMORY_TARGET_MB,
      percentage,
      isOverTarget: usedMB > MEMORY_TARGET_MB,
      isWarning: usedMB > WARNING_THRESHOLD_MB,
      timestamp: Date.now()
    };

    this.lastStatus = status;
    return status;
  }

  /**
   * Start monitoring memory usage
   */
  public startMonitoring(intervalMs: number = CHECK_INTERVAL_MS): void {
    if (this.intervalId) return;

    this.intervalId = setInterval(() => {
      const status = this.getMemoryUsage();
      if (status) {
        this.notifyListeners(status);

        // Log warnings in development
        if (status.isOverTarget) {
        } else if (status.isWarning) {
        }
      }
    }, intervalMs);

    // Initial check
    const initialStatus = this.getMemoryUsage();
    if (initialStatus) {
      this.notifyListeners(initialStatus);
    }
  }

  /**
   * Stop monitoring
   */
  public stopMonitoring(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Subscribe to memory status updates
   */
  public onStatusChange(callback: MemoryCallback): () => void {
    this.listeners.add(callback);
    
    // Emit current status immediately
    if (this.lastStatus) {
      callback(this.lastStatus);
    }
    
    return () => this.listeners.delete(callback);
  }

  /**
   * Get device hardware info
   */
  public getDeviceInfo(): {
    deviceMemory?: number;
    hardwareConcurrency?: number;
    isLowEndDevice: boolean;
    maxHeapSize?: number;
  } {
    if (typeof navigator === 'undefined') {
      return { isLowEndDevice: false };
    }

    const deviceMemory = (navigator as any).deviceMemory;
    const hardwareConcurrency = navigator.hardwareConcurrency;
    const maxHeapSize = (performance as any).memory?.jsHeapSizeLimit;

    return {
      deviceMemory,
      hardwareConcurrency,
      isLowEndDevice: (deviceMemory && deviceMemory <= 2) || (hardwareConcurrency && hardwareConcurrency <= 4),
      maxHeapSize: maxHeapSize ? Math.round(maxHeapSize / (1024 * 1024)) : undefined
    };
  }

  /**
   * Force garbage collection (if available)
   */
  public requestGC(): boolean {
    if (typeof window !== 'undefined' && 'gc' in window) {
      try {
        (window as any).gc();
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }

  /**
   * Get memory usage history (last N readings)
   */
  public getStatusSummary(): {
    current: MemoryStatus | null;
    device: ReturnType<MemoryMonitor['getDeviceInfo']>;
    isSupported: boolean;
  } {
    return {
      current: this.lastStatus,
      device: this.getDeviceInfo(),
      isSupported: typeof performance !== 'undefined' && !!(performance as any).memory
    };
  }

  private notifyListeners(status: MemoryStatus): void {
    this.listeners.forEach(cb => {
      try {
        cb(status);
      } catch {
        // Silently ignore listener errors
      }
    });
  }
}

export const memoryMonitor = new MemoryMonitor();
