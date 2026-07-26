import { describe, it, expect, beforeEach, vi } from 'vitest';
import { offlineStorageService } from '../services/offlineStorageService';

describe('offlineStorageService', () => {
  beforeEach(() => {
    localStorage.clear();
    offlineStorageService.clearQueue();
  });

  describe('getStatus', () => {
    it('should return initial status', () => {
      const status = offlineStorageService.getStatus();
      expect(status.pending).toBe(0);
      expect(status.isSyncing).toBe(false);
    });
  });

  describe('enqueue', () => {
    it('should add action to queue', () => {
      offlineStorageService.enqueue('NOTE_SAVE', { title: 'Test Note', content: 'Hello' });
      const status = offlineStorageService.getStatus();
      expect(status.pending).toBe(1);
    });

    it('should add multiple actions', () => {
      offlineStorageService.enqueue('NOTE_SAVE', { title: 'Note 1' });
      offlineStorageService.enqueue('CHAT_MESSAGE', { chatId: 'c1', content: 'Hi' });
      const status = offlineStorageService.getStatus();
      expect(status.pending).toBe(2);
    });
  });

  describe('getPendingByType', () => {
    it('should count actions by type', () => {
      offlineStorageService.enqueue('NOTE_SAVE', { title: 'Note 1' });
      offlineStorageService.enqueue('NOTE_SAVE', { title: 'Note 2' });
      offlineStorageService.enqueue('CHAT_MESSAGE', { chatId: 'c1', content: 'Hi' });

      const counts = offlineStorageService.getPendingByType();
      expect(counts['NOTE_SAVE']).toBe(2);
      expect(counts['CHAT_MESSAGE']).toBe(1);
    });

    it('should return empty object when no actions', () => {
      const counts = offlineStorageService.getPendingByType();
      expect(counts).toEqual({});
    });
  });

  describe('clearQueue', () => {
    it('should clear all pending actions', () => {
      offlineStorageService.enqueue('NOTE_SAVE', { title: 'Note 1' });
      offlineStorageService.enqueue('NOTE_SAVE', { title: 'Note 2' });

      offlineStorageService.clearQueue();
      const status = offlineStorageService.getStatus();
      expect(status.pending).toBe(0);
    });
  });

  describe('onStatusChange', () => {
    it('should notify on enqueue', () => {
      const callback = vi.fn();
      const unsubscribe = offlineStorageService.onStatusChange(callback);

      // The initial call happens on subscribe
      expect(callback).toHaveBeenCalledTimes(1);

      offlineStorageService.enqueue('NOTE_SAVE', { title: 'Note' });
      expect(callback.mock.calls.length).toBeGreaterThanOrEqual(2);

      unsubscribe();
    });

    it('should return unsubscribe function', () => {
      const callback = vi.fn();
      const unsubscribe = offlineStorageService.onStatusChange(callback);
      expect(callback).toHaveBeenCalledTimes(1);

      unsubscribe();
      offlineStorageService.enqueue('NOTE_SAVE', { title: 'Note' });
      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe('isLowEndDevice', () => {
    it('should return a boolean', () => {
      const result = offlineStorageService.isLowEndDevice();
      expect(typeof result).toBe('boolean');
    });
  });

  describe('persistence', () => {
    it('should persist queue to localStorage', () => {
      offlineStorageService.enqueue('NOTE_SAVE', { title: 'Persistent' });
      const saved = localStorage.getItem('gpa_hub_offline_queue');
      expect(saved).not.toBeNull();
      const queue = JSON.parse(saved!);
      expect(queue.length).toBe(1);
      expect(queue[0].type).toBe('NOTE_SAVE');
    });
  });
});
