package com.senay.app;

import android.content.Context;
import android.content.SharedPreferences;

import java.util.Collections;
import java.util.HashSet;
import java.util.Set;

/**
 * Persisted config for reading gate / app lock (SharedPreferences).
 */
public final class AppLockPrefs {
    private static final String PREFS = "senay_app_lock";
    private static final String KEY_ENABLED = "enabled";
    private static final String KEY_MODE = "mode"; // "paragraph" | "chapter"
    private static final String KEY_PACKAGES = "locked_packages"; // StringSet
    private static final String KEY_UNLOCK_TOKEN = "has_unlock_token";

    private AppLockPrefs() {}

    private static SharedPreferences p(Context ctx) {
        return ctx.getApplicationContext().getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    public static boolean isEnabled(Context ctx) {
        return p(ctx).getBoolean(KEY_ENABLED, false);
    }

    public static void setEnabled(Context ctx, boolean enabled) {
        p(ctx).edit().putBoolean(KEY_ENABLED, enabled).apply();
    }

    /** "paragraph" or "chapter" */
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

    public static boolean hasUnlockToken(Context ctx) {
        return p(ctx).getBoolean(KEY_UNLOCK_TOKEN, false);
    }

    public static void setUnlockToken(Context ctx, boolean value) {
        p(ctx).edit().putBoolean(KEY_UNLOCK_TOKEN, value).apply();
    }

    public static boolean isLockedPackage(Context ctx, String packageName) {
        if (packageName == null) return false;
        return getLockedPackages(ctx).contains(packageName);
    }

    /**
     * If user has a one-time unlock token and opens a locked app, consume token and allow access.
     */
    public static boolean tryConsumeUnlockForLockedApp(Context ctx, String packageName) {
        if (!isLockedPackage(ctx, packageName)) return false;
        if (!hasUnlockToken(ctx)) return false;
        setUnlockToken(ctx, false);
        return true;
    }

    /**
     * Grant unlock after completing reading in Senay (must match current mode).
     */
    public static void grantUnlockFromReading(Context ctx, String level) {
        String mode = getMode(ctx);
        if (mode.equals(level)) {
            setUnlockToken(ctx, true);
        }
    }
}
