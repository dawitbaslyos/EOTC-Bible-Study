import type { EthiopianDate } from './ethiopianCalendar';
import { WidgetSync } from '../src/capacitor/widgetSync';

// Minimal data the Android widget would need
export interface WidgetSnapshot {
  dateLabel: string;
  yearLabel: string;
  saintOrHoliday: string | null;
  hasSaintOrHoliday: boolean;
  // Simple intensity values for the current month (0–4)
  monthHeatmap: number[];
  lastUpdated: number;
}

interface HeatmapItemLike {
  count: number;
  isPadding?: boolean;
}

export function buildWidgetSnapshot(
  ethDate: EthiopianDate,
  options: {
    todayHolidayName: string | null;
    saintOfToday: string | null;
    heatmapData: HeatmapItemLike[];
  }
): WidgetSnapshot {
  const { todayHolidayName, saintOfToday, heatmapData } = options;

  const monthHeatmap = heatmapData
    .filter((d) => !d.isPadding)
    .map((d) => {
      const c = d.count || 0;
      if (c === 0) return 0;
      if (c === 1) return 1;
      if (c === 2) return 2;
      if (c <= 4) return 3;
      return 4;
    });

  const saintOrHoliday = todayHolidayName || saintOfToday;

  return {
    dateLabel: `${ethDate.monthName} ${ethDate.day}`,
    yearLabel: ethDate.yearName,
    saintOrHoliday: saintOrHoliday || null,
    hasSaintOrHoliday: !!saintOrHoliday,
    monthHeatmap,
    lastUpdated: Date.now(),
  };
}

export function persistWidgetSnapshot(snapshot: WidgetSnapshot) {
  try {
    const payload = JSON.stringify(snapshot);
    localStorage.setItem('senay_widget_snapshot', payload);

     // Also push to native side (Capacitor plugin) if available
     WidgetSync.saveSnapshot({ snapshot: payload }).catch((err) => {
       console.warn('WidgetSync.saveSnapshot failed (likely web dev env):', err);
     });
  } catch (err) {
    // Best-effort only; widget is a nice-to-have
    console.error('Failed to persist widget snapshot', err);
  }
}

