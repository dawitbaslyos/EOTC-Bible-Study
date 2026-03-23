import { registerPlugin } from '@capacitor/core';

export type AppLockMode = 'paragraph' | 'chapter';

export interface AppLockState {
  enabled: boolean;
  /** Paragraph = one verse at a time; chapter = full chapter each lock. */
  mode: AppLockMode;
  packages: string[];
  hasGateReadingContent: boolean;
  accessibilityServiceEnabled: boolean;
  /** UsageStatsManager — user grants in Special app access → Usage access. */
  usageStatsPermissionGranted: boolean;
  /** Settings.canDrawOverlays — relevant on API 23+ if the system requires it for overlays. */
  displayOverOtherAppsGranted: boolean;
}

export interface LauncherAppRow {
  packageName: string;
  label: string;
}

export interface PackageLabelRow {
  packageName: string;
  label: string;
}

export interface GateCompletionItem {
  bookId: string;
  chapter: number;
  mode: AppLockMode;
}

export interface AppLockPlugin {
  getState(): Promise<AppLockState>;
  setEnabled(options: { enabled: boolean }): Promise<void>;
  setMode(options: { mode: AppLockMode }): Promise<void>;
  setLockedPackages(options: { packages: string[] }): Promise<void>;
  openAccessibilitySettings(): Promise<void>;
  openUsageAccessSettings(): Promise<void>;
  openDisplayOverOtherAppsSettings(): Promise<void>;
  getLauncherApps(): Promise<{ apps: LauncherAppRow[] }>;
  /** Resolve display names for package ids (Android). */
  getLabelsForPackages(options: { packages: string[] }): Promise<{ labels: PackageLabelRow[] }>;
  /** Pop gate readings completed in the native overlay (queued until JS consumes). */
  consumePendingGateCompletions(): Promise<{ items: GateCompletionItem[] }>;
}

export const AppLock = registerPlugin<AppLockPlugin>('AppLock', {
  web: () =>
    ({
      getState: async () => ({
        enabled: false,
        mode: 'paragraph' as AppLockMode,
        packages: [],
        hasGateReadingContent: false,
        accessibilityServiceEnabled: false,
        usageStatsPermissionGranted: false,
        displayOverOtherAppsGranted: true
      }),
      setEnabled: async () => {},
      setMode: async () => {},
      setLockedPackages: async () => {},
      openAccessibilitySettings: async () => {},
      openUsageAccessSettings: async () => {},
      openDisplayOverOtherAppsSettings: async () => {},
      getLauncherApps: async () => ({ apps: [] }),
      getLabelsForPackages: async ({ packages }) => ({
        labels: packages.map((packageName) => ({ packageName, label: packageName }))
      }),
      consumePendingGateCompletions: async () => ({ items: [] })
    }) as AppLockPlugin
});
