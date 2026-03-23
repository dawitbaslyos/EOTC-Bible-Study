package com.senay.app;

import android.app.AppOpsManager;
import android.app.usage.UsageStats;
import android.app.usage.UsageStatsManager;
import android.content.Context;
import android.os.Build;
import android.os.Process;

import java.util.List;
import java.util.TreeMap;

/**
 * Official foreground detection via {@link UsageStatsManager} (no logcat / running tasks).
 * User grants access in Settings → Apps → Special app access → Usage access.
 */
public final class UsageStatsHelper {

    /** How far back to look when picking the most recently used package. */
    private static final long DEFAULT_LOOKBACK_MS = 30_000L;

    private UsageStatsHelper() {}

    public static boolean hasUsageAccess(Context ctx) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.LOLLIPOP) {
            return false;
        }
        try {
            AppOpsManager appOps = (AppOpsManager) ctx.getSystemService(Context.APP_OPS_SERVICE);
            if (appOps == null) {
                return false;
            }
            int mode = appOps.checkOpNoThrow(
                    AppOpsManager.OPSTR_GET_USAGE_STATS,
                    Process.myUid(),
                    ctx.getPackageName());
            return mode == AppOpsManager.MODE_ALLOWED;
        } catch (Exception ignored) {
            return false;
        }
    }

    /**
     * Package with the greatest {@link UsageStats#getLastTimeUsed()} in the window, or null.
     */
    public static String getMostRecentPackage(Context ctx, long lookbackMs) {
        if (!hasUsageAccess(ctx) || Build.VERSION.SDK_INT < Build.VERSION_CODES.LOLLIPOP) {
            return null;
        }
        UsageStatsManager usm = (UsageStatsManager) ctx.getSystemService(Context.USAGE_STATS_SERVICE);
        if (usm == null) {
            return null;
        }
        long end = System.currentTimeMillis();
        long start = end - Math.max(5_000L, lookbackMs);
        List<UsageStats> stats = usm.queryUsageStats(UsageStatsManager.INTERVAL_BEST, start, end);
        if (stats == null || stats.isEmpty()) {
            return null;
        }
        TreeMap<Long, UsageStats> byLastUsed = new TreeMap<>();
        for (UsageStats s : stats) {
            if (s == null) {
                continue;
            }
            String pkg = s.getPackageName();
            if (pkg == null || pkg.isEmpty()) {
                continue;
            }
            byLastUsed.put(s.getLastTimeUsed(), s);
        }
        if (byLastUsed.isEmpty()) {
            return null;
        }
        return byLastUsed.lastEntry().getValue().getPackageName();
    }

    public static String getMostRecentPackage(Context ctx) {
        return getMostRecentPackage(ctx, DEFAULT_LOOKBACK_MS);
    }
}
