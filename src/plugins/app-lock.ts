import { registerPlugin } from '@capacitor/core';

export type AppLockMode = 'paragraph' | 'chapter';

export interface AppLockState {
  enabled: boolean;
  /** Paragraph = one verse at a time; chapter = full chapter each lock. */
  mode: AppLockMode;
  packages: string[];
  hasGateReadingContent: boolean;
  accessibilityServiceEnabled: boolean;
}

export interface LauncherAppRow {
  packageName: string;
  label: string;
}

export interface AppLockPlugin {
  getState(): Promise<AppLockState>;
  setEnabled(options: { enabled: boolean }): Promise<void>;
  setMode(options: { mode: AppLockMode }): Promise<void>;
  setLockedPackages(options: { packages: string[] }): Promise<void>;
  openAccessibilitySettings(): Promise<void>;
  getLauncherApps(): Promise<{ apps: LauncherAppRow[] }>;
}

export const AppLock = registerPlugin<AppLockPlugin>('AppLock');
