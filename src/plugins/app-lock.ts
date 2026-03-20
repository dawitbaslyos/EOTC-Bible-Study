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

export interface PackageLabelRow {
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
  /** Resolve display names for package ids (Android). */
  getLabelsForPackages(options: { packages: string[] }): Promise<{ labels: PackageLabelRow[] }>;
}

export const AppLock = registerPlugin<AppLockPlugin>('AppLock', {
  web: () =>
    ({
      getState: async () => ({
        enabled: false,
        mode: 'paragraph' as AppLockMode,
        packages: [],
        hasGateReadingContent: false,
        accessibilityServiceEnabled: false
      }),
      setEnabled: async () => {},
      setMode: async () => {},
      setLockedPackages: async () => {},
      openAccessibilitySettings: async () => {},
      getLauncherApps: async () => ({ apps: [] }),
      getLabelsForPackages: async ({ packages }) => ({
        labels: packages.map((packageName) => ({ packageName, label: packageName }))
      })
    }) as AppLockPlugin
});
