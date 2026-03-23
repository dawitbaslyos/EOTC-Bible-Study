package com.senay.app;

import android.content.Context;
import android.content.SharedPreferences;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.Collections;
import java.util.HashSet;
import java.util.Set;

/**
 * Persisted config for focus lock + per-app gate passes.
 */
public final class AppLockPrefs {

    /** Guards pass / "left" reads and writes across the service and UI threads. */
    static final Object GATE_STATE_LOCK = new Object();

    private static final String PREFS = "senay_app_lock";
    private static final String KEY_ENABLED = "enabled";
    private static final String KEY_MODE = "mode"; // legacy, unused by overlay gate
    private static final String KEY_PACKAGES = "locked_packages";

    /** Pass expires 1 hour after completing the on-overlay reading. */
    public static final long GATE_PASS_VALID_MS = 60L * 60L * 1000L;

    private static final String KEY_UNLOCK_PREFIX = "gate_unlock_ms_";
    private static final String KEY_LEFT_PREFIX = "gate_left_";
    /** JSON array of { bookId, chapter, mode } queued for JS to merge into reading stats. */
    private static final String KEY_PENDING_GATE_QUEUE = "pending_gate_queue";

    private AppLockPrefs() {}

    private static SharedPreferences p(Context ctx) {
        return ctx.getApplicationContext().getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    private static String safePkg(String packageName) {
        if (packageName == null) return "";
        return packageName.replace('.', '_');
    }

    public static boolean isEnabled(Context ctx) {
        return p(ctx).getBoolean(KEY_ENABLED, false);
    }

    public static void setEnabled(Context ctx, boolean enabled) {
        p(ctx).edit().putBoolean(KEY_ENABLED, enabled).apply();
    }

    public static String getMode(Context ctx) {
        return p(ctx).getString(KEY_MODE, "paragraph");
    }

    public static void setMode(Context ctx, String mode) {
        if (!"paragraph".equals(mode) && !"chapter".equals(mode)) {
            mode = "paragraph";
        }
        p(ctx).edit().putString(KEY_MODE, mode).apply();
    }

    public static Set<String> getLockedPackages(Context ctx) {
        Set<String> raw = p(ctx).getStringSet(KEY_PACKAGES, null);
        if (raw == null) return Collections.emptySet();
        return new HashSet<>(raw);
    }

    public static void setLockedPackages(Context ctx, Set<String> packages) {
        p(ctx).edit().putStringSet(KEY_PACKAGES, new HashSet<>(packages)).apply();
    }

    public static boolean isLockedPackage(Context ctx, String packageName) {
        if (packageName == null) return false;
        return getLockedPackages(ctx).contains(packageName);
    }

    public static boolean isUserLeftSinceUnlock(Context ctx, String packageName) {
        synchronized (GATE_STATE_LOCK) {
            return p(ctx).getBoolean(KEY_LEFT_PREFIX + safePkg(packageName), false);
        }
    }

    public static void markUserLeftLockedApp(Context ctx, String packageName) {
        if (packageName == null) return;
        if (!isLockedPackage(ctx, packageName)) return;
        synchronized (GATE_STATE_LOCK) {
            p(ctx).edit().putBoolean(KEY_LEFT_PREFIX + safePkg(packageName), true).apply();
        }
    }

    public static long getLastGateUnlockTime(Context ctx, String packageName) {
        synchronized (GATE_STATE_LOCK) {
            return p(ctx).getLong(KEY_UNLOCK_PREFIX + safePkg(packageName), 0L);
        }
    }

    /**
     * User finished reading on the overlay and may use this app until they leave it or 1h passes.
     */
    public static void recordGateCompletion(Context ctx, String packageName) {
        if (packageName == null) return;
        String k = safePkg(packageName);
        synchronized (GATE_STATE_LOCK) {
            p(ctx).edit()
                    .putLong(KEY_UNLOCK_PREFIX + k, System.currentTimeMillis())
                    .putBoolean(KEY_LEFT_PREFIX + k, false)
                    .apply();
        }
    }

    public static boolean hasValidGatePass(Context ctx, String packageName) {
        synchronized (GATE_STATE_LOCK) {
            if (!isLockedPackage(ctx, packageName)) return true;
            long t = p(ctx).getLong(KEY_UNLOCK_PREFIX + safePkg(packageName), 0L);
            if (t <= 0L) return false;
            if (p(ctx).getBoolean(KEY_LEFT_PREFIX + safePkg(packageName), false)) return false;
            long age = System.currentTimeMillis() - t;
            return age < GATE_PASS_VALID_MS;
        }
    }

    public static void enqueuePendingGateCompletion(Context ctx, JSONObject row) {
        if (row == null) return;
        try {
            JSONArray arr = new JSONArray(p(ctx).getString(KEY_PENDING_GATE_QUEUE, "[]"));
            arr.put(row);
            p(ctx).edit().putString(KEY_PENDING_GATE_QUEUE, arr.toString()).apply();
        } catch (JSONException e) {
            p(ctx).edit().putString(KEY_PENDING_GATE_QUEUE, "[]").apply();
        }
    }

    /** Returns JSON array string and clears the queue. */
    public static String consumePendingGateQueue(Context ctx) {
        SharedPreferences pref = p(ctx);
        String s = pref.getString(KEY_PENDING_GATE_QUEUE, "[]");
        pref.edit().putString(KEY_PENDING_GATE_QUEUE, "[]").apply();
        return s != null ? s : "[]";
    }
}
