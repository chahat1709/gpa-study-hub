/**
 * Offline & Low-Hardware Optimization Service
 * Tailored for 2GB RAM / ₹5,000 Android Smartphones
 * Now with actual Firebase sync capability
 */

import { db, isConfigValid } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export interface OfflineAction {
  id: string;
  type: 'ATTENDANCE_LOG' | 'EXAM_SUBMISSION' | 'NOTE_SAVE' | 'CHAT_MESSAGE';
  payload: any;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
}

const OFFLINE_QUEUE_KEY = 'gpa_hub_offline_queue';
const MAX_RETRIES = 3;

// Sync handlers for different action types
const syncHandlers: Record<OfflineAction['type'], (payload: any) => Promise<void>> = {
  ATTENDANCE_LOG: async payload => {
    if (!db) throw new Error('Firebase not configured');
    await addDoc(collection(db, 'attendance_records'), {
      ...payload,
      timestamp: serverTimestamp(),
      syncedFromOffline: true,
    });
  },
  EXAM_SUBMISSION: async payload => {
    if (!db) throw new Error('Firebase not configured');
    await addDoc(collection(db, 'exam_results'), {
      ...payload,
      timestamp: serverTimestamp(),
      syncedFromOffline: true,
    });
  },
  NOTE_SAVE: async payload => {
    // Notes are stored locally, no sync needed
  },
  CHAT_MESSAGE: async payload => {
    if (!db) throw new Error('Firebase not configured');
    await addDoc(collection(db, 'chats', payload.chatId, 'messages'), {
      senderId: payload.senderId,
      senderName: payload.senderName,
      content: payload.content,
      timestamp: Date.now(),
      type: payload.type || 'text',
      isEncrypted: payload.isEncrypted || false,
      syncedFromOffline: true,
    });
  },
};

class OfflineStorageService {
  private queue: OfflineAction[] = [];
  private isSyncing = false;
  private listeners: Set<
    (status: { syncing: boolean; pending: number; lastSync?: number }) => void
  > = new Set();
  private lastSyncTime: number | null = null;

  constructor() {
    this.loadQueue();
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.syncOfflineQueue());

      // Try to sync on startup if online
      if (navigator.onLine && this.queue.length > 0) {
        setTimeout(() => this.syncOfflineQueue(), 1000);
      }
    }
  }

  /**
   * Subscribe to sync status updates
   */
  public onStatusChange(
    callback: (status: { syncing: boolean; pending: number; lastSync?: number }) => void
  ): () => void {
    this.listeners.add(callback);
    // Initial status
    callback({
      syncing: this.isSyncing,
      pending: this.queue.length,
      lastSync: this.lastSyncTime || undefined,
    });
    return () => this.listeners.delete(callback);
  }

  /**
   * Hardware Capability Audit for 2GB RAM / Low-Budget Devices
   */
  public isLowEndDevice(): boolean {
    if (typeof navigator === 'undefined') return false;
    const ram = (navigator as any).deviceMemory || 4;
    const cores = navigator.hardwareConcurrency || 4;
    return ram <= 2 || cores <= 4;
  }

  /**
   * Get current queue status
   */
  public getStatus(): { pending: number; isSyncing: boolean; lastSync?: number } {
    return {
      pending: this.queue.length,
      isSyncing: this.isSyncing,
      lastSync: this.lastSyncTime || undefined,
    };
  }

  /**
   * Queue an action for auto-syncing when internet returns
   */
  public enqueue(type: OfflineAction['type'], payload: any): void {
    const action: OfflineAction = {
      id: `act_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      type,
      payload,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: MAX_RETRIES,
    };
    this.queue.push(action);
    this.saveQueue();
    this.notifyListeners();

    // Try to sync immediately if online
    if (navigator.onLine && isConfigValid) {
      this.syncOfflineQueue();
    }
  }

  /**
   * Sync queued offline actions when network reconnects
   */
  public async syncOfflineQueue(): Promise<void> {
    if (this.queue.length === 0 || this.isSyncing || !isConfigValid) return;

    this.isSyncing = true;
    this.notifyListeners();

    const remainingQueue: OfflineAction[] = [];
    let syncCount = 0;

    for (const item of this.queue) {
      try {
        const handler = syncHandlers[item.type];
        if (handler) {
          await handler(item.payload);
          syncCount++;
        }
      } catch (err) {
        item.retryCount++;
        if (item.retryCount < item.maxRetries) {
          remainingQueue.push(item);
        }
      }
    }

    this.queue = remainingQueue;
    this.saveQueue();
    this.lastSyncTime = Date.now();
    this.isSyncing = false;
    this.notifyListeners();
  }

  /**
   * Clear all pending actions (use with caution)
   */
  public clearQueue(): void {
    this.queue = [];
    this.saveQueue();
    this.notifyListeners();
  }

  /**
   * Get pending actions count by type
   */
  public getPendingByType(): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const item of this.queue) {
      counts[item.type] = (counts[item.type] || 0) + 1;
    }
    return counts;
  }

  private notifyListeners(): void {
    const status = {
      syncing: this.isSyncing,
      pending: this.queue.length,
      lastSync: this.lastSyncTime || undefined,
    };
    this.listeners.forEach(cb => cb(status));
  }

  private loadQueue(): void {
    try {
      const stored = localStorage.getItem(OFFLINE_QUEUE_KEY);
      if (stored) this.queue = JSON.parse(stored);
    } catch {
      this.queue = [];
    }
  }

  private saveQueue(): void {
    try {
      localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(this.queue));
    } catch {
      // Try to free space by removing oldest items
      if (this.queue.length > 10) {
        this.queue = this.queue.slice(-10);
        try {
          localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(this.queue));
        } catch {
          // Give up
        }
      }
    }
  }
}

export const offlineStorageService = new OfflineStorageService();
