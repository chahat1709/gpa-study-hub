import { Capacitor } from '@capacitor/core';

const CURRENT_VERSION = '1.0.0';
const CURRENT_VERSION_CODE = 1;
const UPDATE_URL = 'https://raw.githubusercontent.com/gpa-study-hub/releases/main/latest.json';

export interface UpdateInfo {
  version: string;
  versionCode: number;
  apkUrl: string;
  changelog: string;
  mandatory: boolean;
}

/**
 * Type-safe wrapper around Capacitor.isNative() which may not be in older type defs.
 */
function isNativePlatform(): boolean {
  try {
    const cap = Capacitor as unknown as {
      isNative?: () => boolean;
      isNativePlatform?: () => boolean;
    };
    if (typeof cap.isNative === 'function') return cap.isNative();
    if (typeof cap.isNativePlatform === 'function') return cap.isNativePlatform();
    // Fallback: check platform string
    return (Capacitor.getPlatform?.() ?? 'web') !== 'web';
  } catch {
    return false;
  }
}

export class UpdateService {
  private static instance: UpdateService;

  private constructor() {}

  static getInstance(): UpdateService {
    if (!UpdateService.instance) {
      UpdateService.instance = new UpdateService();
    }
    return UpdateService.instance;
  }

  async checkForUpdate(): Promise<UpdateInfo | null> {
    if (!isNativePlatform()) {
      return null;
    }

    try {
      const response = await fetch(UPDATE_URL, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        return null;
      }

      const data: UpdateInfo = await response.json();

      if (data.versionCode > CURRENT_VERSION_CODE) {
        return data;
      }

      return null;
    } catch {
      return null;
    }
  }

  async downloadAndInstall(apkUrl: string): Promise<boolean> {
    if (!isNativePlatform()) {
      return false;
    }

    try {
      // Use dynamic import with a string variable to avoid TS module resolution errors
      // when @capacitor/browser is not installed.
      const moduleName = '@capacitor/browser';
      const mod: {
        Browser?: { open: (opts: { url: string; windowName?: string }) => Promise<void> };
      } = (await import(/* @vite-ignore */ moduleName).catch(
        () => ({}) as Record<string, unknown>
      )) as never;

      if (mod.Browser) {
        await mod.Browser.open({ url: apkUrl, windowName: '_self' });
        return true;
      }

      window.open(apkUrl, '_blank');
      return true;
    } catch {
      try {
        window.open(apkUrl, '_blank');
        return true;
      } catch {
        return false;
      }
    }
  }

  getCurrentVersion(): string {
    return CURRENT_VERSION;
  }

  getCurrentVersionCode(): number {
    return CURRENT_VERSION_CODE;
  }

  isNative(): boolean {
    return isNativePlatform();
  }
}

export const updateService = UpdateService.getInstance();
