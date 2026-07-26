
/**
 * INSTITUTIONAL LICENSE SERVICE
 * Manages the "Node Lease" and subscription status for the college.
 * Provides the "Kill Switch" logic for unpaid maintenance fees.
 */

import { db, isConfigValid } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export interface LicenseStatus {
  isActive: boolean;
  expiryDate: number;
  tier: 'PILOT_NODE' | 'CAMPUS_NODE' | 'ENTERPRISE_MATRIX';
  daysRemaining: number;
  lastPaymentDate: number;
  monthlyFee: number;
}

const STORAGE_KEY = 'GPA_HUB_LICENSE_STATE';

const getInitialState = (): LicenseStatus => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) return JSON.parse(saved);
  
  const now = Date.now();
  return {
    isActive: false,
    expiryDate: 0,
    tier: 'PILOT_NODE',
    daysRemaining: 0,
    lastPaymentDate: now,
    monthlyFee: 3500 // In INR
  };
};

let currentLicense = getInitialState();

export const licenseService = {
  getStatus: async (): Promise<LicenseStatus> => {
    if (isConfigValid && db) {
      try {
        const snap = await getDoc(doc(db, 'system_config', 'license'));
        if (snap.exists()) {
          currentLicense = snap.data() as LicenseStatus;
        } else {
          // Seed initial
          await setDoc(doc(db, 'system_config', 'license'), currentLicense);
        }
      } catch (err) {
        console.warn("Failed to fetch license from Firestore, using local:", err);
      }
    }

    const now = Date.now();
    const days = Math.max(0, Math.ceil((currentLicense.expiryDate - now) / (1000 * 60 * 60 * 24)));
    
    return {
      ...currentLicense,
      isActive: now < currentLicense.expiryDate && currentLicense.isActive,
      daysRemaining: days
    };
  },

  /**
   * PROVIDER ACTION: This would be called by YOU via a secret admin panel
   * to confirm the college has paid their monthly maintenance.
   */
  processMaintenancePayment: async (months: number = 1) => {
    const now = Date.now();
    const currentExpiry = Math.max(now, currentLicense.expiryDate);
    
    currentLicense = {
      ...currentLicense,
      isActive: true,
      lastPaymentDate: now,
      expiryDate: currentExpiry + (1000 * 60 * 60 * 24 * 30 * months)
    };
    if (isConfigValid && db) {
      await setDoc(doc(db, 'system_config', 'license'), currentLicense);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(currentLicense));
  },

  setTier: async (tier: LicenseStatus['tier'], fee: number) => {
    currentLicense = {
      ...currentLicense,
      tier,
      monthlyFee: fee
    };
    if (isConfigValid && db) {
      await setDoc(doc(db, 'system_config', 'license'), currentLicense);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(currentLicense));
  },

  terminateLease: async () => {
    currentLicense = {
      ...currentLicense,
      isActive: false,
      expiryDate: Date.now() - 1000
    };
    if (isConfigValid && db) {
      await setDoc(doc(db, 'system_config', 'license'), currentLicense);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(currentLicense));
  }
};
