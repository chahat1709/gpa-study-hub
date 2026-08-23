/**
 * INSTITUTIONAL LICENSE SERVICE — GPA Study Hub
 *
 * ZERO-COST DEPLOYMENT MODEL:
 * The app runs 100% free for unlimited students and teachers using:
 *   1. Firebase Spark Free Tier (50K reads/day, 20K writes/day, 5GB storage)
 *   2. Client-side BYOK AI (no central LLM billing)
 *   3. Offline-first localStorage RBAC (no server required)
 *
 * The license is now PERMANENTLY ACTIVE by default. The "Node Lease"
 * concept has been replaced with a free community license that never expires.
 */

import { db, isConfigValid } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export interface LicenseStatus {
  isActive: boolean;
  expiryDate: number;
  tier: 'PILOT_NODE' | 'CAMPUS_NODE' | 'ENTERPRISE_MATRIX' | 'COMMUNITY_FREE';
  daysRemaining: number;
  lastPaymentDate: number;
  monthlyFee: number;
}

const STORAGE_KEY = 'GPA_HUB_LICENSE_STATE';

const getInitialState = (): LicenseStatus => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) return JSON.parse(saved);

  const now = Date.now();
  // PERMANENTLY ACTIVE — free community license, never expires
  return {
    isActive: true,
    expiryDate: now + 1000 * 60 * 60 * 24 * 365 * 100, // 100 years
    tier: 'COMMUNITY_FREE',
    daysRemaining: 36500,
    lastPaymentDate: now,
    monthlyFee: 0, // FREE
  };
};

let currentLicense = getInitialState();

export const licenseService = {
  getStatus: async (): Promise<LicenseStatus> => {
    if (isConfigValid && db) {
      try {
        const snap = await Promise.race([
          getDoc(doc(db, 'system_config', 'license')),
          new Promise<null>(resolve => setTimeout(() => resolve(null), 1500)),
        ]);
        if (snap && snap.exists()) {
          const data = snap.data() as LicenseStatus;
          // Always ensure the license is active (free community model)
          currentLicense = { ...data, isActive: true, tier: 'COMMUNITY_FREE', monthlyFee: 0 };
        } else if (snap) {
          // Seed initial free license when Firestore responds with no record.
          await Promise.race([
            setDoc(doc(db, 'system_config', 'license'), currentLicense),
            new Promise<void>(resolve => setTimeout(resolve, 1500)),
          ]);
        } else {
          console.warn('License service timed out; continuing with local community license.');
        }
      } catch (err) {
        console.warn('Failed to fetch license from Firestore, using local:', err);
      }
    }

    const now = Date.now();
    const days = Math.max(0, Math.ceil((currentLicense.expiryDate - now) / (1000 * 60 * 60 * 24)));

    return {
      ...currentLicense,
      isActive: true, // ALWAYS ACTIVE — free community license
      daysRemaining: days,
    };
  },

  /**
   * No-op in free community mode. Kept for backward compatibility.
   */
  processMaintenancePayment: async (months: number = 1) => {
    // Free community license — no payment needed
    console.info('GPA Study Hub Community Edition — no payment required.');
  },

  setTier: async (tier: LicenseStatus['tier'], fee: number) => {
    // Free community license — tier is always COMMUNITY_FREE
    currentLicense = {
      ...currentLicense,
      tier: 'COMMUNITY_FREE',
      monthlyFee: 0,
    };
    if (isConfigValid && db) {
      await setDoc(doc(db, 'system_config', 'license'), currentLicense);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(currentLicense));
  },

  terminateLease: async () => {
    // Cannot terminate the free community license
    console.info('Community license cannot be terminated.');
  },
};
