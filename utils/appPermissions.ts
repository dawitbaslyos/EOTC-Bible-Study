import { Capacitor, registerPlugin } from '@capacitor/core';

export interface SenayPermissionStatus {
  notifications: string;
  microphone: string;
  exactAlarms: boolean;
}

export interface SenayPermissionsPluginContract {
  requestAll(): Promise<SenayPermissionStatus>;
  checkStatus(): Promise<SenayPermissionStatus>;
  openExactAlarmSettings(): Promise<void>;
  openAppSettings(): Promise<void>;
}

const SenayPermissionsNative = registerPlugin<SenayPermissionsPluginContract>('SenayPermissions', {
  web: () => ({
    requestAll: async () => ({
      notifications: 'granted',
      microphone: 'granted',
      exactAlarms: true
    }),
    checkStatus: async () => ({
      notifications: 'granted',
      microphone: 'granted',
      exactAlarms: true
    }),
    openExactAlarmSettings: async () => {},
    openAppSettings: async () => {}
  })
});

export function isAndroidNative(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
}

export async function requestAllSenayPermissions(): Promise<SenayPermissionStatus | null> {
  if (!isAndroidNative()) return null;
  return SenayPermissionsNative.requestAll();
}

export async function checkSenayPermissionStatus(): Promise<SenayPermissionStatus | null> {
  if (!isAndroidNative()) return null;
  return SenayPermissionsNative.checkStatus();
}

export async function openExactAlarmSettings(): Promise<void> {
  if (!isAndroidNative()) return;
  await SenayPermissionsNative.openExactAlarmSettings();
}

export async function openAppSystemSettings(): Promise<void> {
  if (!isAndroidNative()) return;
  await SenayPermissionsNative.openAppSettings();
}

export { SenayPermissionsNative };
