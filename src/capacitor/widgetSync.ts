import { registerPlugin } from '@capacitor/core';

export interface WidgetSyncPlugin {
  saveSnapshot(options: { snapshot: string }): Promise<void>;
}

export const WidgetSync = registerPlugin<WidgetSyncPlugin>('WidgetSync', {
  // Web fallback: no-op so dev in browser still works
  web: () => ({
    async saveSnapshot() {
      return;
    },
  }),
});

